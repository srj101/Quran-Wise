"use client";

import React, { useState } from "react";
import { SURAHS_LIST } from "@/data/surahList";
import { RECITERS } from "@/data/reciters";
import { getSurahVerses } from "@/lib/quranApi";

const DEFAULT_EXAMPLE_JSON = `[
  {
    "serial": 1,
    "surah_number": 1,
    "ayah_from": 1,
    "ayah_to": 7
  },
  {
    "serial": 2,
    "surah_number": 2,
    "ayah_from": 1,
    "ayah_to": 5
  },
  {
    "serial": 3,
    "surah_number": 2,
    "ayah_from": 255,
    "ayah_to": 257
  },
  {
    "serial": 4,
    "surah_number": 2,
    "ayah_from": 284,
    "ayah_to": 286
  },
  {
    "serial": 5,
    "surah_number": 3,
    "ayah_from": 190,
    "ayah_to": 200
  },
  {
    "serial": 6,
    "surah_number": 17,
    "ayah_from": 78,
    "ayah_to": 82
  },
  {
    "serial": 7,
    "surah_number": 18,
    "ayah_from": 1,
    "ayah_to": 10
  },
  {
    "serial": 8,
    "surah_number": 18,
    "ayah_from": 101,
    "ayah_to": 110
  },
  {
    "serial": 9,
    "surah_number": 20,
    "ayah_from": 25,
    "ayah_to": 35
  },
  {
    "serial": 10,
    "surah_number": 23,
    "ayah_from": 97,
    "ayah_to": 118
  },
  {
    "serial": 11,
    "surah_number": 13,
    "ayah_from": 28,
    "ayah_to": 29
  },
  {
    "serial": 12,
    "surah_number": 14,
    "ayah_from": 40,
    "ayah_to": 41
  },
  {
    "serial": 13,
    "surah_number": 59,
    "ayah_from": 18,
    "ayah_to": 24
  },
  {
    "serial": 14,
    "surah_number": 55,
    "ayah_from": 1,
    "ayah_to": 78
  },
  {
    "serial": 15,
    "surah_number": 56,
    "ayah_from": 1,
    "ayah_to": 96
  },
  {
    "serial": 16,
    "surah_number": 67,
    "ayah_from": 1,
    "ayah_to": 30
  },
  {
    "serial": 17,
    "surah_number": 112,
    "ayah_from": 1,
    "ayah_to": 4
  },
  {
    "serial": 18,
    "surah_number": 113,
    "ayah_from": 1,
    "ayah_to": 5
  },
  {
    "serial": 19,
    "surah_number": 114,
    "ayah_from": 1,
    "ayah_to": 6
  }
]`;

