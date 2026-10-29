// High-performance Web Audio API engine for combining Quran ayahs
// Uses official MP3Quran.net audio and official Ayah-level timing maps.
// Slices exact ayah PCM samples and merges them with hardware-accelerated OfflineAudioContext.

import { RECITERS } from "@/data/reciters";

// In-memory ArrayBuffer cache to avoid duplicate network fetches
const audioBufferCache = new Map();
const timingCache = new Map();

/**
 * Fetch official Ayah timing data for a Surah and Reciter.
 */
export async function fetchAyahTimings(surahId, readId = 123) {
  const cacheKey = `${readId}_${surahId}`;
  if (timingCache.has(cacheKey)) {
    return timingCache.get(cacheKey);
  }

  // Attempt 1: Internal API proxy
  try {
    const res = await fetch(`/api/quran/timing?surah=${surahId}&read=${readId}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        timingCache.set(cacheKey, data);
        return data;
      }
    }
  } catch (err) {
    console.warn(`Internal timing fetch failed for Surah ${surahId}, trying direct endpoint...`, err);
  }

  // Attempt 2: Direct MP3Quran API v3
  try {
    const res = await fetch(
      `https://www.mp3quran.net/api/v3/ayat_timing?surah=${surahId}&read=${readId}`,
      { mode: "cors" }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const timings = data.map((item) => ({
          ayah: item.ayah,
          startTimeMs: item.start_time,
          endTimeMs: item.end_time,
          startSec: item.start_time / 1000,
          endSec: item.end_time / 1000,
          durationSec: (item.end_time - item.start_time) / 1000,
        }));
        timingCache.set(cacheKey, timings);
        return timings;
      }
    }
  } catch (err) {
    console.error(`Direct MP3Quran timing fetch failed for Surah ${surahId}:`, err);
  }

  throw new Error(`Failed to load ayah timing for Surah ${surahId}`);
}

/**
 * Fetch raw audio ArrayBuffer with fallback candidate URLs.
 */
