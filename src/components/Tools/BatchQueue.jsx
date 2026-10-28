"use client";

import React, { useState } from "react";
import JSZip from "jszip";
import {
  generateArabicSrt,
  generateEnglishSrt,
  generateBilingualSrt,
  downloadFile,
  downloadZipBundle,
} from "@/lib/srtGenerator";

export default function BatchQueue({
  batchJobs = [],
  setBatchJobs,
  onRunSingleJob,
  onRunAllBatch,
  isBatchRunning = false,
  onOpenInPlayer,
}) {
  const [editingJobId, setEditingJobId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const handleStartRename = (job) => {
    setEditingJobId(job.id);
    setEditingName(job.name);
  };

  const handleSaveRename = (jobId) => {
    if (editingName.trim()) {
      setBatchJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, name: editingName.trim() } : j))
      );
    }
    setEditingJobId(null);
  };

  const handleRemoveJob = (jobId) => {
    setBatchJobs((prev) => {
      const job = prev.find((j) => j.id === jobId);
      if (job?.result?.audioUrl) {
        URL.revokeObjectURL(job.result.audioUrl);
      }
      return prev.filter((j) => j.id !== jobId);
    });
  };

  const handleClearCompleted = () => {
    setBatchJobs((prev) =>
      prev.filter((j) => {
        if (j.status === "completed" && j.result?.audioUrl) {
          URL.revokeObjectURL(j.result.audioUrl);
          return false;
        }
        return true;
      })
    );
  };

  // Download all completed jobs as a master ZIP archive
  const handleDownloadAllMasterZip = async () => {
    const completedJobs = batchJobs.filter((j) => j.status === "completed" && j.result);
    if (completedJobs.length === 0) return;

    const masterZip = new JSZip();

    for (const job of completedJobs) {
      const jobFolder = masterZip.folder(job.name.replace(/[^a-zA-Z0-9_-]/g, "_"));
      const res = job.result;

      if (res.audioBlob) {
        jobFolder.file(`${job.name}.wav`, res.audioBlob);
      }
      jobFolder.file("subtitles_arabic.srt", generateArabicSrt(res.segments));
      jobFolder.file("subtitles_english.srt", generateEnglishSrt(res.segments));
      jobFolder.file("subtitles_bilingual.srt", generateBilingualSrt(res.segments));
    }

    const blob = await masterZip.generateAsync({ type: "blob" });
    downloadFile(blob, "QuranWise_Batch_Export.zip", "application/zip");
  };

  const completedCount = batchJobs.filter((j) => j.status === "completed").length;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-md border border-secondary/15 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-secondary/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500" />
            <h3 className="font-bold text-lg text-primary">
              Batch Processing Queue ({batchJobs.length} Jobs)
            </h3>
          </div>
          <p className="text-xs text-secondary/70">
            Queue multiple recitations and process them all in sequence with zero quality loss
          </p>
        </div>

        <div className="flex items-center gap-2">
          {completedCount > 0 && (
            <>
              <button
                type="button"
                onClick={handleDownloadAllMasterZip}
                className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition shadow-sm flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download All ({completedCount})
              </button>
              <button
                type="button"
                onClick={handleClearCompleted}
                className="px-3 py-1.5 rounded-xl border border-secondary/20 text-secondary hover:bg-background text-xs font-semibold transition"
              >
                Clear Finished
              </button>
            </>
          )}

          <button
            type="button"
            disabled={batchJobs.length === 0 || isBatchRunning}
            onClick={onRunAllBatch}
            className="px-4 py-2 rounded-xl bg-primary text-background font-bold text-xs hover:bg-secondary transition shadow-md disabled:opacity-40 flex items-center gap-2"
          >
            {isBatchRunning ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-background" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Batch Processing Active...
              </>
            ) : (
              <>▶ Run All Batch Jobs</>
            )}
          </button>
        </div>
      </div>

      {/* Queue List */}
      {batchJobs.length === 0 ? (
        <div className="py-12 px-4 text-center border-2 border-dashed border-secondary/20 rounded-2xl bg-background/20">
          <div className="w-12 h-12 mx-auto rounded-full bg-secondary/10 flex items-center justify-center text-primary mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h4 className="font-bold text-primary text-sm mb-1">Batch Queue is Empty</h4>
          <p className="text-xs text-secondary/70 max-w-sm mx-auto">
            Build any ayah timeline in the Timeline Editor above and click{" "}
            <strong>"+ Queue as Batch Job"</strong> to add it here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {batchJobs.map((job, idx) => (
            <div
              key={job.id}
              className={`p-4 rounded-xl border transition ${
                job.status === "processing"
                  ? "bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/30"
                  : job.status === "completed"
                  ? "bg-emerald-50/60 border-emerald-300"
                  : job.status === "failed"
                  ? "bg-rose-50 border-rose-300"
                  : "bg-background/30 border-secondary/20"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Job Title & Details */}
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-background font-mono font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>

                  <div>
                    {editingJobId === job.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="px-2 py-1 text-xs border rounded bg-white font-bold"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRename(job.id)}
                          className="text-xs text-emerald-700 font-bold hover:underline"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-primary">{job.name}</h4>
                        <button
                          onClick={() => handleStartRename(job)}
                          className="text-secondary/50 hover:text-secondary text-xs"
                          title="Rename Job"
                        >
                          ✎
                        </button>
                      </div>
                    )}

                    <div className="text-xs text-secondary/80 flex items-center gap-2 mt-0.5">
                      <span>{job.timeline.length} Ayahs</span>
                      <span>•</span>
                      <span>{job.reciterName}</span>
                      <span>•</span>
                      <span>Gap: {job.gapSeconds}s</span>
                    </div>
                  </div>
                </div>

                {/* Status Badges & Controls */}
                <div className="flex items-center gap-2">
                  {job.status === "idle" && (
                    <button
                      type="button"
                      disabled={isBatchRunning}
                      onClick={() => onRunSingleJob(job.id)}
                      className="px-3 py-1.5 rounded-lg bg-primary text-background font-semibold text-xs hover:bg-secondary transition disabled:opacity-40"
                    >
                      ▶ Process Job
                    </button>
                  )}

                  {job.status === "processing" && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
                      <svg className="animate-spin h-3.5 w-3.5 text-amber-700" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>{job.progressMessage || `${job.progress}%`}</span>
                    </div>
                  )}

                  {job.status === "completed" && job.result && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenInPlayer(job)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition shadow-sm flex items-center gap-1"
                      >
                        ▶ Open in Player
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          downloadZipBundle({
                            zipFilename: `${job.name}.zip`,
                            audioBlob: job.result.audioBlob,
                            audioFilename: `${job.name}.wav`,
                            segments: job.result.segments,
                            reciterName: job.reciterName,
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-400 text-emerald-800 font-bold text-xs hover:bg-emerald-50 transition"
                        title="Download ZIP with WAV & SRTs"
                      >
                        ZIP
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          downloadFile(job.result.audioBlob, `${job.name}.wav`, "audio/wav")
                        }
                        className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-800 text-xs"
                        title="Download Audio (.wav)"
                      >
                        🎵
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          downloadFile(
                            generateBilingualSrt(job.result.segments),
                            `${job.name}_Bilingual.srt`
                          )
                        }
                        className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-800 text-xs"
                        title="Download Bilingual SRT"
                      >
                        📄
                      </button>
                    </div>
                  )}

                  {job.status === "failed" && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rose-700 font-bold">Failed</span>
                      <button
                        type="button"
                        onClick={() => onRunSingleJob(job.id)}
                        className="px-2 py-1 rounded bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    disabled={job.status === "processing"}
                    onClick={() => handleRemoveJob(job.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 text-xs transition disabled:opacity-30"
                    title="Remove Job"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Progress bar for running job */}
              {job.status === "processing" && (
                <div className="mt-3 w-full bg-secondary/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              )}

              {/* Error message if failed */}
              {job.status === "failed" && job.error && (
                <div className="mt-2 text-xs text-rose-700 bg-rose-100/70 p-2 rounded-lg">
                  {job.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
