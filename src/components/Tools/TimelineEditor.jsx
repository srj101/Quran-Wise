"use client";

import React, { useState, useMemo } from "react";
import { SURAHS_LIST, QUICK_PRESETS } from "@/data/surahList";
import { RECITERS } from "@/data/reciters";
import { getSurahVerses } from "@/lib/quranApi";

export default function TimelineEditor({
  timeline = [],
  setTimeline,
  selectedReciter,
  setSelectedReciter,
  gapSeconds,
  setGapSeconds,
  onGenerate,
  onAddToBatch,
  isProcessing = false,
}) {
  const [selectedSurahId, setSelectedSurahId] = useState(1);
  const [surahSearch, setSurahSearch] = useState("");
  const [selectionMode, setSelectionMode] = useState("range"); // 'range' | 'single' | 'full' | 'custom'
  const [ayahFrom, setAyahFrom] = useState(1);
  const [ayahTo, setAyahTo] = useState(7);
  const [singleAyah, setSingleAyah] = useState(1);
  const [customAyahsInput, setCustomAyahsInput] = useState("");
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const currentSurah = useMemo(() => {
    return SURAHS_LIST.find((s) => s.id === selectedSurahId) || SURAHS_LIST[0];
  }, [selectedSurahId]);

  // Filtered surah list for search dropdown
  const filteredSurahs = useMemo(() => {
    if (!surahSearch.trim()) return SURAHS_LIST;
    const q = surahSearch.toLowerCase().trim();
    return SURAHS_LIST.filter(
      (s) =>
        s.id.toString() === q ||
        s.name.toLowerCase().includes(q) ||
        s.arabic.includes(q) ||
        s.english.toLowerCase().includes(q)
    );
  }, [surahSearch]);

  const handleSurahChange = (id) => {
    const numId = Number(id);
    setSelectedSurahId(numId);
    const surah = SURAHS_LIST.find((s) => s.id === numId) || SURAHS_LIST[0];
    setAyahFrom(1);
    setAyahTo(Math.min(7, surah.verses));
    setSingleAyah(1);
    setErrorMessage("");
  };

  const handleApplyPreset = (preset) => {
    setSelectedSurahId(preset.surahId);
    setSelectionMode("range");
    setAyahFrom(preset.ayahFrom);
    setAyahTo(preset.ayahTo);
  };

  // Add selected ayahs to timeline
  const handleAddToTimeline = async () => {
    setIsLoadingVerses(true);
    setErrorMessage("");

    try {
      const surahData = await getSurahVerses(selectedSurahId);
      const totalAvailable = surahData.verses.length;
      let targetAyahNumbers = [];

      if (selectionMode === "full") {
        for (let i = 1; i <= totalAvailable; i++) targetAyahNumbers.push(i);
      } else if (selectionMode === "single") {
        const val = Math.max(1, Math.min(totalAvailable, Number(singleAyah) || 1));
        targetAyahNumbers.push(val);
      } else if (selectionMode === "range") {
        const from = Math.max(1, Math.min(totalAvailable, Number(ayahFrom) || 1));
        const to = Math.max(from, Math.min(totalAvailable, Number(ayahTo) || from));
        for (let i = from; i <= to; i++) targetAyahNumbers.push(i);
      } else if (selectionMode === "custom") {
        // Parse custom input: e.g. "1, 3, 5-7, 255"
        const parts = customAyahsInput.split(/[\s,]+/);
        for (const part of parts) {
          if (part.includes("-")) {
            const [start, end] = part.split("-").map(Number);
            if (!isNaN(start) && !isNaN(end)) {
              for (let i = Math.max(1, start); i <= Math.min(totalAvailable, end); i++) {
                if (!targetAyahNumbers.includes(i)) targetAyahNumbers.push(i);
              }
            }
          } else {
            const num = Number(part);
            if (!isNaN(num) && num >= 1 && num <= totalAvailable) {
              if (!targetAyahNumbers.includes(num)) targetAyahNumbers.push(num);
            }
          }
        }
        if (targetAyahNumbers.length === 0) {
          throw new Error(`No valid ayah numbers found in custom input. Range for ${currentSurah.name} is 1-${totalAvailable}.`);
        }
      }

      // Build timeline entries
      const reciter = RECITERS.find((r) => r.id === selectedReciter) || RECITERS[0];
      const newEntries = targetAyahNumbers.map((ayahNum) => {
        const verse = surahData.verses[ayahNum - 1] || {
          arabic: `Ayah ${ayahNum}`,
          english: `Translation for Ayah ${ayahNum}`,
        };
        return {
          id: `${selectedSurahId}_${ayahNum}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          surahId: selectedSurahId,
          surahName: currentSurah.name,
          surahArabic: currentSurah.arabic,
          ayahNumber: ayahNum,
          arabic: verse.arabic,
          english: verse.english,
          candidateUrls: reciter.getUrl(selectedSurahId, ayahNum),
        };
      });

      setTimeline((prev) => [...prev, ...newEntries]);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Failed to load ayahs. Please try again.");
    } finally {
      setIsLoadingVerses(false);
    }
  };

  // Reordering helpers
  const moveItem = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= timeline.length) return;
    const updated = [...timeline];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    setTimeline(updated);
  };

  const removeItem = (index) => {
    setTimeline((prev) => prev.filter((_, i) => i !== index));
  };

  const duplicateItem = (index) => {
    const item = timeline[index];
    const copy = {
      ...item,
      id: `${item.surahId}_${item.ayahNumber}_copy_${Date.now()}`,
    };
    const updated = [...timeline];
    updated.splice(index + 1, 0, copy);
    setTimeline(updated);
  };

  const clearTimeline = () => {
    if (confirm("Clear all items from timeline?")) {
      setTimeline([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Configuration & Selection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Surah & Ayah Selector (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-md border border-secondary/15 space-y-5">
          <div className="flex justify-between items-center border-b border-secondary/10 pb-3">
            <div>
              <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                Select Quran Verses
              </h2>
              <p className="text-xs text-secondary/70">
                Choose any Surah, single verse, custom range, or whole Surah
              </p>
            </div>
          </div>

          {/* Surah Picker with Search */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-primary">
              <label htmlFor="surah-select">Select Surah ({SURAHS_LIST.length} Available):</label>
              <span className="text-amber-800 font-serif font-bold text-sm">
                {currentSurah.arabic} ({currentSurah.verses} Ayahs)
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={surahSearch}
                onChange={(e) => setSurahSearch(e.target.value)}
                placeholder="Filter by name or number (e.g. Baqarah, 2, Kahf)..."
                className="w-1/3 px-3 py-2 text-xs border border-secondary/30 rounded-xl bg-background/30 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <select
                id="surah-select"
                value={selectedSurahId}
                onChange={(e) => handleSurahChange(e.target.value)}
                className="w-2/3 px-3 py-2 text-xs font-medium border border-secondary/30 rounded-xl bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {filteredSurahs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id}. {s.name} ({s.english}) - {s.verses} Ayahs [{s.arabic}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selection Mode Switcher */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-primary block">Ayah Selection Mode:</label>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {[
                { id: "range", label: "Ayah Range" },
                { id: "single", label: "Single Ayah" },
                { id: "full", label: "Whole Surah" },
                { id: "custom", label: "Custom List" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectionMode(m.id)}
                  className={`py-2 px-3 rounded-xl font-medium transition text-center ${
                    selectionMode === m.id
                      ? "bg-primary text-background font-bold shadow-sm"
                      : "bg-background/40 hover:bg-background text-secondary border border-secondary/20"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Inputs */}
          <div className="bg-background/30 p-4 rounded-xl border border-secondary/15">
            {selectionMode === "range" && (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-xs font-medium text-secondary block mb-1">
                    From Ayah (1 - {currentSurah.verses}):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={currentSurah.verses}
                    value={ayahFrom}
                    onChange={(e) => setAyahFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-secondary/30 rounded-xl text-sm font-semibold bg-white"
                  />
                </div>
                <div className="text-secondary/50 font-bold mt-5">→</div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-secondary block mb-1">
                    To Ayah (1 - {currentSurah.verses}):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={currentSurah.verses}
                    value={ayahTo}
                    onChange={(e) => setAyahTo(e.target.value)}
                    className="w-full px-3 py-2 border border-secondary/30 rounded-xl text-sm font-semibold bg-white"
                  />
                </div>
              </div>
            )}

            {selectionMode === "single" && (
              <div>
                <label className="text-xs font-medium text-secondary block mb-1">
                  Select Ayah Number (1 - {currentSurah.verses}):
                </label>
                <input
                  type="number"
                  min="1"
                  max={currentSurah.verses}
                  value={singleAyah}
                  onChange={(e) => setSingleAyah(e.target.value)}
                  className="w-full px-3 py-2 border border-secondary/30 rounded-xl text-sm font-semibold bg-white"
                />
              </div>
            )}

            {selectionMode === "full" && (
              <div className="text-xs text-secondary">
                Will add all <strong>{currentSurah.verses} ayahs</strong> of Surah {currentSurah.name} ({currentSurah.arabic}) serially to the timeline.
              </div>
            )}

            {selectionMode === "custom" && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-secondary block">
                  Enter Ayah numbers or ranges (e.g. 1, 3, 5-8, 255):
                </label>
                <input
                  type="text"
                  value={customAyahsInput}
                  onChange={(e) => setCustomAyahsInput(e.target.value)}
                  placeholder="e.g. 1, 2, 5-8"
                  className="w-full px-3 py-2 border border-secondary/30 rounded-xl text-sm font-mono bg-white"
                />
              </div>
            )}

            {errorMessage && (
              <p className="text-xs text-rose-600 font-medium mt-2">⚠️ {errorMessage}</p>
            )}
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-secondary block">
              Quick Popular Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PRESETS.slice(0, 6).map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-background/60 hover:bg-background text-primary border border-secondary/20 transition"
                  title={preset.description}
                >
                  ⚡ {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Add to Timeline Button */}
          <button
            type="button"
            disabled={isLoadingVerses}
            onClick={handleAddToTimeline}
            className="w-full py-3 px-4 rounded-xl bg-primary text-background font-bold text-sm hover:bg-secondary transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
          >
            {isLoadingVerses ? (
              <>
                <svg className="animate-spin h-4 w-4 text-background" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Fetching Verses...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                + Add Selection to Timeline
              </>
            )}
          </button>
        </div>

        {/* Right Col: Reciter & Audio Engine Settings (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-md border border-secondary/15 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-secondary/10 pb-3">
              <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                Reciter & Audio Engine
              </h2>
              <p className="text-xs text-secondary/70">
                Studio-grade lossless rendering & timing
              </p>
            </div>

            {/* Reciter Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-primary block">
                Select Reciter (Qari):
              </label>
              <div className="space-y-2">
                {RECITERS.map((reciter) => {
                  const isSelected = selectedReciter === reciter.id;
                  return (
                    <div
                      key={reciter.id}
                      onClick={() => setSelectedReciter(reciter.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? "bg-amber-50 border-amber-500 shadow-sm"
                          : "bg-background/20 hover:bg-background border-secondary/15"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-primary">{reciter.name}</div>
                        <div className="text-[11px] text-secondary/70">{reciter.quality}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-serif text-amber-900 font-bold">{reciter.arabic}</div>
                        {isSelected && (
                          <span className="text-[10px] text-amber-700 font-bold">✓ Selected</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Silence / Gap between ayahs */}
            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-xs font-semibold text-primary">
                <label>Silence Gap Between Ayahs:</label>
                <span className="font-mono text-amber-800">{gapSeconds}s</span>
              </div>
              <div className="flex gap-2">
                {[0, 0.2, 0.5, 1.0].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setGapSeconds(val)}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition ${
                      gapSeconds === val
                        ? "bg-primary text-background"
                        : "bg-background/50 hover:bg-background text-secondary border border-secondary/20"
                    }`}
                  >
                    {val === 0 ? "Seamless (0s)" : `${val}s`}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-secondary/70">
                Pristine sample-accurate timing is maintained for SRT in all gap configurations.
              </p>
            </div>
          </div>

          {/* Quick Engine Specifications Info */}
          <div className="bg-background/40 p-3 rounded-xl border border-secondary/10 text-[11px] text-secondary space-y-1">
            <div className="font-bold text-primary">⚙️ Studio Quality Guarantee:</div>
            <div>• Lossless 16-bit 44.1kHz PCM Audio (Zero compression artifacts)</div>
            <div>• OfflineAudioContext hardware-accelerated C++ rendering</div>
            <div>• Millisecond-accurate dual-language SRT & WebVTT</div>
          </div>
        </div>
      </div>

      {/* Main Timeline Workspace */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-secondary/15 space-y-4">
        {/* Timeline Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-secondary/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-primary text-background flex items-center justify-center font-bold text-sm">
              {timeline.length}
            </span>
            <div>
              <h3 className="font-bold text-base text-primary">
                Serial Master Timeline ({timeline.length} Ayahs)
              </h3>
              <p className="text-xs text-secondary/70">
                All ayahs play and synchronize sequentially in this exact order
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {timeline.length > 0 && (
              <button
                type="button"
                onClick={clearTimeline}
                className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition"
              >
                Clear Timeline
              </button>
            )}

            <button
              type="button"
              disabled={timeline.length === 0}
              onClick={onAddToBatch}
              className="px-3 py-1.5 rounded-lg border border-secondary/30 text-secondary hover:bg-background text-xs font-semibold transition disabled:opacity-40"
            >
              + Queue as Batch Job
            </button>

            <button
              type="button"
              disabled={timeline.length === 0 || isProcessing}
              onClick={onGenerate}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold text-xs hover:from-amber-700 hover:to-amber-800 transition shadow-md disabled:opacity-40 flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>⚡ Generate Audio & Subtitles</>
              )}
            </button>
          </div>
        </div>

        {/* Empty State */}
        {timeline.length === 0 ? (
          <div className="py-12 px-4 text-center border-2 border-dashed border-secondary/20 rounded-2xl bg-background/20">
            <div className="w-12 h-12 mx-auto rounded-full bg-secondary/10 flex items-center justify-center text-primary mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h4 className="font-bold text-primary text-sm mb-1">Your Timeline is Empty</h4>
            <p className="text-xs text-secondary/70 max-w-sm mx-auto mb-4">
              Select any range of ayahs from the panel above and click <strong>"Add to Timeline"</strong> to build your sequence.
            </p>
            <button
              onClick={() => handleApplyPreset(QUICK_PRESETS[0])}
              className="text-xs text-amber-800 font-semibold hover:underline"
            >
              Or load Ayat al-Kursi (2:255) as a quick start →
            </button>
          </div>
        ) : (
          /* Timeline Items List */
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
            {timeline.map((item, index) => (
              <div
                key={item.id}
                className="group p-3 rounded-xl border border-secondary/20 bg-background/30 hover:bg-background/70 transition flex items-center justify-between gap-3 text-xs"
              >
                {/* Drag handle / Serial Order badge */}
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary text-background font-mono font-bold flex items-center justify-center text-xs flex-shrink-0">
                    {index + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">
                        Surah {item.surahName} ({item.surahId}:{item.ayahNumber})
                      </span>
                      <span className="font-serif text-amber-900 font-bold text-xs">
                        {item.surahArabic}
                      </span>
                    </div>

                    <div className="text-secondary/80 line-clamp-1 italic mt-0.5 max-w-xl">
                      "{item.english}"
                    </div>
                  </div>
                </div>

                {/* Arabic text snippet + Action buttons */}
                <div className="flex items-center gap-4">
                  <div
                    dir="rtl"
                    className="font-serif text-sm font-bold text-primary hidden md:block max-w-xs truncate"
                  >
                    {item.arabic}
                  </div>

                  {/* Move & Modify Controls */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
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
                      disabled={index === timeline.length - 1}
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
                      onClick={() => removeItem(index)}
                      className="p-1 rounded hover:bg-rose-100 text-rose-600"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
