"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";

/**
 * WebGL-accelerated audio waveform visualizer with interactive scrubber and ayah boundary markers.
 * Falls back cleanly to 2D Canvas if WebGL is unavailable.
 */
export default function WebGLWaveform({
  peaks,
  currentTime = 0,
  duration = 1,
  onSeek,
  segments = [],
  height = 110,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverAyah, setHoverAyah] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const glContextRef = useRef(null);
  const programRef = useRef(null);
  const positionBufferRef = useRef(null);

  const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  // Initialize WebGL once or fall back
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: true, antialias: true }) ||
               canvas.getContext("experimental-webgl");

    if (!gl) {
      console.warn("WebGL not supported, using Canvas 2D fallback.");
      return;
    }

    glContextRef.current = gl;

    // Vertex shader
    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = (a_position + 1.0) * 0.5;
      }
    `;

    // Fragment shader for gradient styling, playhead glow, and ayah bar visualization
    const fsSource = `
      precision mediump float;
      uniform float u_progress;
      varying vec2 v_texCoord;

      void main() {
        float x = v_texCoord.x;
        float y = v_texCoord.y;

        // Played vs unplayed color scheme
        vec4 playedColor = vec4(0.85, 0.55, 0.15, 0.95);    // Warm Gold
        vec4 unplayedColor = vec4(0.42, 0.28, 0.28, 0.70);  // Warm Burgundy Accent
        vec4 playheadColor = vec4(1.0, 0.92, 0.65, 1.0);    // Bright Ivory Playhead

        float distFromPlayhead = abs(x - u_progress);

        if (distFromPlayhead < 0.003) {
          gl_FragColor = playheadColor;
        } else if (x < u_progress) {
          gl_FragColor = playedColor;
        } else {
          gl_FragColor = unplayedColor;
        }
      }
    `;

    function createShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      return;
    }

    programRef.current = program;
    positionBufferRef.current = gl.createBuffer();

    return () => {
      if (glContextRef.current && programRef.current) {
        glContextRef.current.deleteProgram(programRef.current);
      }
    };
  }, []);

  // Render WebGL / Canvas waveform whenever peaks, progress, or size change
  const renderWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.floor(rect.width * dpr);
    const canvasHeight = Math.floor(height * dpr);

    if (canvas.width !== width || canvas.height !== canvasHeight) {
      canvas.width = width;
      canvas.height = canvasHeight;
    }

    const gl = glContextRef.current;
    const program = programRef.current;

    if (gl && program && peaks && peaks.length > 0) {
      // Hardware-accelerated WebGL rendering
      gl.viewport(0, 0, width, canvasHeight);
      gl.clearColor(0.98, 0.94, 0.88, 1.0); // Soft sand background #FFF0D1
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);

      const progressLoc = gl.getUniformLocation(program, "u_progress");
      gl.uniform1f(progressLoc, progress);

      // Generate triangle strip quads for each peak bar
      const numBars = peaks.length;
      const barWidthNorm = 2.0 / numBars;
      const vertices = [];

      for (let i = 0; i < numBars; i++) {
        const peak = Math.max(0.08, peaks[i]);
        const x1 = -1.0 + i * barWidthNorm + (barWidthNorm * 0.15);
        const x2 = x1 + (barWidthNorm * 0.70);
        const yTop = peak;
        const yBottom = -peak;

        // Two triangles for the bar rectangle
        vertices.push(
          x1, yBottom,
          x2, yBottom,
          x1, yTop,
          x1, yTop,
          x2, yBottom,
          x2, yTop
        );
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferRef.current);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

      const positionLoc = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 2);
    } else {
      // 2D Canvas High-performance Fallback
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, width, canvasHeight);

      if (!peaks || peaks.length === 0) {
        // Placeholder idle line
        ctx.strokeStyle = "#795757";
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        ctx.moveTo(0, canvasHeight / 2);
        ctx.lineTo(width, canvasHeight / 2);
        ctx.stroke();
        return;
      }

      const numBars = peaks.length;
      const barWidth = width / numBars;
      const centerY = canvasHeight / 2;

      for (let i = 0; i < numBars; i++) {
        const peak = Math.max(0.08, peaks[i]);
        const barH = peak * (canvasHeight * 0.42);
        const x = i * barWidth;
        const isPlayed = x / width <= progress;

        ctx.fillStyle = isPlayed ? "#d97706" : "#664343";
        ctx.fillRect(x + barWidth * 0.15, centerY - barH, barWidth * 0.7, barH * 2);
      }

      // Draw Playhead
      const playheadX = progress * width;
      ctx.fillStyle = "#3b3030";
      ctx.fillRect(playheadX - 1.5 * dpr, 0, 3 * dpr, canvasHeight);
    }
  }, [peaks, progress, height]);

  useEffect(() => {
    let animId = requestAnimationFrame(renderWaveform);
    return () => cancelAnimationFrame(animId);
  }, [renderWaveform]);

  // Handle click / drag seeking
  const handleSeekFromEvent = (e) => {
    if (!onSeek || duration <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const targetProgress = clickX / rect.width;
    const targetTime = targetProgress * duration;
    onSeek(targetTime);
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || duration <= 0) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const time = (clickX / rect.width) * duration;
    setHoverTime(time);

    // Find which ayah corresponds to this hover position
    const matchAyah = segments.find(
      (s) => time >= s.startTime && time <= s.endTime
    );
    setHoverAyah(matchAyah || null);

    if (isDragging) {
      handleSeekFromEvent(e);
    }
  };

  const formatSeconds = (sec) => {
    if (isNaN(sec)) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    return `${m}:${s < 10 ? "0" : ""}${s}.${ms}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-xl overflow-hidden bg-background/80 border border-secondary/20 shadow-inner select-none cursor-pointer group"
      style={{ height: `${height}px` }}
      onMouseDown={(e) => {
        setIsDragging(true);
        handleSeekFromEvent(e);
      }}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => {
        setIsDragging(false);
        setHoverTime(null);
        setHoverAyah(null);
      }}
      onMouseMove={handleMouseMove}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Ayah boundary markers */}
      {segments.length > 0 && duration > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {segments.map((seg, idx) => {
            const leftPercent = (seg.startTime / duration) * 100;
            return (
              <div
                key={idx}
                className="absolute top-0 bottom-0 border-l border-primary/20 flex flex-col justify-between px-1"
                style={{ left: `${leftPercent}%` }}
              >
                <span className="text-[10px] font-semibold text-secondary/80 bg-background/90 px-1 rounded shadow-sm">
                  {seg.surahName} {seg.ayahNumber}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Hover tooltip */}
      {hoverTime !== null && (
        <div
          className="absolute -top-10 -translate-x-1/2 bg-primary text-background text-xs font-mono py-1 px-2 rounded shadow-lg pointer-events-none z-20 whitespace-nowrap"
          style={{
            left: `${(hoverTime / duration) * 100}%`,
          }}
        >
          {formatSeconds(hoverTime)}
          {hoverAyah && (
            <span className="ml-1.5 text-amber-300 font-sans font-bold">
              • {hoverAyah.surahName} {hoverAyah.ayahNumber}
            </span>
          )}
        </div>
      )}

      {/* Playhead position pill */}
      <div
        className="absolute top-1 right-2 bg-primary/80 backdrop-blur-sm text-background text-[11px] font-mono px-2 py-0.5 rounded shadow"
      >
        {formatSeconds(currentTime)} / {formatSeconds(duration)}
      </div>
    </div>
  );
}
