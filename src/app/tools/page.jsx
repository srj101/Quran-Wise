"use client";

import React, { useState, useEffect } from "react";
import TimelineEditor from "@/components/Tools/TimelineEditor";
import StudioPlayer from "@/components/Tools/StudioPlayer";
import BatchQueue from "@/components/Tools/BatchQueue";
import { RECITERS } from "@/data/reciters";
import { renderTimelineAudio } from "@/lib/audioEngine";

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState("builder"); // 'builder' | 'player' | 'batch'
  const [timeline, setTimeline] = useState([]);
  const [selectedReciter, setSelectedReciter] = useState("alafasy");
  const [gapSeconds, setGapSeconds] = useState(0.3);

  // Generation status
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressInfo, setProgressInfo] = useState({ percentage: 0, message: "" });
  const [errorMessage, setErrorMessage] = useState("");

  // Current active rendered result
  const [activeResult, setActiveResult] = useState(null);

  // Batch jobs
  const [batchJobs, setBatchJobs] = useState([]);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Helper to generate a descriptive job name from timeline
  const generateJobName = (items) => {
    if (!items || items.length === 0) return "Quran_Recitation";
    const first = items[0];
    const last = items[items.length - 1];
    if (items.length === 1) {
      return `${first.surahName}_${first.ayahNumber}`;
    }
    if (first.surahId === last.surahId) {
      return `${first.surahName}_${first.ayahNumber}-${last.ayahNumber}`;
    }
    return `${first.surahName}_to_${last.surahName}_(${items.length}_Ayahs)`;
  };

  // Generate Current Timeline Audio & SRT
  const handleGenerateTimeline = async () => {
    if (timeline.length === 0) return;
    setIsProcessing(true);
    setErrorMessage("");
    setProgressInfo({ percentage: 5, message: "Preparing audio sources..." });

    const reciterObj = RECITERS.find((r) => r.id === selectedReciter) || RECITERS[0];
    const jobName = generateJobName(timeline);

    try {
      const result = await renderTimelineAudio(timeline, {
        reciterId: selectedReciter,
        gapSeconds,
        onProgress: (step, data) => {
          setProgressInfo({
            percentage: data.percentage || 50,
            message: data.message || `Processing ayahs (${data.current || 0}/${data.total || 0})...`,
          });
        },
      });

      // Cleanup old blob URL if present
      if (activeResult?.audioUrl) {
        URL.revokeObjectURL(activeResult.audioUrl);
      }

      const newResult = {
        ...result,
        reciterName: reciterObj.name,
        jobName,
      };

      setActiveResult(newResult);
      setActiveTab("player");
      showToast("✓ Lossless Audio & Subtitles generated successfully!");
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || "Failed to generate audio and subtitles.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Add current timeline to Batch Processing Queue
  const handleAddToBatch = () => {
    if (timeline.length === 0) return;
    const reciterObj = RECITERS.find((r) => r.id === selectedReciter) || RECITERS[0];
    const name = generateJobName(timeline);

    const newJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      timeline: [...timeline],
      reciterId: selectedReciter,
      reciterName: reciterObj.name,
      gapSeconds,
      status: "idle",
      progress: 0,
      progressMessage: "",
      error: null,
      result: null,
    };

    setBatchJobs((prev) => [...prev, newJob]);
    showToast(`✓ Added "${name}" to Batch Queue!`);
  };

  // Run a single job from batch
  const handleRunSingleJob = async (jobId) => {
    const job = batchJobs.find((j) => j.id === jobId);
    if (!job) return;

    setBatchJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? { ...j, status: "processing", progress: 5, progressMessage: "Initializing..." }
          : j
      )
    );

    try {
      const result = await renderTimelineAudio(job.timeline, {
        reciterId: job.reciterId,
        gapSeconds: job.gapSeconds,
        onProgress: (step, data) => {
          setBatchJobs((prev) =>
            prev.map((j) =>
              j.id === jobId
                ? {
                    ...j,
                    progress: data.percentage || 50,
                    progressMessage:
                      data.message ||
                      `Processing ayahs (${data.current || 0}/${data.total || 0})...`,
                  }
                : j
            )
          );
        },
      });

      setBatchJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: "completed",
                progress: 100,
                progressMessage: "Done",
                result,
              }
            : j
        )
      );
      showToast(`✓ Completed "${job.name}"`);
    } catch (err) {
      console.error(err);
      setBatchJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: "failed",
                error: err.message || "Rendering failed.",
              }
            : j
        )
      );
    }
  };

  // Run all batch jobs sequentially
  const handleRunAllBatch = async () => {
    const pendingJobs = batchJobs.filter((j) => j.status === "idle" || j.status === "failed");
    if (pendingJobs.length === 0) return;

    setIsBatchRunning(true);

    for (const job of pendingJobs) {
      await handleRunSingleJob(job.id);
    }

    setIsBatchRunning(false);
    showToast("✓ All batch jobs finished processing!");
  };

  // Open finished batch job in the interactive player
  const handleOpenInPlayer = (job) => {
    if (!job?.result) return;
    setActiveResult({
      ...job.result,
      reciterName: job.reciterName,
      jobName: job.name,
    });
    setActiveTab("player");
  };

  return (
    <div className="min-h-screen py-8 px-4 max-w-7xl mx-auto space-y-8 font-monsterate">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-background px-4 py-3 rounded-2xl shadow-2xl border border-secondary/30 flex items-center gap-3 animate-fade-in text-sm font-semibold">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero / Studio Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/15 text-secondary text-xs font-bold tracking-wide uppercase">
          <span>Quran Studio & Audio Lab</span>
          <span>•</span>
          <span>Sample-Accurate SRT</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-primary tracking-tight">
          Quran Audio & Subtitles Studio
        </h1>
        <p className="text-secondary/80 max-w-2xl mx-auto text-sm md:text-base">
          Assemble custom sequences of ayahs from any Surahs, preview them on a serially organized
          timeline, and generate lossless audio with millisecond-exact Arabic & English subtitles.
        </p>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 rounded-2xl bg-white shadow-md border border-secondary/15 gap-1 text-xs md:text-sm">
          <button
            onClick={() => setActiveTab("builder")}
            className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === "builder"
                ? "bg-primary text-background shadow-sm"
                : "text-secondary hover:text-primary hover:bg-background/40"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Timeline Studio ({timeline.length})
          </button>

          <button
            onClick={() => setActiveTab("player")}
            className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === "player"
                ? "bg-primary text-background shadow-sm"
                : "text-secondary hover:text-primary hover:bg-background/40"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Studio Player & Subtitles
            {activeResult && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
          </button>

          <button
            onClick={() => setActiveTab("batch")}
            className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
              activeTab === "batch"
                ? "bg-primary text-background shadow-sm"
                : "text-secondary hover:text-primary hover:bg-background/40"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
            Batch Queue ({batchJobs.length})
          </button>
        </div>
      </div>

      {/* Global Processing Modal / Overlay when generating */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-secondary/20 text-center space-y-5 animate-scale-up">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
              <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>

            <div>
              <h3 className="font-bold text-lg text-primary">Generating Studio Audio & SRT</h3>
              <p className="text-xs text-secondary/80 mt-1">{progressInfo.message}</p>
            </div>

            <div className="w-full bg-background rounded-full h-2.5 overflow-hidden border border-secondary/20">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-700 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressInfo.percentage}%` }}
              />
            </div>

            <p className="text-[11px] text-secondary/70">
              Hardware-accelerated OfflineAudioContext is rendering sample-accurate audio in browser memory.
            </p>
          </div>
        </div>
      )}

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex justify-between items-center">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage("")} className="font-bold underline ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB CONTENT 1: Timeline Builder */}
      {activeTab === "builder" && (
        <TimelineEditor
          timeline={timeline}
          setTimeline={setTimeline}
          selectedReciter={selectedReciter}
          setSelectedReciter={setSelectedReciter}
          gapSeconds={gapSeconds}
          setGapSeconds={setGapSeconds}
          onGenerate={handleGenerateTimeline}
          onAddToBatch={handleAddToBatch}
          onQueueBatchJob={(jobData) => {
            const newJob = {
              id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              name: jobData.name,
              timeline: jobData.timeline,
              reciterId: jobData.reciterId,
              reciterName: jobData.reciterName,
              gapSeconds: jobData.gapSeconds,
              status: "idle",
              progress: 0,
              progressMessage: "",
              error: null,
              result: null,
            };
            setBatchJobs((prev) => [...prev, newJob]);
            showToast(`✓ Added "${jobData.name}" to Batch Queue!`);
          }}
          isProcessing={isProcessing}
        />
      )}

      {/* TAB CONTENT 2: Studio Player & Subtitle Viewer */}
      {activeTab === "player" && (
        <div>
          {activeResult ? (
            <StudioPlayer
              audioUrl={activeResult.audioUrl}
              audioBlob={activeResult.audioBlob}
              segments={activeResult.segments}
              duration={activeResult.duration}
              waveformPeaks={activeResult.waveformPeaks}
              reciterName={activeResult.reciterName}
              jobName={activeResult.jobName}
            />
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-secondary/15 shadow-md space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-secondary/10 flex items-center justify-center text-primary">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-primary">No Rendered Audio Yet</h3>
              <p className="text-xs text-secondary/70 max-w-md mx-auto">
                Build your timeline in the <strong>Timeline Studio</strong> tab and click{" "}
                <strong>"Generate Audio & Subtitles"</strong> to preview the interactive player,
                WebGL waveform, and synchronized subtitles.
              </p>
              <button
                onClick={() => setActiveTab("builder")}
                className="px-4 py-2 rounded-xl bg-primary text-background font-bold text-xs hover:bg-secondary transition"
              >
                Go to Timeline Studio →
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: Batch Queue Manager */}
      {activeTab === "batch" && (
        <BatchQueue
          batchJobs={batchJobs}
          setBatchJobs={setBatchJobs}
          onRunSingleJob={handleRunSingleJob}
          onRunAllBatch={handleRunAllBatch}
          isBatchRunning={isBatchRunning}
          onOpenInPlayer={handleOpenInPlayer}
        />
      )}
    </div>
  );
}
