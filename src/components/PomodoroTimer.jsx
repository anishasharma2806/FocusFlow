import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, AlertCircle, X } from "lucide-react";

export default function PomodoroTimer({
  initialMinutes = 25,
  autoStart = false,
  keyProp,
  onStatusChange,
  onTimeUpdate,
  isPomodoro = false,
  totalDuration = 25,
}) {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isActive, setIsActive] = useState(autoStart);
  
  // Warning Dialog State
  const [dialog, setDialog] = useState(null); // { title, message, type }
  const [hasWarned15, setHasWarned15] = useState(false);
  const [hasWarned10, setHasWarned10] = useState(false);
  const [hasWarned5, setHasWarned5] = useState(false);

  const totalSeconds = initialMinutes * 60;
  const currentPhase = isPomodoro ? Math.floor((totalSeconds - timeLeft) / (25 * 60)) + 1 : 1;
  const totalPhases = isPomodoro ? Math.ceil(initialMinutes / 25) : 1;

  // Reset timer when props change
  useEffect(() => {
    setTimeLeft(initialMinutes * 60);
    setIsActive(autoStart);
    setHasWarned15(false);
    setHasWarned10(false);
    setHasWarned5(false);
    setDialog(null);
  }, [initialMinutes, keyProp, autoStart, isPomodoro]);

  // Interval logic
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
            const next = prev - 1;
            
            // Call update callback
            if (onTimeUpdate) onTimeUpdate(next);

            // Check warnings
            const minsLeft = Math.ceil(next / 60);
            
            // 15 Min Reminder
            if (minsLeft === 15 && !hasWarned15 && totalSeconds > 20 * 60) {
              setDialog({
                title: "Keep Going!",
                message: "You've made great progress. 15 minutes to go!",
                type: "reminder"
              });
              setHasWarned15(true);
            }
            // 10 Min Warning
            else if (minsLeft === 10 && !hasWarned10) {
              setDialog({
                title: "10 Minutes Left!",
                message: "Stamina check! You're entering the final stretch.",
                type: "warning"
              });
              setHasWarned10(true);
            }
            // 5 Min Warning
            else if (minsLeft === 5 && !hasWarned5) {
              setDialog({
                title: "Almost Done!",
                message: "Only 5 minutes remaining. Focus purely on the finish line.",
                type: "warning"
              });
              setHasWarned5(true);
            }

            if (next <= 0) return 0;
            return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, hasWarned15, hasWarned10, hasWarned5, totalSeconds]);

  // Completion check
  useEffect(() => {
    if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setDialog({
        title: "Session Complete!",
        message: "Fantastic work! You've reached your focus goal.",
        type: "success"
      });
      if (onStatusChange) onStatusChange(false);
    }
  }, [timeLeft, isActive, onStatusChange]);

  const toggleTimer = () => {
    const newState = !isActive;
    setIsActive(newState);
    if (onStatusChange) onStatusChange(newState);
  };

  const resetTimer = () => {
    if (isActive) {
        setIsActive(false);
        if (onStatusChange) onStatusChange(false);
    }
    setTimeLeft(totalSeconds);
    setHasWarned15(false);
    setHasWarned10(false);
    setHasWarned5(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="card timer-container" role="timer" aria-label="Pomodoro Timer">
      {isPomodoro && totalPhases > 1 && (
        <div className="ff-timer-phase">
            Phase {Math.min(currentPhase, totalPhases)} / {totalPhases}
        </div>
      )}
      
      <h2 className="timer-title">
        {isActive ? "Focusing..." : "Ready to Focus"}
      </h2>

      <div className="timer-display">{formatTime(timeLeft)}</div>

      <div className="timer-actions">
        <button
          onClick={toggleTimer}
          className="ff-btn ff-btn-primary"
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
            <div className={`ff-dialog-icon ${dialog.type === 'success' ? 'bg-green-100 text-green-600' : ''}`}>
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
