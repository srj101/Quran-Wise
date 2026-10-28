import JSZip from "jszip";

/**
 * Format seconds into SRT timestamp string HH:MM:SS,mmm
 */
export function formatSrtTimestamp(seconds) {
  const totalMs = Math.round(seconds * 1000);
  const ms = totalMs % 1000;
  const totalSec = Math.floor(totalMs / 1000);
  const sec = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const min = totalMin % 60;
  const hours = Math.floor(totalMin / 60);

  const pad = (num, size = 2) => String(num).padStart(size, "0");

  return `${pad(hours)}:${pad(min)}:${pad(sec)},${pad(ms, 3)}`;
}

/**
 * Format seconds into WebVTT timestamp string HH:MM:SS.mmm
 */
export function formatVttTimestamp(seconds) {
  return formatSrtTimestamp(seconds).replace(",", ".");
}

/**
 * Generate Arabic SRT subtitle file content.
 */
export function generateArabicSrt(segments) {
  return segments
    .map((seg, i) => {
      const start = formatSrtTimestamp(seg.startTime);
      const end = formatSrtTimestamp(seg.endTime);
      return `${i + 1}\n${start} --> ${end}\n${seg.arabic} (${seg.ayahNumber})\n`;
    })
    .join("\n");
}

/**
 * Generate English SRT subtitle file content.
 */
export function generateEnglishSrt(segments) {
  return segments
    .map((seg, i) => {
      const start = formatSrtTimestamp(seg.startTime);
      const end = formatSrtTimestamp(seg.endTime);
      return `${i + 1}\n${start} --> ${end}\n[${seg.surahName} ${seg.surahId}:${seg.ayahNumber}]\n${seg.english}\n`;
    })
    .join("\n");
}

/**
 * Generate Dual / Bilingual SRT subtitle file content (Arabic + English).
 */
export function generateBilingualSrt(segments) {
  return segments
    .map((seg, i) => {
      const start = formatSrtTimestamp(seg.startTime);
      const end = formatSrtTimestamp(seg.endTime);
      return `${i + 1}\n${start} --> ${end}\n${seg.arabic}\n[${seg.surahName} ${seg.surahId}:${seg.ayahNumber}] ${seg.english}\n`;
    })
    .join("\n");
}

/**
 * Generate WebVTT content for browser player track.
 */
export function generateVtt(segments) {
  const header = "WEBVTT - Quran-Wise Subtitles\n\n";
  const body = segments
    .map((seg, i) => {
      const start = formatVttTimestamp(seg.startTime);
      const end = formatVttTimestamp(seg.endTime);
      return `${i + 1}\n${start} --> ${end}\n${seg.arabic}\n${seg.english}\n`;
    })
    .join("\n");
  return header + body;
}

/**
 * Trigger browser file download from Blob or String.
 */
export function downloadFile(content, filename, mimeType = "text/plain;charset=utf-8") {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Bundle all output files (WAV Audio, Arabic SRT, English SRT, Bilingual SRT, Summary)
 * into a single compressed ZIP file.
 */
export async function downloadZipBundle({
  zipFilename = "QuranWise_Audio_Subtitles.zip",
  audioBlob,
  audioFilename = "combined_quran_audio.wav",
  segments,
  reciterName = "Reciter",
}) {
  const zip = new JSZip();

  // 1. Audio file
  if (audioBlob) {
    zip.file(audioFilename, audioBlob);
  }

  // 2. Arabic SRT
  const arabicSrt = generateArabicSrt(segments);
  zip.file("subtitles_arabic.srt", arabicSrt);

  // 3. English SRT
  const englishSrt = generateEnglishSrt(segments);
  zip.file("subtitles_english.srt", englishSrt);

  // 4. Bilingual SRT
  const bilingualSrt = generateBilingualSrt(segments);
  zip.file("subtitles_bilingual.srt", bilingualSrt);

  // 5. WebVTT
  const vtt = generateVtt(segments);
  zip.file("subtitles.vtt", vtt);

  // 6. Metadata Readme
  const summary = `Quran-Wise Audio & Subtitles Package
Generated: ${new Date().toISOString()}
Reciter: ${reciterName}
Total Ayahs: ${segments.length}
Total Duration: ${segments[segments.length - 1]?.endTime.toFixed(2)} seconds

Verses Included:
${segments.map((s) => `• Surah ${s.surahName} (${s.surahId}:${s.ayahNumber}) - Duration: ${(s.endTime - s.startTime).toFixed(2)}s`).join("\n")}
`;
  zip.file("README.txt", summary);

  const zipBlob = await zip.generateAsync({ type: "blob" });
  downloadFile(zipBlob, zipFilename, "application/zip");
}
