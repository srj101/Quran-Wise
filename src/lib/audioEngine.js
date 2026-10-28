// High-performance Web Audio API engine for combining Quran ayahs
// Uses OfflineAudioContext for hardware-accelerated mixing and lossless 16-bit PCM WAV encoding.

// In-memory ArrayBuffer cache to avoid duplicate network fetches
const audioBufferCache = new Map();

/**
 * Fetch raw audio ArrayBuffer for a given URL with fallback candidates.
 */
export async function fetchAudioWithFallback(candidateUrls) {
  const urls = Array.isArray(candidateUrls) ? candidateUrls : [candidateUrls];

  for (const url of urls) {
    if (audioBufferCache.has(url)) {
      // Return a copy of cached buffer so decodeAudioData detach doesn't corrupt it
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
          // Cache successful buffer (limit cache size to ~100 entries to prevent memory bloating)
          if (audioBufferCache.size > 150) {
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

  throw new Error(`Failed to download audio from candidate sources: ${urls[0]}`);
}

/**
 * Decode raw audio ArrayBuffer into an AudioBuffer using a temporary AudioContext.
 */
export async function decodeAudioBuffer(audioCtx, arrayBuffer) {
  return await audioCtx.decodeAudioData(arrayBuffer);
}

/**
 * Combine multiple ayahs into a single lossless AudioBuffer and generate accurate timestamps.
 * 
 * @param {Array} timelineItems - Array of { surahId, surahName, ayahNumber, candidateUrls, arabic, english }
 * @param {Object} options - { gapSeconds: 0.3, onProgress: (step, percent) => void }
 * @returns {Promise<{ audioBlob, audioUrl, duration, segments, waveformPeaks, sampleRate }>}
 */
export async function renderTimelineAudio(timelineItems, options = {}) {
  const { gapSeconds = 0.3, onProgress = () => {} } = options;

  if (!timelineItems || timelineItems.length === 0) {
    throw new Error("Timeline is empty. Please add at least one ayah.");
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("Web Audio API is not supported in this browser.");
  }

  const tempCtx = new AudioContextClass();
  const decodedBuffers = [];
  const segments = [];
  const totalItems = timelineItems.length;

  try {
    // Step 1: Download & Decode each Ayah in parallel chunks of 3 for fast throughput without connection flooding
    const CHUNK_SIZE = 3;
    let completedCount = 0;

    for (let i = 0; i < totalItems; i += CHUNK_SIZE) {
      const chunk = timelineItems.slice(i, i + CHUNK_SIZE);
      const chunkResults = await Promise.all(
        chunk.map(async (item, chunkIndex) => {
          const itemIdx = i + chunkIndex;
          onProgress("downloading", {
            current: itemIdx + 1,
            total: totalItems,
            percentage: Math.round(((itemIdx + 0.5) / totalItems) * 50),
          });

          const rawBuffer = await fetchAudioWithFallback(item.candidateUrls);
          const decoded = await decodeAudioBuffer(tempCtx, rawBuffer);
          return { item, decoded, index: itemIdx };
        })
      );

      for (const res of chunkResults) {
        decodedBuffers[res.index] = res.decoded;
        completedCount++;
        onProgress("decoding", {
          current: completedCount,
          total: totalItems,
          percentage: 50 + Math.round((completedCount / totalItems) * 20),
        });
      }
    }

    // Step 2: Compute target audio parameters and total duration
    const targetSampleRate = decodedBuffers[0]?.sampleRate || 44100;
    const numberOfChannels = Math.max(...decodedBuffers.map((b) => b.numberOfChannels || 1));
    const gapSamples = Math.round(gapSeconds * targetSampleRate);

    let totalSamples = 0;
    let currentTimelineSeconds = 0;

    decodedBuffers.forEach((buffer, idx) => {
      const item = timelineItems[idx];
      const startSec = currentTimelineSeconds;
      const durationSec = buffer.duration;
      const endSec = startSec + durationSec;

      segments.push({
        index: idx + 1,
        surahId: item.surahId,
        surahName: item.surahName,
        ayahNumber: item.ayahNumber,
        arabic: item.arabic,
        english: item.english,
        startTime: startSec,
        endTime: endSec,
        duration: durationSec,
      });

      totalSamples += buffer.length;
      currentTimelineSeconds = endSec;

      // Add gap if not the last item
      if (idx < decodedBuffers.length - 1) {
        totalSamples += gapSamples;
        currentTimelineSeconds += gapSeconds;
      }
    });

    onProgress("mixing", { percentage: 75, message: "Hardware-accelerated mixing..." });

    // Step 3: Offline Hardware-Accelerated Mixing
    const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
      numberOfChannels,
      totalSamples,
      targetSampleRate
    );

    let scheduleSampleOffset = 0;
    decodedBuffers.forEach((buffer, idx) => {
      const source = offlineCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(offlineCtx.destination);
      const scheduleTime = scheduleSampleOffset / targetSampleRate;
      source.start(scheduleTime);

      scheduleSampleOffset += buffer.length;
      if (idx < decodedBuffers.length - 1) {
        scheduleSampleOffset += gapSamples;
      }
    });

    const renderedBuffer = await offlineCtx.startRendering();
    onProgress("encoding", { percentage: 90, message: "Encoding pristine 16-bit WAV..." });

    // Step 4: Lossless 16-bit PCM WAV encoding
    const wavBlob = audioBufferToWavBlob(renderedBuffer);
    const audioUrl = URL.createObjectURL(wavBlob);

    // Step 5: Extract 512 waveform peaks for high-speed WebGL rendering
    const waveformPeaks = extractWaveformPeaks(renderedBuffer, 512);

    onProgress("complete", { percentage: 100, message: "Processing complete!" });

    return {
      audioBlob: wavBlob,
      audioUrl,
      duration: renderedBuffer.duration,
      segments,
      waveformPeaks,
      sampleRate: targetSampleRate,
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

  // Helper to write ASCII strings
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF Chunk
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true); // chunkSize
  writeString(8, "WAVE");

  // "fmt " Subchunk
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bitsPerSample

  // "data" Subchunk
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  // Interleave channel samples and convert Float32 [-1.0, 1.0] to 16-bit PCM Signed Integer
  const channelData = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channelData.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = channelData[ch][i];
      // Clamp to prevent digital clipping distortion
      sample = Math.max(-1, Math.min(1, sample));
      // Scale to 16-bit signed integer range [-32768, 32767]
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
