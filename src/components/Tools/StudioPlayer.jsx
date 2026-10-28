"use client";

import React, { useRef, useState, useEffect } from "react";
import WebGLWaveform from "./WebGLWaveform";
import {
  generateArabicSrt,
  generateEnglishSrt,
  generateBilingualSrt,
  downloadFile,
  downloadZipBundle,
} from "@/lib/srtGenerator";

export default function StudioPlayer({
  audioUrl,
  audioBlob,
  segments = [],
  duration = 0,
  waveformPeaks = null,
  reciterName = "Reciter",
  jobName = "Quran_Audio",
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [subtitleMode, setSubtitleMode] = useState("bilingual"); // 'bilingual' | 'arabic' | 'english'
  const [copiedType, setCopiedType] = useState(null);

  // Synchronize audio playback time
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleSeek = (timeInSec) => {
    if (audioRef.current) {
      audioRef.current.currentTime = timeInSec;
      setCurrentTime(timeInSec);
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  // Find currently active segment
  const activeSegmentIndex = segments.findIndex(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );
  const activeSegment = segments[activeSegmentIndex] || segments[0];

  const jumpToSegment = (seg) => {
    handleSeek(seg.startTime + 0.05);
    if (audioRef.current && !isPlaying) {
      audioRef.current.play();
    }
  };

  const skipRelative = (deltaSec) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + deltaSec));
      handleSeek(newTime);
    }
  };

  const copySrtToClipboard = (type) => {
    let text = "";
    if (type === "arabic") text = generateArabicSrt(segments);
    else if (type === "english") text = generateEnglishSrt(segments);
    else text = generateBilingualSrt(segments);

    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const formatTime = (sec) => {
    if (isNaN(sec)) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-secondary/20 overflow-hidden">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Header bar */}
      <div className="bg-primary text-background px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="font-bold text-lg">{jobName}</h3>
          </div>
          <p className="text-xs text-background/80 mt-0.5">
            Reciter: <strong className="text-amber-300">{reciterName}</strong> • {segments.length} Ayahs • Duration: {formatTime(duration)}
          </p>
        </div>

        {/* Subtitle mode pills */}
        <div className="flex items-center bg-secondary/50 rounded-lg p-1 text-xs">
          <button
            onClick={() => setSubtitleMode("bilingual")}
            className={`px-3 py-1 rounded-md transition ${
              subtitleMode === "bilingual" ? "bg-background text-primary font-bold shadow" : "text-background/80 hover:text-white"
            }`}
          >
            Bilingual (Ar + En)
          </button>
          <button
            onClick={() => setSubtitleMode("arabic")}
            className={`px-3 py-1 rounded-md transition ${
              subtitleMode === "arabic" ? "bg-background text-primary font-bold shadow" : "text-background/80 hover:text-white"
            }`}
          >
            Arabic Only
          </button>
          <button
            onClick={() => setSubtitleMode("english")}
            className={`px-3 py-1 rounded-md transition ${
              subtitleMode === "english" ? "bg-background text-primary font-bold shadow" : "text-background/80 hover:text-white"
            }`}
          >
            English Only
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Live Synchronized Subtitles Display Box */}
        <div className="relative min-h-[160px] bg-background/60 border border-accent/20 rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-inner">
          <div className="absolute top-3 left-4 text-xs font-semibold text-secondary/70">
            {activeSegment ? (
              <span>
                Surah {activeSegment.surahName} ({activeSegment.surahId}:{activeSegment.ayahNumber})
              </span>
            ) : (
              <span>Surah Preview</span>
            )}
          </div>

          <div className="absolute top-3 right-4 text-xs font-mono text-secondary/70">
            {activeSegmentIndex >= 0 ? `Ayah ${activeSegmentIndex + 1} of ${segments.length}` : ""}
          </div>

          {activeSegment ? (
            <div className="space-y-4 max-w-3xl my-auto">
              {(subtitleMode === "bilingual" || subtitleMode === "arabic") && (
                <div
                  dir="rtl"
                  className="font-bold text-2xl md:text-3xl text-primary leading-loose font-serif select-text"
                >
                  {activeSegment.arabic}
                </div>
              )}

              {(subtitleMode === "bilingual" || subtitleMode === "english") && (
                <div className="text-secondary text-base md:text-lg font-medium italic select-text">
                  "{activeSegment.english}"
                </div>
              )}
            </div>
          ) : (
            <div className="text-secondary/60 italic text-sm">
              Press play or scrub the timeline to start playback
            </div>
          )}
        </div>

        {/* WebGL Hardware-Accelerated Waveform Scrubber */}
        <div>
          <div className="flex justify-between items-center mb-1 text-xs text-secondary font-medium">
            <span>Interactive WebGL Audio Waveform</span>
            <span>Click or drag to jump</span>
          </div>
          <WebGLWaveform
            peaks={waveformPeaks}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            segments={segments}
            height={100}
          />
        </div>

        {/* Player Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-background/30 p-4 rounded-xl border border-secondary/15">
          {/* Main playback buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => skipRelative(-5)}
              className="p-2 rounded-full hover:bg-secondary/10 text-primary transition"
              title="Skip back 5s"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>

            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-primary text-background flex items-center justify-center hover:bg-secondary transition shadow-lg transform active:scale-95"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0v-12a.75.75 0 01.75-.75zm10.5 0a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0v-12a.75.75 0 01.75-.75z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            <button
              onClick={() => skipRelative(5)}
              className="p-2 rounded-full hover:bg-secondary/10 text-primary transition"
              title="Skip forward 5s"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
            </button>

            <span className="text-xs font-mono text-primary font-semibold ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Speed & Volume */}
          <div className="flex items-center gap-4 text-xs">
            {/* Speed selection */}
            <div className="flex items-center gap-1">
              <span className="text-secondary font-medium">Speed:</span>
              {[0.75, 1, 1.25, 1.5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`px-2 py-0.5 rounded text-xs transition ${
                    playbackRate === speed
                      ? "bg-primary text-background font-bold"
                      : "bg-white text-secondary hover:bg-secondary/10"
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {/* Volume slider */}
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-16 accent-primary cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Download & Export Center */}
        <div className="border-t border-secondary/15 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h4 className="text-sm font-bold text-primary flex items-center gap-2">
              <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download & Export Center
            </h4>
            <span className="text-xs text-secondary/80">Pristine 16-bit Lossless Audio & Accurate Subtitles</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Download WAV */}
            <button
              onClick={() => downloadFile(audioBlob, `${jobName}.wav`, "audio/wav")}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary text-background font-semibold text-xs hover:bg-secondary transition shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              Audio (.wav)
            </button>

            {/* Arabic SRT */}
            <button
              onClick={() =>
                downloadFile(generateArabicSrt(segments), `${jobName}_Arabic.srt`)
              }
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-secondary/30 text-primary font-semibold text-xs hover:bg-background transition shadow-sm"
            >
              <span className="font-serif">ع</span>
              Arabic SRT (.srt)
            </button>

            {/* English SRT */}
            <button
              onClick={() =>
                downloadFile(generateEnglishSrt(segments), `${jobName}_English.srt`)
              }
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-secondary/30 text-primary font-semibold text-xs hover:bg-background transition shadow-sm"
            >
              <span>EN</span>
              English SRT (.srt)
            </button>

            {/* Bilingual SRT */}
            <button
              onClick={() =>
                downloadFile(generateBilingualSrt(segments), `${jobName}_Bilingual.srt`)
              }
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-accent/40 text-primary font-semibold text-xs hover:bg-background transition shadow-sm"
            >
              <span>Dual</span>
              Bilingual SRT (.srt)
            </button>

            {/* ZIP Package */}
            <button
              onClick={() =>
                downloadZipBundle({
                  zipFilename: `${jobName}_Package.zip`,
                  audioBlob,
                  audioFilename: `${jobName}.wav`,
                  segments,
                  reciterName,
                })
              }
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold text-xs hover:from-amber-700 hover:to-amber-800 transition shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Download ZIP (All)
            </button>
          </div>

          {/* Quick Copy to Clipboard actions */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-secondary/10 text-xs">
            <span className="text-secondary/70">Copy to Clipboard:</span>
            <button
              onClick={() => copySrtToClipboard("bilingual")}
              className="text-xs text-primary hover:underline font-medium"
            >
              {copiedType === "bilingual" ? "✓ Copied Dual SRT!" : "Copy Dual SRT"}
            </button>
            <span className="text-secondary/40">•</span>
            <button
              onClick={() => copySrtToClipboard("arabic")}
              className="text-xs text-primary hover:underline font-medium"
            >
              {copiedType === "arabic" ? "✓ Copied Arabic!" : "Copy Arabic SRT"}
            </button>
            <span className="text-secondary/40">•</span>
            <button
              onClick={() => copySrtToClipboard("english")}
              className="text-xs text-primary hover:underline font-medium"
            >
              {copiedType === "english" ? "✓ Copied English!" : "Copy English SRT"}
            </button>
          </div>
        </div>

        {/* Ayah Track List (Interactive Jump Index) */}
        <div className="border-t border-secondary/15 pt-5">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-bold text-primary">
              Ayah Sequence Breakdown ({segments.length} Items)
            </h4>
            <span className="text-xs text-secondary/70">Click any ayah to jump immediately</span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {segments.map((seg, idx) => {
              const isActive = idx === activeSegmentIndex;
              return (
                <div
                  key={idx}
                  onClick={() => jumpToSegment(seg)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between gap-3 ${
                    isActive
                      ? "bg-amber-100/90 border-amber-400 shadow-sm"
                      : "bg-background/40 hover:bg-background border-secondary/15"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        isActive ? "bg-amber-500 text-white" : "bg-secondary/20 text-primary"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-primary">
                        {seg.surahName} ({seg.surahId}:{seg.ayahNumber})
                      </div>
                      <div className="text-[11px] text-secondary truncate max-w-md">
                        {seg.english}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="font-mono text-primary font-medium">
                      {formatTime(seg.startTime)} - {formatTime(seg.endTime)}
                    </div>
                    <div className="text-[10px] text-secondary/70">
                      {(seg.endTime - seg.startTime).toFixed(1)}s
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