export async function fetchAudioWithFallback(candidateUrls) {
  const urls = Array.isArray(candidateUrls) ? candidateUrls : [candidateUrls];

  for (const url of urls) {
    if (audioBufferCache.has(url)) {
      return audioBufferCache.get(url).slice(0);
    }
  }

  let lastError = null;
  for (const url of urls) {
    try {
      const response = await fetch(url, { mode: "cors" });
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength > 1000) {
          // Keep cache limited to prevent memory bloat
          if (audioBufferCache.size > 20) {
            const firstKey = audioBufferCache.keys().next().value;
            audioBufferCache.delete(firstKey);
          }
          audioBufferCache.set(url, arrayBuffer);
          return arrayBuffer.slice(0);
        }
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(`Failed to download audio from: ${urls[0]} (${lastError?.message || ""})`);
}

/**
 * Decode raw audio ArrayBuffer into an AudioBuffer using a temporary AudioContext.
 */
export async function decodeAudioBuffer(audioCtx, arrayBuffer) {
  return await audioCtx.decodeAudioData(arrayBuffer);
}

/**
 * Slice an exact segment from an AudioBuffer with a 3ms cosine crossfade at edges to eliminate clicks.
 */
export function sliceAudioBuffer(audioCtx, originalBuffer, startSec, endSec) {
  const sampleRate = originalBuffer.sampleRate;
  const startSample = Math.max(0, Math.floor(startSec * sampleRate));
  const endSample = Math.min(originalBuffer.length, Math.ceil(endSec * sampleRate));
  const frameCount = endSample - startSample;

  if (frameCount <= 0) {
    return null;
  }

  const sliced = audioCtx.createBuffer(
    originalBuffer.numberOfChannels,
    frameCount,
    sampleRate
  );

  for (let ch = 0; ch < originalBuffer.numberOfChannels; ch++) {
    const originalData = originalBuffer.getChannelData(ch);
    const slicedData = sliced.getChannelData(ch);

    // Fast copy subarray
    slicedData.set(originalData.subarray(startSample, endSample));

    // Smooth 3ms cosine fade-in and fade-out to prevent boundary pops/clicks
    const fadeSamples = Math.min(Math.round(sampleRate * 0.003), Math.floor(frameCount / 2));
    for (let i = 0; i < fadeSamples; i++) {
      const factor = 0.5 * (1 - Math.cos((Math.PI * i) / fadeSamples));
      slicedData[i] *= factor;
      slicedData[frameCount - 1 - i] *= factor;
    }
  }

  return sliced;
}

/**
 * Combine timeline ayahs using MP3Quran audio and official timing maps.
 * 
 * @param {Array} timelineItems - Array of { surahId, surahName, ayahNumber, arabic, english, bengali }
 * @param {Object} options - { reciterId, gapSeconds, onProgress }
 */
export async function renderTimelineAudio(timelineItems, options = {}) {
  const {
    reciterId = "alafasy",
    gapSeconds = 0.3,
    onProgress = () => {},
  } = options;

  if (!timelineItems || timelineItems.length === 0) {
    throw new Error("Timeline is empty. Please add at least one ayah.");
  }

  const reciter =
    RECITERS.find((r) => r.id === reciterId || r.readId === reciterId) || RECITERS[0];

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("Web Audio API is not supported in this browser.");
  }

  const tempCtx = new AudioContextClass();
  const totalItems = timelineItems.length;

  try {
    // Step 1: Identify all unique Surahs required in the timeline
    const uniqueSurahs = Array.from(new Set(timelineItems.map((item) => Number(item.surahId))));
    const surahSlicesMap = new Map(); // key: `${surahId}_${ayahNumber}` -> AudioBuffer

    let surahProcessed = 0;

    for (const sId of uniqueSurahs) {
      onProgress("downloading", {
        current: surahProcessed + 1,
        total: uniqueSurahs.length,
        percentage: Math.round(((surahProcessed + 0.3) / uniqueSurahs.length) * 45),
        message: `Loading Surah ${sId} audio & official timings (${surahProcessed + 1}/${uniqueSurahs.length})...`,
      });

      // 1. Fetch timing data for this Surah
      const timings = await fetchAyahTimings(sId, reciter.readId);

      // 2. Fetch Surah audio from MP3Quran CDN / server8
      const surahUrls = reciter.getSurahUrls(sId);
      const rawAudio = await fetchAudioWithFallback(surahUrls);

      // 3. Decode Surah Audio
      const decodedSurahBuffer = await decodeAudioBuffer(tempCtx, rawAudio);

      // 4. Extract all needed Ayahs for this Surah
      const neededAyahs = timelineItems.filter((item) => Number(item.surahId) === sId);

      for (const item of neededAyahs) {
        const timing = timings.find((t) => Number(t.ayah) === Number(item.ayahNumber));
        if (timing) {
          const slice = sliceAudioBuffer(
            tempCtx,
            decodedSurahBuffer,
            timing.startSec,
            timing.endSec
          );
          if (slice) {
            surahSlicesMap.set(`${sId}_${item.ayahNumber}`, slice);
          }
        }
      }

      surahProcessed++;
      onProgress("decoding", {
        current: surahProcessed,
        total: uniqueSurahs.length,
        percentage: 45 + Math.round((surahProcessed / uniqueSurahs.length) * 25),
        message: `Sliced ayahs for Surah ${sId}`,
      });
    }

    // Step 2: Re-assemble individual ayah slices in the EXACT serial timeline order
    const orderedBuffers = [];
    const segments = [];

    let currentTimelineSeconds = 0;
    let totalSamples = 0;

    const sampleRate = tempCtx.sampleRate || 44100;
    const gapSamples = Math.round(gapSeconds * sampleRate);

    for (let idx = 0; idx < timelineItems.length; idx++) {
      const item = timelineItems[idx];
      const sliceKey = `${item.surahId}_${item.ayahNumber}`;
      let sliceBuffer = surahSlicesMap.get(sliceKey);

      // If for some rare edge case slice is missing, create a small fallback silence
      if (!sliceBuffer) {
        sliceBuffer = tempCtx.createBuffer(2, sampleRate * 2, sampleRate);
      }

      orderedBuffers.push(sliceBuffer);

      const startSec = currentTimelineSeconds;
      const durationSec = sliceBuffer.duration;
      const endSec = startSec + durationSec;

      segments.push({
        index: idx + 1,
        surahId: item.surahId,
        surahName: item.surahName,
        ayahNumber: item.ayahNumber,
        arabic: item.arabic,
        english: item.english,
        bengali: item.bengali || "",
        startTime: startSec,
        endTime: endSec,
        duration: durationSec,
      });

      totalSamples += sliceBuffer.length;
      currentTimelineSeconds = endSec;

      if (idx < timelineItems.length - 1) {
        totalSamples += gapSamples;
        currentTimelineSeconds += gapSeconds;
      }
    }

    onProgress("mixing", { percentage: 75, message: "Hardware-accelerated mixing with OfflineAudioContext..." });

    // Step 3: Hardware-accelerated offline mixing
    const numberOfChannels = Math.max(...orderedBuffers.map((b) => b.numberOfChannels || 1));
    const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
      numberOfChannels,
      totalSamples,
      sampleRate
    );

    let scheduleSampleOffset = 0;
    orderedBuffers.forEach((buffer, idx) => {
      const source = offlineCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(offlineCtx.destination);
      const scheduleTime = scheduleSampleOffset / sampleRate;
      source.start(scheduleTime);

      scheduleSampleOffset += buffer.length;
      if (idx < orderedBuffers.length - 1) {
        scheduleSampleOffset += gapSamples;
      }
    });

    const renderedBuffer = await offlineCtx.startRendering();

    onProgress("encoding", { percentage: 90, message: "Encoding pristine 16-bit Lossless WAV..." });

    // Step 4: Lossless 16-bit PCM WAV encoding
    const wavBlob = audioBufferToWavBlob(renderedBuffer);
    const audioUrl = URL.createObjectURL(wavBlob);

    // Step 5: Extract 512 waveform peaks for 60fps WebGL rendering
    const waveformPeaks = extractWaveformPeaks(renderedBuffer, 512);

    onProgress("complete", { percentage: 100, message: "Done!" });

    return {
      audioBlob: wavBlob,
      audioUrl,
      duration: renderedBuffer.duration,
      segments,
      waveformPeaks,
      sampleRate,
      numberOfChannels,
    };
  } finally {
    tempCtx.close().catch(() => {});
  }
}

/**
 * Lossless 16-bit PCM WAV Encoder.
 * Writes a valid standard RIFF WAV file from an AudioBuffer.
 */
export function audioBufferToWavBlob(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");

  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);

  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  const channelData = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channelData.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = channelData[ch][i];
      sample = Math.max(-1, Math.min(1, sample));
      const intSample = sample < 0 ? sample * 32768 : sample * 32767;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

/**
 * Extract normalized peaks array for fast WebGL and Canvas rendering.
 */
export function extractWaveformPeaks(buffer, numPeaks = 512) {
  const channelData = buffer.getChannelData(0);
  const step = Math.floor(channelData.length / numPeaks);
  const peaks = new Float32Array(numPeaks);

  for (let i = 0; i < numPeaks; i++) {
    const start = i * step;
    const end = Math.min(start + step, channelData.length);
    let max = 0;
    for (let j = start; j < end; j++) {
      const val = Math.abs(channelData[j]);
      if (val > max) max = val;
    }
    peaks[i] = max;
  }

  return peaks;
}
