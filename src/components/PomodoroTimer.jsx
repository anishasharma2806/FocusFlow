import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, AlertCircle, X } from "lucide-react";

export default function PomodoroTimer({
  initialMinutes = 25,
  timeLeftProp,
  isActiveProp,
  onReset,
  keyProp,
  onStatusChange,
  onTimeUpdate,
  isPomodoro = false,
  setIsActive,
  setTimeLeft,
  phase = 1,
  totalPhases = 1,
  timerMode = "focus",
}) {
  const timeLeft = timeLeftProp !== undefined ? timeLeftProp : (initialMinutes * 60);
  const isActive = isActiveProp !== undefined ? isActiveProp : false;
  
  // Warning Dialog State
  const [dialog, setDialog] = useState(null); // { title, message, type }
  const [lastWarnedMin, setLastWarnedMin] = useState(null);
  const [lastMode, setLastMode] = useState(timerMode);
  const [lastPhase, setLastPhase] = useState(phase);

  // Reset warnings and transitions when key changes (new task)
  useEffect(() => {
    setLastWarnedMin(null);
    setDialog(null);
    setLastMode(timerMode);
    setLastPhase(phase);
  }, [keyProp]);

  // Handle Mode/Phase Transitions
  useEffect(() => {
    if (timerMode !== lastMode) {
      if (timerMode === "break") {
        setDialog({
          title: "Time for a break!",
          message: "Take 5 minutes to stretch and recharge.",
          type: "success"
        });
      } else if (timerMode === "focus") {
        setDialog({
          title: "Time to get back!",
          message: "Let's start the next focus phase.",
          type: "reminder"
        });
      }
      setLastMode(timerMode);
    }
  }, [timerMode, lastMode]);

  useEffect(() => {
    if (phase !== lastPhase) {
      setLastPhase(phase);
    }
  }, [phase, lastPhase]);

  // Stable Warning logic
  useEffect(() => {
    if (!isActive || timerMode !== "focus") return;

    const minsLeft = Math.ceil(timeLeft / 60);
    const totalSeconds = initialMinutes * 60;

    // Only trigger once per minute threshold
    if (minsLeft !== lastWarnedMin) {
      if (minsLeft === 15 && totalSeconds > 20 * 60) {
        setDialog({ title: "Keep Going!", message: "15 minutes to go!", type: "reminder" });
        setLastWarnedMin(minsLeft);
      } else if (minsLeft === 10) {
        setDialog({ title: "10 Minutes Left!", message: "You're entering the final stretch.", type: "warning" });
        setLastWarnedMin(minsLeft);
      } else if (minsLeft === 5) {
        setDialog({ title: "Almost Done!", message: "Only 5 minutes remaining.", type: "warning" });
        setLastWarnedMin(minsLeft);
      }
    }
  }, [timeLeft, isActive, timerMode, lastWarnedMin, initialMinutes]);

  // Completion check
  useEffect(() => {
    if (timeLeft === 0 && isActive && timerMode === "focus" && phase === totalPhases) {
      setDialog({
        title: "Session Complete!",
        message: "Fantastic work! You've reached your focus goal.",
        type: "success"
      });
    }
  }, [timeLeft === 0, isActive, timerMode, phase, totalPhases]);

  const toggleTimer = () => {
    if (onStatusChange) onStatusChange(!isActive);
  };

  const resetTimer = () => {
    if (onReset) onReset();
    setLastWarnedMin(null);
    setDialog(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`card timer-container ${timerMode === 'break' ? 'bg-indigo-50 border-indigo-200' : ''}`} role="timer" aria-label="Pomodoro Timer">
      <div className="flex justify-between items-center mb-2">
        {totalPhases >= 1 && (
          <div className={`ff-timer-phase ${timerMode === 'break' ? 'text-indigo-600 font-bold' : ''}`}>
             {timerMode === 'break' ? 'Break Time' : `Phase ${phase} / ${totalPhases}`}
          </div>
        )}
        {timerMode === 'break' && (
          <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full animate-pulse">BREAK</span>
        )}
      </div>
      
      <h2 className="timer-title">
        {timerMode === 'break' ? "Recharging..." : isActive ? "Focusing..." : "Ready to Focus"}
      </h2>

      <div className={`timer-display ${timerMode === 'break' ? 'text-indigo-600' : ''}`}>{formatTime(timeLeft)}</div>

      <div className="timer-actions">
        <button
          onClick={toggleTimer}
          className={`ff-btn ${timerMode === 'break' ? 'ff-btn-outline' : 'ff-btn-primary'}`}
          aria-label={isActive ? "Pause Timer" : "Start Timer"}
        >
          {isActive ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <button 
            onClick={resetTimer} 
            className="ff-btn ff-btn-outline"
            aria-label="Reset Timer"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Warning/Completion Dialog */}
      {dialog && (
        <div className="ff-dialog-overlay" onClick={() => setDialog(null)}>
          <div className="ff-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className={`ff-dialog-icon ${dialog.type === 'success' ? 'bg-green-100 text-green-600' : dialog.type === 'reminder' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
              <AlertCircle size={24} />
            </div>
            <h3 className="ff-dialog-title">{dialog.title}</h3>
            <p className="ff-dialog-message">{dialog.message}</p>
            <button 
              className="ff-dialog-btn"
              onClick={() => setDialog(null)}
            >
              {dialog.type === 'success' ? 'Great!' : 'Got it!'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
