import JSZip from "jszip";
import { cleanArabicText, cleanTranslationText } from "./quranApi";

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
 * Intelligently wrap long text into multiple balanced lines (max chars per line)
 * without breaking words, respecting punctuation and phrasing.
 * 
 * @param {string} text - The input text to wrap
 * @param {number} maxLineChars - Target maximum characters per line (default: 48)
 * @returns {string} Text formatted with natural newline breaks
 */
export function wrapSubtitleText(text, maxLineChars = 48) {
  if (!text) return "";
  const cleaned = text.trim();
  if (cleaned.length <= maxLineChars) return cleaned;

  const words = cleaned.split(/\s+/);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + " " + word).length <= maxLineChars) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.join("\n");
}

/**
 * Break long ayah into sequential timed sub-segments if duration or word count is large.
 * Proportionally divides start and end times based on character/word weight.
 * 
 * @param {Array} segments - Array of segment objects
 * @param {Object} options - { maxWordsPerSegment: 14, minDurationForSplit: 7.0 }
 * @returns {Array} Flattened array of sub-segments
 */
export function expandSegmentsForSubtitles(segments, options = {}) {
  const { maxWordsPerSegment = 14, minDurationForSplit = 6.5 } = options;
  const expanded = [];

  for (const seg of segments) {
    const duration = seg.endTime - seg.startTime;
    const arabicWords = cleanArabicText(seg.arabic).split(/\s+/).filter(Boolean);
    const englishWords = cleanTranslationText(seg.english).split(/\s+/).filter(Boolean);
    const bengaliWords = cleanTranslationText(seg.bengali || "").split(/\s+/).filter(Boolean);

    const maxWords = Math.max(arabicWords.length, englishWords.length);

    // If verse is short enough, keep as single segment
    if (duration < minDurationForSplit || maxWords <= maxWordsPerSegment) {
      expanded.push({
        ...seg,
        arabic: cleanArabicText(seg.arabic),
        english: cleanTranslationText(seg.english),
        bengali: cleanTranslationText(seg.bengali),
      });
      continue;
    }

    // Determine number of chunks (2 to 4 chunks)
    const numChunks = Math.min(4, Math.ceil(maxWords / maxWordsPerSegment));
    const chunkDuration = duration / numChunks;

    const chunkArray = (arr, parts) => {
      const result = [];
      const size = Math.ceil(arr.length / parts);
      for (let i = 0; i < parts; i++) {
        const slice = arr.slice(i * size, (i + 1) * size);
        if (slice.length > 0) result.push(slice.join(" "));
      }
      return result;
    };

    const arChunks = chunkArray(arabicWords, numChunks);
    const enChunks = chunkArray(englishWords, numChunks);
    const bnChunks = bengaliWords.length > 0 ? chunkArray(bengaliWords, numChunks) : [];

    for (let c = 0; c < numChunks; c++) {
      const subStart = seg.startTime + c * chunkDuration;
      const subEnd = c === numChunks - 1 ? seg.endTime : subStart + chunkDuration;

      expanded.push({
        ...seg,
        startTime: subStart,
        endTime: subEnd,
        arabic: arChunks[c] || arChunks[arChunks.length - 1] || "",
        english: enChunks[c] || enChunks[enChunks.length - 1] || "",
        bengali: bnChunks[c] || (bnChunks.length > 0 ? bnChunks[bnChunks.length - 1] : ""),
        isSubSegment: true,
        subIndex: c + 1,
        totalSubSegments: numChunks,
      });
    }
  }

  return expanded;
}

/**
 * Generate Pure Arabic SRT without any numbers or citation prefixes.
 * Long lines are wrapped naturally or divided into timed sub-cues.
 */
export function generateArabicSrt(segments, options = { splitLongCues: true }) {
  const list = options.splitLongCues ? expandSegmentsForSubtitles(segments) : segments;

  return list
    .map((seg, i) => {
      const start = formatSrtTimestamp(seg.startTime);
      const end = formatSrtTimestamp(seg.endTime);
      const rawArabic = cleanArabicText(seg.arabic);
      const formattedArabic = wrapSubtitleText(rawArabic, 44);
      return `${i + 1}\n${start} --> ${end}\n${formattedArabic}\n`;
    })
    .join("\n");
}

/**
 * Generate Pure English SRT without any metadata headers or prefixes like [Al-Fatihah 1:1].
 * Long lines are wrapped naturally or divided into timed sub-cues.
 */
export function generateEnglishSrt(segments, options = { splitLongCues: true }) {
  const list = options.splitLongCues ? expandSegmentsForSubtitles(segments) : segments;

  return list
    .map((seg, i) => {
      const start = formatSrtTimestamp(seg.startTime);
      const end = formatSrtTimestamp(seg.endTime);
      const rawEnglish = cleanTranslationText(seg.english);
      const formattedEnglish = wrapSubtitleText(rawEnglish, 48);
      return `${i + 1}\n${start} --> ${end}\n${formattedEnglish}\n`;
    })
    .join("\n");
}

