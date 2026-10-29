"use client";

import React, { useState, useRef } from "react";
import { decodeUploadedAudioFile, renderRepeatedTimelineAudio } from "@/lib/zikrAudioEngine";
import { POPULAR_ZIKR_PRESETS } from "@/data/zikrPresets";
import StudioPlayer from "../StudioPlayer";

export default function ZikrRepeaterStudio() {
  const [zikrItems, setZikrItems] = useState([]);
  const [gapSeconds, setGapSeconds] = useState(0.3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressInfo, setProgressInfo] = useState({ percentage: 0, message: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [activeResult, setActiveResult] = useState(null);
  const [activePlayingId, setActivePlayingId] = useState(null);

  const fileInputRef = useRef(null);
  const previewAudioRef = useRef(null);

  // Handle uploading one or multiple audio files
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setErrorMessage("");
    const newItems = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const audioBuffer = await decodeUploadedAudioFile(file);
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");

        // Try to match preset by file name (e.g. if file is named "subhanallah.mp3")
        const lower = cleanName.toLowerCase();
        const matchedPreset = POPULAR_ZIKR_PRESETS.find(
          (p) =>
            lower.includes(p.id) ||
            lower.includes(p.title.toLowerCase().split(" ")[0])
        );

        newItems.push({
          id: `item_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          title: cleanName,
          fileName: file.name,
          audioBuffer,
          duration: audioBuffer.duration,
          repeatCount: matchedPreset?.recommendedRepeat || 33,
          arabic: matchedPreset?.arabic || "",
          english: matchedPreset?.english || "",
          bengali: matchedPreset?.bengali || "",
          objectUrl: URL.createObjectURL(file),
        });
      } catch (err) {
        console.error("Failed to decode audio file:", file.name, err);
        setErrorMessage(`Could not decode "${file.name}". Please ensure it is a valid audio file.`);
      }
    }

    setZikrItems((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Preview an individual item's audio
  const togglePlayItem = (item) => {
    if (!previewAudioRef.current) return;

    if (activePlayingId === item.id) {
      previewAudioRef.current.pause();
      setActivePlayingId(null);
    } else {
      previewAudioRef.current.src = item.objectUrl;
      previewAudioRef.current.play();
      setActivePlayingId(item.id);
    }
  };

  // Update item field (repeatCount, arabic, english, bengali, title)
  const updateItem = (id, field, value) => {
    setZikrItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Apply a preset to a specific item
  const applyPresetToItem = (itemId, preset) => {
    setZikrItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              title: preset.title,
              arabic: preset.arabic,
              english: preset.english,
              bengali: preset.bengali,
              repeatCount: preset.recommendedRepeat,
            }
          : item
      )
    );
  };

  // Reorder items
  const moveItem = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= zikrItems.length) return;
    const updated = [...zikrItems];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    setZikrItems(updated);
  };

  const removeItem = (id) => {
    setZikrItems((prev) => {
      const item = prev.find((it) => it.id === id);
      if (item?.objectUrl) URL.revokeObjectURL(item.objectUrl);
      return prev.filter((it) => it.id !== id);
    });
    if (activePlayingId === id && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setActivePlayingId(null);
    }
  };

  const duplicateItem = (index) => {
    const item = zikrItems[index];
    const copy = {
      ...item,
      id: `item_${Date.now()}_copy_${Math.random().toString(36).substring(2, 6)}`,
      title: `${item.title} (Copy)`,
    };
    const updated = [...zikrItems];
    updated.splice(index + 1, 0, copy);
    setZikrItems(updated);
  };

  const clearTimeline = () => {
    if (confirm("Clear all items from timeline?")) {
      zikrItems.forEach((it) => {
        if (it.objectUrl) URL.revokeObjectURL(it.objectUrl);
      });
      setZikrItems([]);
      setActiveResult(null);
    }
  };

  // Calculate timeline metrics
  const totalRepeats = zikrItems.reduce(
    (sum, it) => sum + (parseInt(it.repeatCount, 10) || 1),
    0
  );

  const totalCalculatedSeconds = zikrItems.reduce((sum, it) => {
    const rep = parseInt(it.repeatCount, 10) || 1;
    return sum + (it.duration + gapSeconds) * rep;
  }, 0);

  const formatSec = (sec) => {
    if (isNaN(sec) || sec <= 0) return "0s";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    if (m === 0) return `${s}s`;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  // Generate combined audio & SRT
  const handleGenerate = async () => {
    if (zikrItems.length === 0) return;

    setIsProcessing(true);
    setErrorMessage("");
    setProgressInfo({ percentage: 10, message: "Starting offline audio mixer..." });

    try {
      const result = await renderRepeatedTimelineAudio(zikrItems, {
        gapSeconds,
        onProgress: (step, data) => {
          setProgressInfo({
            percentage: data.percentage || 50,
            message: data.message || "Processing repeats...",
          });
        },
      });

      if (activeResult?.audioUrl) {
        URL.revokeObjectURL(activeResult.audioUrl);
      }

      setActiveResult({
        ...result,
        reciterName: "Custom Audio & Adhkar",
        jobName: "Zikr_Repeater_Audio",
      });
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Failed to generate audio.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 font-monsterate">
      {/* Hidden Audio element for previewing individual items */}
      <audio
        ref={previewAudioRef}
        onEnded={() => setActivePlayingId(null)}
        onPause={() => setActivePlayingId(null)}
      />

      {/* Hero Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-md border border-secondary/15 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider">
            <span>📿 Adhkar & Audio Looper</span>
            <span>•</span>
            <span>Browser-Native</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-primary">
            Custom Audio & Zikr Repeater Studio
          </h2>
          <p className="text-secondary/80 text-xs md:text-sm max-w-xl">
            Upload custom audio files, specify how many times each verse or zikr should repeat,
            reorder them on a clean non-cluttered timeline, assign Arabic/English/Bengali translations,
            and generate a single combined lossless audio with exact synchronized SRTs!
          </p>
        </div>

        {/* Upload Button */}
        <div className="flex-shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="audio/*"
            className="hidden"
            id="custom-audio-file-upload"
          />
          <label
            htmlFor="custom-audio-file-upload"
            className="cursor-pointer py-3.5 px-6 rounded-2xl bg-primary text-background font-bold text-sm hover:bg-secondary transition shadow-md flex items-center gap-2.5 transform active:scale-95 select-none"
          >
            <svg className="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>+ Upload Audio Files</span>
          </label>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex justify-between items-center">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage("")} className="font-bold underline ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Timeline Controls & Settings Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-secondary/15 flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-primary text-background flex items-center justify-center font-bold text-xs">
              {zikrItems.length}
            </span>
            <span className="font-bold text-sm text-primary">Audio Tracks</span>
          </div>

          <div className="h-4 w-px bg-secondary/20 hidden sm:block" />

          <div className="text-xs text-secondary">
            Total Repeats: <strong className="text-amber-800 font-mono">{totalRepeats}x</strong>
          </div>

          <div className="h-4 w-px bg-secondary/20 hidden sm:block" />

          <div className="text-xs text-secondary">
            Estimated Duration:{" "}
            <strong className="text-amber-800 font-mono">{formatSec(totalCalculatedSeconds)}</strong>
          </div>
        </div>

        {/* Gap selection & action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-secondary font-medium">Gap:</span>
            {[0, 0.3, 0.5, 1.0].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGapSeconds(g)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${
                  gapSeconds === g
                    ? "bg-primary text-background"
                    : "bg-background/50 hover:bg-background text-secondary border border-secondary/20"
                }`}
              >
                {g === 0 ? "0s" : `${g}s`}
              </button>
            ))}
          </div>

          {zikrItems.length > 0 && (
            <button
              type="button"
              onClick={clearTimeline}
              className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition"
            >
              Clear
            </button>
          )}

          <button
            type="button"
            disabled={zikrItems.length === 0 || isProcessing}
            onClick={handleGenerate}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold text-xs hover:from-amber-700 hover:to-amber-800 transition shadow-md disabled:opacity-40 flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {progressInfo.message || "Generating..."}
              </>
            ) : (
              <>⚡ Generate Combined Audio & SRTs</>
            )}
          </button>
        </div>
      </div>

      {/* Main Timeline Workspace (Clean & Uncluttered) */}
      {zikrItems.length === 0 ? (
        <div className="py-16 px-4 text-center border-2 border-dashed border-secondary/25 rounded-3xl bg-white shadow-sm space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100/70 flex items-center justify-center text-amber-800">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-lg text-primary">No Audio Uploaded Yet</h3>
            <p className="text-xs text-secondary/70 max-w-md mx-auto mt-1">
              Click <strong>"+ Upload Audio Files"</strong> above to add your custom recordings or zikrs.
              You can set how many times each verse repeats without cluttering your timeline!
            </p>
          </div>

          {/* Quick preset suggestion buttons */}
          <div className="pt-2 max-w-xl mx-auto">
            <span className="text-[11px] font-semibold text-secondary/80 block mb-2">
              Popular Adhkar Templates Available:
            </span>
            <div className="flex flex-wrap justify-center gap-1.5">
              {POPULAR_ZIKR_PRESETS.slice(0, 5).map((p) => (
                <span
                  key={p.id}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-background/70 text-secondary border border-secondary/20 font-medium"
                >
                  {p.title} ({p.recommendedRepeat}x)
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Timeline Items List */
        <div className="space-y-4">
          {zikrItems.map((item, index) => {
            const isPlaying = activePlayingId === item.id;
            const repeatNum = parseInt(item.repeatCount, 10) || 1;
            const itemSubtotalSec = (item.duration + gapSeconds) * repeatNum;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-secondary/20 hover:border-secondary/40 transition space-y-4"
              >
                {/* Item Header bar */}
                <div className="flex flex-wrap justify-between items-center gap-3 border-b border-secondary/10 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-primary text-background font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>

                    {/* Mini audio play button */}
                    <button
                      type="button"
                      onClick={() => togglePlayItem(item)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition shadow-sm ${
                        isPlaying
                          ? "bg-amber-600 text-white animate-pulse"
                          : "bg-background/80 hover:bg-background text-primary border border-secondary/30"
                      }`}
                      title={isPlaying ? "Pause Preview" : "Play Preview"}
                    >
                      {isPlaying ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0v-12a.75.75 0 01.75-.75zm10.5 0a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0v-12a.75.75 0 01.75-.75z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>

                    <div>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateItem(item.id, "title", e.target.value)}
                        className="font-bold text-sm text-primary bg-transparent border-b border-transparent hover:border-secondary/30 focus:border-primary focus:outline-none"
                      />
                      <div className="text-[11px] text-secondary/70 flex items-center gap-2">
                        <span>Original: {item.duration.toFixed(1)}s</span>
                        <span>•</span>
                        <span>{item.fileName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Repeat Badge & Reorder Controls */}
                  <div className="flex items-center gap-3">
                    {/* Repeat Counter Widget */}
                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300/80 px-3 py-1.5 rounded-xl">
                      <span className="text-xs font-bold text-amber-900">Repeat:</span>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={item.repeatCount}
                        onChange={(e) => updateItem(item.id, "repeatCount", e.target.value)}
                        className="w-14 text-center font-bold text-xs font-mono bg-white border border-amber-300 rounded-lg py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <span className="text-xs font-bold text-amber-900">times</span>

                      {/* Quick repeat buttons */}
                      <div className="hidden sm:flex gap-1 ml-1.5">
                        {[3, 7, 33, 100].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => updateItem(item.id, "repeatCount", num)}
                            className={`px-1.5 py-0.5 text-[10px] rounded font-semibold transition ${
                              parseInt(item.repeatCount, 10) === num
                                ? "bg-amber-600 text-white"
                                : "bg-white text-secondary hover:bg-amber-100"
                            }`}
                          >
                            {num}x
                          </button>
                        ))}
                      </div>

                      <span className="text-[11px] text-amber-800/80 font-mono ml-2 border-l border-amber-200 pl-2 hidden md:inline">
                        ≈ {formatSec(itemSubtotalSec)}
                      </span>
                    </div>

                    {/* Move and delete buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveItem(index, -1)}
                        className="p-1 rounded hover:bg-secondary/10 disabled:opacity-30 text-primary"
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={index === zikrItems.length - 1}
                        onClick={() => moveItem(index, 1)}
                        className="p-1 rounded hover:bg-secondary/10 disabled:opacity-30 text-primary"
                        title="Move Down"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateItem(index)}
                        className="p-1 rounded hover:bg-secondary/10 text-primary"
                        title="Duplicate"
                      >
                        ⎘
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-1 rounded hover:bg-rose-100 text-rose-600"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>

                {/* Text Assignment (Arabic, English, Bengali) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  {/* Arabic text input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-primary flex justify-between">
                      <span>Arabic Text (عربي):</span>
                      <span className="text-secondary/60 text-[10px]">Pure raw zikr</span>
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      value={item.arabic}
                      onChange={(e) => updateItem(item.id, "arabic", e.target.value)}
                      placeholder="e.g. سُبْحَانَ ٱللَّٰهِ"
                      className="w-full px-3 py-2 text-sm font-serif font-bold text-primary border border-secondary/20 rounded-xl bg-background/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* English translation input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-primary">
                      English Translation:
                    </label>
                    <input
                      type="text"
                      value={item.english}
                      onChange={(e) => updateItem(item.id, "english", e.target.value)}
                      placeholder="e.g. Glory be to Allah"
                      className="w-full px-3 py-2 text-xs text-primary border border-secondary/20 rounded-xl bg-background/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Bengali translation input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-primary">
                      Bengali Translation (বাংলা):
                    </label>
                    <input
                      type="text"
                      value={item.bengali}
                      onChange={(e) => updateItem(item.id, "bengali", e.target.value)}
                      placeholder="e.g. আল্লাহ পবিত্র ও মহিমাময়"
                      className="w-full px-3 py-2 text-xs text-primary border border-secondary/20 rounded-xl bg-background/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Quick Preset Selector for this item */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                  <span className="text-[11px] text-secondary/70">Assign Preset:</span>
                  {POPULAR_ZIKR_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPresetToItem(item.id, p)}
                      className="px-2 py-0.5 rounded text-[10px] bg-background/60 hover:bg-background text-secondary border border-secondary/15 transition"
                    >
                      {p.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rendered Studio Player & Subtitle Viewer */}
      {activeResult && (
        <div className="pt-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-secondary/15 pb-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-bold text-lg text-primary">
              Rendered Audio & Subtitle Studio Player
            </h3>
          </div>

          <StudioPlayer
            audioUrl={activeResult.audioUrl}
            audioBlob={activeResult.audioBlob}
            segments={activeResult.segments}
            duration={activeResult.duration}
            waveformPeaks={activeResult.waveformPeaks}
            reciterName={activeResult.reciterName}
            jobName={activeResult.jobName}
          />
        </div>
      )}
    </div>
  );
}