export default function JsonTimelineModal({
  isOpen,
  onClose,
  timeline,
  setTimeline,
  selectedReciter,
  gapSeconds,
  onQueueBatchJob,
}) {
  const [activeTab, setActiveTab] = useState("import"); // 'import' | 'export'
  const [jsonInput, setJsonInput] = useState(DEFAULT_EXAMPLE_JSON);
  const [parseError, setParseError] = useState("");
  const [parsedItems, setParsedItems] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [replaceTimeline, setReplaceTimeline] = useState(true);

  if (!isOpen) return null;

  // Validate and parse JSON input
  const handleValidate = () => {
    setParseError("");
    setParsedItems(null);

    if (!jsonInput.trim()) {
      setParseError("Please enter JSON content.");
      return;
    }

    try {
      const data = JSON.parse(jsonInput);
      const items = Array.isArray(data) ? data : data.timeline || data.items || [data];

      if (items.length === 0) {
        throw new Error("JSON array is empty.");
      }

      const validated = items.map((item, idx) => {
        const surahNum = Number(item.surah_number || item.surah || item.surahId);
        const from = Number(item.ayah_from || item.from || item.start || 1);
        const to = Number(item.ayah_to || item.to || item.end || from);
        const serial = Number(item.serial || idx + 1);

        if (!surahNum || surahNum < 1 || surahNum > 114) {
          throw new Error(`Item #${idx + 1}: Invalid surah_number "${item.surah_number}". Must be 1 to 114.`);
        }

        const surahMeta = SURAHS_LIST.find((s) => s.id === surahNum);
        if (from < 1 || from > surahMeta.verses) {
          throw new Error(`Item #${idx + 1} (${surahMeta.name}): ayah_from "${from}" is out of range (1 - ${surahMeta.verses}).`);
        }
        if (to < from || to > surahMeta.verses) {
          throw new Error(`Item #${idx + 1} (${surahMeta.name}): ayah_to "${to}" must be between ${from} and ${surahMeta.verses}.`);
        }

        return {
          serial,
          surahNum,
          surahName: surahMeta.name,
          surahArabic: surahMeta.arabic,
          from,
          to,
          count: to - from + 1,
        };
      });

      // Sort by serial
      validated.sort((a, b) => a.serial - b.serial);
      setParsedItems(validated);
    } catch (err) {
      setParseError(err.message || "Invalid JSON syntax.");
    }
  };

  // Convert parsed items into real timeline items with Quran verses
  const handleImportToTimeline = async () => {
    if (!parsedItems || parsedItems.length === 0) {
      handleValidate();
      return;
    }

    setIsLoading(true);
    setProgressMsg("Fetching verses from sources...");
    setParseError("");

    try {
      const reciterObj = RECITERS.find((r) => r.id === selectedReciter) || RECITERS[0];
      const newTimelineEntries = [];

      for (let i = 0; i < parsedItems.length; i++) {
        const seg = parsedItems[i];
        setProgressMsg(
          `Fetching Surah ${seg.surahName} (${seg.surahNum}) [${i + 1}/${parsedItems.length}]...`
        );

        const surahData = await getSurahVerses(seg.surahNum);

        for (let ayah = seg.from; ayah <= seg.to; ayah++) {
          const verse = surahData.verses[ayah - 1] || {
            arabic: `Ayah ${ayah}`,
            english: `Translation for Ayah ${ayah}`,
          };

          newTimelineEntries.push({
            id: `${seg.surahNum}_${ayah}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            surahId: seg.surahNum,
            surahName: seg.surahName,
            surahArabic: seg.surahArabic,
            ayahNumber: ayah,
            arabic: verse.arabic,
            english: verse.english,
            candidateUrls: reciterObj.getUrl(seg.surahNum, ayah),
          });
        }
      }

      if (replaceTimeline) {
        setTimeline(newTimelineEntries);
      } else {
        setTimeline((prev) => [...prev, ...newTimelineEntries]);
      }

      onClose();
    } catch (err) {
      console.error(err);
      setParseError(err.message || "Failed to fetch verses for JSON items.");
    } finally {
      setIsLoading(false);
      setProgressMsg("");
    }
  };

  // Import directly as a queued Batch Job
  const handleImportAsBatchJob = async () => {
    if (!parsedItems || parsedItems.length === 0) return;
    setIsLoading(true);
    setProgressMsg("Preparing batch job items...");

    try {
      const reciterObj = RECITERS.find((r) => r.id === selectedReciter) || RECITERS[0];
      const jobEntries = [];

      for (let i = 0; i < parsedItems.length; i++) {
        const seg = parsedItems[i];
        setProgressMsg(`Loading ${seg.surahName} (${i + 1}/${parsedItems.length})...`);
        const surahData = await getSurahVerses(seg.surahNum);

        for (let ayah = seg.from; ayah <= seg.to; ayah++) {
          const verse = surahData.verses[ayah - 1] || {
            arabic: `Ayah ${ayah}`,
            english: `Translation for Ayah ${ayah}`,
          };

          jobEntries.push({
            id: `${seg.surahNum}_${ayah}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            surahId: seg.surahNum,
            surahName: seg.surahName,
            surahArabic: seg.surahArabic,
            ayahNumber: ayah,
            arabic: verse.arabic,
            english: verse.english,
            candidateUrls: reciterObj.getUrl(seg.surahNum, ayah),
          });
        }
      }

      if (onQueueBatchJob) {
        onQueueBatchJob({
          name: `JSON_Batch_${parsedItems.length}_Segments`,
          timeline: jobEntries,
          reciterId: selectedReciter,
          reciterName: reciterObj.name,
          gapSeconds,
        });
      }

      onClose();
    } catch (err) {
      setParseError(err.message || "Failed to create batch job.");
    } finally {
      setIsLoading(false);
      setProgressMsg("");
    }
  };

  // Generate JSON from current timeline
  const getTimelineExportJson = () => {
    if (!timeline || timeline.length === 0) {
      return "[]";
    }

    // Group contiguous verses from the same Surah into ranges
    const ranges = [];
    let current = null;

    for (const item of timeline) {
      if (!current) {
        current = {
          surah_number: item.surahId,
          ayah_from: item.ayahNumber,
          ayah_to: item.ayahNumber,
        };
      } else if (
        current.surah_number === item.surahId &&
        item.ayahNumber === current.ayah_to + 1
      ) {
        current.ayah_to = item.ayahNumber;
      } else {
        ranges.push(current);
        current = {
          surah_number: item.surahId,
          ayah_from: item.ayahNumber,
          ayah_to: item.ayahNumber,
        };
      }
    }
    if (current) ranges.push(current);

    const exportData = ranges.map((r, i) => ({
      serial: i + 1,
      surah_number: r.surah_number,
      ayah_from: r.ayah_from,
      ayah_to: r.ayah_to,
    }));

    return JSON.stringify(exportData, null, 2);
  };

  const totalVersesInParsed = parsedItems?.reduce((acc, curr) => acc + curr.count, 0) || 0;

  return (
    <div className="fixed inset-0 z-50 bg-primary/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl border border-secondary/20 flex flex-col overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="bg-primary text-background px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-400" />
            <h3 className="font-bold text-base md:text-lg">JSON Timeline Automation Hub</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-background flex items-center justify-center text-sm font-bold transition"
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 pt-4 border-b border-secondary/15 flex gap-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab("import")}
            className={`pb-2 border-b-2 transition ${
              activeTab === "import"
                ? "border-primary text-primary"
                : "border-transparent text-secondary hover:text-primary"
            }`}
          >
            📥 Import JSON to Timeline
          </button>
          <button
            onClick={() => setActiveTab("export")}
            className={`pb-2 border-b-2 transition ${
              activeTab === "export"
                ? "border-primary text-primary"
                : "border-transparent text-secondary hover:text-primary"
            }`}
          >
            📤 Export Current Timeline as JSON ({timeline.length} Ayahs)
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
          {activeTab === "import" ? (
            <>
              <div className="flex justify-between items-center text-xs">
                <span className="text-secondary/80 font-medium">
                  Paste an array of objects with <code>surah_number</code>, <code>ayah_from</code>, and <code>ayah_to</code>:
                </span>
                <button
                  onClick={() => {
                    setJsonInput(DEFAULT_EXAMPLE_JSON);
                    setParsedItems(null);
                    setParseError("");
                  }}
                  className="text-amber-800 hover:underline font-bold"
                >
                  Load 19-Preset Example
                </button>
              </div>

              {/* JSON Textarea */}
              <div className="relative">
                <textarea
                  rows={8}
                  value={jsonInput}
                  onChange={(e) => {
                    setJsonInput(e.target.value);
                    setParsedItems(null);
                  }}
                  placeholder="Paste JSON array here..."
                  className="w-full p-3 font-mono text-xs border border-secondary/30 rounded-xl bg-background/20 focus:outline-none focus:ring-2 focus:ring-primary/30 leading-relaxed"
                />
              </div>

              {/* Parse & Validation Button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleValidate}
                  className="px-4 py-2 rounded-xl bg-secondary text-background text-xs font-bold hover:bg-primary transition shadow-sm"
                >
                  🔍 Parse & Verify JSON
                </button>

                <label className="flex items-center gap-2 text-xs text-secondary font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={replaceTimeline}
                    onChange={(e) => setReplaceTimeline(e.target.checked)}
                    className="accent-primary"
                  />
                  <span>Replace existing timeline (uncheck to append)</span>
                </label>
              </div>

              {/* Parsing Error */}
              {parseError && (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-700 text-xs rounded-xl font-medium">
                  ⚠️ {parseError}
                </div>
              )}

              {/* Parsed Preview Table */}
              {parsedItems && (
                <div className="space-y-3 bg-background/30 p-4 rounded-2xl border border-secondary/15">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-primary">
                      ✓ Validated: {parsedItems.length} Segments • Total ~{totalVersesInParsed} Ayahs
                    </span>
                    <span className="text-[11px] text-secondary">
                      Serially arranged by sequence
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar text-xs">
                    {parsedItems.map((item) => (
                      <div
                        key={item.serial}
                        className="p-2 rounded-lg bg-white border border-secondary/15 flex justify-between items-center text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-mono font-bold text-[10px] flex items-center justify-center">
                            {item.serial}
                          </span>
                          <span className="font-bold text-primary">
                            Surah {item.surahName} ({item.surahNum})
                          </span>
                          <span className="font-serif text-amber-900 font-bold">
                            {item.surahArabic}
                          </span>
                        </div>
                        <div className="text-secondary font-mono font-semibold">
                          Ayahs {item.from} - {item.to} ({item.count} verses)
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Execution Actions */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleImportToTimeline}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-background font-bold text-xs hover:bg-secondary transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-background" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          <span>{progressMsg || "Generating Master Timeline..."}</span>
                        </>
                      ) : (
                        <>⚡ Load into Master Timeline ({totalVersesInParsed} Ayahs)</>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleImportAsBatchJob}
                      className="py-2.5 px-4 rounded-xl border border-secondary/30 text-secondary hover:bg-background font-bold text-xs transition disabled:opacity-50"
                    >
                      + Add Directly to Batch Queue
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Export Tab */
            <div className="space-y-3">
              <p className="text-xs text-secondary/80">
                You can copy or save your current timeline configuration in JSON format to reload at any time:
              </p>
              <textarea
                rows={10}
                readOnly
                value={getTimelineExportJson()}
                className="w-full p-3 font-mono text-xs border border-secondary/30 rounded-xl bg-background/20 select-all focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(getTimelineExportJson());
                    alert("Copied timeline JSON to clipboard!");
                  }}
                  className="px-4 py-2 rounded-xl bg-primary text-background text-xs font-bold hover:bg-secondary transition shadow-sm"
                >
                  Copy JSON to Clipboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
