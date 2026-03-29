import React, { useState, useEffect, useRef, useCallback } from "react";
import { Maximize, Minimize, Play, Pause, RotateCcw, X } from "lucide-react";

export default function DeepFocusMode({ onClose, initialMinutes = 25, timerState }) {
  const { timeLeft, isActive, setTimeLeft, setIsActive, reset } = timerState;
  const [particles, setParticles] = useState([]);
  const totalSeconds = initialMinutes * 60;

  // Generate particles
  useEffect(() => {
    const p = [];
    for (let i = 0; i < 30; i++) {
      p.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random() * 0.3 + 0.1,
      });
    }
    setParticles(p);
  }, []);

  // Keyboard controls
  const handleKey = useCallback((e) => {
    if (e.code === "Space") { e.preventDefault(); setIsActive(!isActive); }
    if (e.code === "Escape") { onClose?.(); }
    if (e.code === "KeyR") { reset(); }
  }, [onClose, isActive, setIsActive, reset]);

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // Try fullscreen
  useEffect(() => {
    try { document.documentElement.requestFullscreen?.(); } catch {}
    return () => { try { document.exitFullscreen?.(); } catch {} };
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="ff-deep-focus">
      {/* Particles */}
      <div className="ff-particles">
        {particles.map(p => (
          <div
            key={p.id}
            className="ff-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size + "px",
              height: p.size + "px",
              opacity: p.opacity,
              animationDuration: `${20 / p.speed}s`,
            }}
          />
        ))}
      </div>

      {/* Close */}
      <button className="ff-deep-close" onClick={onClose}>
        <X size={24} />
      </button>

      {/* Timer */}
      <div className="ff-deep-timer">
        <svg width="320" height="320" viewBox="0 0 320 320">
          <circle cx="160" cy="160" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <circle
            cx="160" cy="160" r={radius} fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 160 160)"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="ff-deep-time-text">
          <div className="ff-deep-time">{formatTime(timeLeft)}</div>
          <div className="ff-deep-status">{isActive ? "Focusing" : timeLeft === 0 ? "Complete!" : "Paused"}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="ff-deep-controls">
        <button className="ff-deep-btn" onClick={() => setIsActive(!isActive)}>
          {isActive ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button className="ff-deep-btn secondary" onClick={() => reset()}>
          <RotateCcw size={20} />
        </button>
      </div>

      {/* Hints */}
      <div className="ff-deep-hints">
        <span>Space: Play/Pause</span>
        <span>R: Reset</span>
        <span>Esc: Exit</span>
      </div>
    </div>
  );
}
