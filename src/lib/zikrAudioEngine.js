// High-performance Web Audio API engine for repeating custom uploaded audio files
// Generates lossless 16-bit WAV PCM audio and exact synchronized SRT subtitles for every repeat.

import { audioBufferToWavBlob, extractWaveformPeaks } from "./audioEngine";

/**
 * Decode an uploaded audio File/Blob into an AudioBuffer using AudioContext.
 */
export async function decodeUploadedAudioFile(file) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("Web Audio API is not supported in this browser.");
  }

  const ctx = new AudioContextClass();
  try {
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } finally {
    ctx.close().catch(() => {});
  }
}

/**
 * Render timeline of repeated custom audio clips into a single combined lossless audio file
 * and generate exact timestamped segments for subtitles.
 * 
 * @param {Array} zikrItems - Array of { id, title, audioBuffer, duration, repeatCount, arabic, english, bengali }
 * @param {Object} options - { gapSeconds: 0.3, onProgress: (step, percent) => void }
 * @returns {Promise<{ audioBlob, audioUrl, duration, segments, waveformPeaks, sampleRate }>}
 */
export async function renderRepeatedTimelineAudio(zikrItems, options = {}) {
  const { gapSeconds = 0.3, onProgress = () => {} } = options;

  if (!zikrItems || zikrItems.length === 0) {
    throw new Error("Timeline is empty. Please add at least one audio item.");
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("Web Audio API is not supported in this browser.");
  }

  onProgress("preparing", { percentage: 10, message: "Analyzing audio buffers and repeat counts..." });

  // 1. Determine common audio specs
  const targetSampleRate = zikrItems[0]?.audioBuffer?.sampleRate || 44100;
  const numberOfChannels = Math.max(
    ...zikrItems.map((item) => item.audioBuffer?.numberOfChannels || 1)
  );
  const gapSamples = Math.round(gapSeconds * targetSampleRate);

  // 2. Calculate total samples and build timeline segment markers
  let totalSamples = 0;
  let currentTimelineSeconds = 0;
  const segments = [];

  for (let itemIdx = 0; itemIdx < zikrItems.length; itemIdx++) {
    const item = zikrItems[itemIdx];
    const repeats = Math.max(1, parseInt(item.repeatCount, 10) || 1);
    const buffer = item.audioBuffer;

    if (!buffer) {
      throw new Error(`Audio buffer missing for item: "${item.title || "Custom Audio"}"`);
    }

    const durationSec = buffer.duration;
    const itemSamples = buffer.length;

    for (let r = 1; r <= repeats; r++) {
      const startSec = currentTimelineSeconds;
      const endSec = startSec + durationSec;

      segments.push({
        index: segments.length + 1,
        title: item.title,
        arabic: item.arabic || "",
        english: item.english || "",
        bengali: item.bengali || "",
        repeatIndex: r,
        totalRepeats: repeats,
        startTime: startSec,
        endTime: endSec,
        duration: durationSec,
      });

      totalSamples += itemSamples;
      currentTimelineSeconds = endSec;

      // Add gap between repetitions (and between items)
      totalSamples += gapSamples;
      currentTimelineSeconds += gapSeconds;
    }
  }

  onProgress("rendering", { percentage: 50, message: "Hardware-accelerated rendering in browser..." });

  // 3. Hardware-Accelerated OfflineAudioContext Rendering
  const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(
    numberOfChannels,
    Math.max(1, totalSamples),
    targetSampleRate
  );

  let scheduleSampleOffset = 0;

  for (let itemIdx = 0; itemIdx < zikrItems.length; itemIdx++) {
    const item = zikrItems[itemIdx];
    const repeats = Math.max(1, parseInt(item.repeatCount, 10) || 1);
    const buffer = item.audioBuffer;

    for (let r = 1; r <= repeats; r++) {
      const source = offlineCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(offlineCtx.destination);

      const scheduleTime = scheduleSampleOffset / targetSampleRate;
      source.start(scheduleTime);

      scheduleSampleOffset += buffer.length + gapSamples;
    }
  }

  const renderedBuffer = await offlineCtx.startRendering();

  onProgress("encoding", { percentage: 85, message: "Encoding studio-quality lossless 16-bit WAV..." });

  // 4. Lossless 16-bit PCM WAV encoding
  const wavBlob = audioBufferToWavBlob(renderedBuffer);
  const audioUrl = URL.createObjectURL(wavBlob);

  // 5. Extract 512 waveform peaks for 60fps WebGL rendering
  const waveformPeaks = extractWaveformPeaks(renderedBuffer, 512);

  onProgress("complete", { percentage: 100, message: "Complete!" });

  return {
    audioBlob: wavBlob,
    audioUrl,
    duration: renderedBuffer.duration,
    segments,
    waveformPeaks,
    sampleRate: targetSampleRate,
    numberOfChannels,
  };
}