/**
 * Generate Pure Bengali SRT without any metadata headers or verse numbers.
 * Long lines are wrapped naturally or divided into timed sub-cues.
 */
export function generateBengaliSrt(segments, options = { splitLongCues: true }) {
  const list = options.splitLongCues ? expandSegmentsForSubtitles(segments) : segments;

  return list
    .map((seg, i) => {
      const start = formatSrtTimestamp(seg.startTime);
      const end = formatSrtTimestamp(seg.endTime);
      const rawBengali = cleanTranslationText(seg.bengali || seg.english);
      const formattedBengali = wrapSubtitleText(rawBengali, 48);
      return `${i + 1}\n${start} --> ${end}\n${formattedBengali}\n`;
    })
    .join("\n");
}

/**
 * Generate Dual / Bilingual SRT subtitle file content.
 * Supports:
 * - 'english': Raw Arabic on top, Raw English on bottom
 * - 'bengali': Raw Arabic on top, Raw Bengali on bottom
 */
export function generateBilingualSrt(
  segments,
  options = { lang: "english", splitLongCues: true }
) {
  const list = options.splitLongCues ? expandSegmentsForSubtitles(segments) : segments;
  const isBengali = options.lang === "bengali";

  return list
    .map((seg, i) => {
      const start = formatSrtTimestamp(seg.startTime);
      const end = formatSrtTimestamp(seg.endTime);

      const rawArabic = cleanArabicText(seg.arabic);
      const rawTranslation = cleanTranslationText(
        isBengali ? seg.bengali || seg.english : seg.english
      );

      const formattedArabic = wrapSubtitleText(rawArabic, 44);
      const formattedTranslation = wrapSubtitleText(rawTranslation, 48);

      return `${i + 1}\n${start} --> ${end}\n${formattedArabic}\n${formattedTranslation}\n`;
    })
    .join("\n");
}

/**
 * Generate WebVTT content for browser player track.
 */
export function generateVtt(segments, options = { lang: "english" }) {
  const isBengali = options.lang === "bengali";
  const header = "WEBVTT - Quran-Wise Subtitles\n\n";
  const list = expandSegmentsForSubtitles(segments);

  const body = list
    .map((seg, i) => {
      const start = formatVttTimestamp(seg.startTime);
      const end = formatVttTimestamp(seg.endTime);
      const ar = wrapSubtitleText(cleanArabicText(seg.arabic), 44);
      const tr = wrapSubtitleText(
        cleanTranslationText(isBengali ? seg.bengali || seg.english : seg.english),
        48
      );
      return `${i + 1}\n${start} --> ${end}\n${ar}\n${tr}\n`;
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
 * Bundle all output files (WAV Audio, Arabic SRT, English SRT, Bengali SRT, Bilingual SRTs, Summary)
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

  // 1. Lossless Audio
  if (audioBlob) {
    zip.file(audioFilename, audioBlob);
  }

  // 2. Pure Raw Arabic SRT
  const arabicSrt = generateArabicSrt(segments);
  zip.file("subtitles_arabic_raw.srt", arabicSrt);

  // 3. Pure Raw English SRT
  const englishSrt = generateEnglishSrt(segments);
  zip.file("subtitles_english_raw.srt", englishSrt);

  // 4. Pure Raw Bengali SRT
  const bengaliSrt = generateBengaliSrt(segments);
  zip.file("subtitles_bengali_raw.srt", bengaliSrt);

  // 5. Bilingual Arabic + English SRT
  const bilingualEnSrt = generateBilingualSrt(segments, { lang: "english", splitLongCues: true });
  zip.file("subtitles_bilingual_ar_en.srt", bilingualEnSrt);

  // 6. Bilingual Arabic + Bengali SRT
  const bilingualBnSrt = generateBilingualSrt(segments, { lang: "bengali", splitLongCues: true });
  zip.file("subtitles_bilingual_ar_bn.srt", bilingualBnSrt);

  // 7. WebVTT
  const vtt = generateVtt(segments);
  zip.file("subtitles.vtt", vtt);

  // 8. Summary Metadata
  const summary = `Quran-Wise Audio & Subtitles Package
Generated: ${new Date().toISOString()}
Reciter: ${reciterName}
Total Ayahs: ${segments.length}
Total Duration: ${segments[segments.length - 1]?.endTime.toFixed(2)} seconds

Features:
• Pure Raw Arabic (no numbers or brackets)
• Pure Raw English & Bengali Translations (no headers or brackets)
• Long verses intelligently wrapped and divided into timed segments
• Lossless 16-bit 44.1kHz WAV Audio

Verses Included:
${segments.map((s) => `• Surah ${s.surahName} (${s.surahId}:${s.ayahNumber}) - Duration: ${(s.endTime - s.startTime).toFixed(2)}s`).join("\n")}
`;
  zip.file("README.txt", summary);

  const zipBlob = await zip.generateAsync({ type: "blob" });
  downloadFile(zipBlob, zipFilename, "application/zip");
}
