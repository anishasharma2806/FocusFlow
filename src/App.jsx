import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import HomePage from "./components/HomePage";
import NotesPage from "./components/NotesPage";
import FlashcardsPage from "./components/FlashcardsPage";
import AnalyticsPage from "./components/AnalyticsPage";
import KnowledgeGraphPage from "./components/KnowledgeGraphPage";
import AchievementsPage from "./components/AchievementsPage";
import PlannerPage from "./components/PlannerPage";
import FocusScorePage from "./components/FocusScorePage";
import DataManager from "./components/DataManager";
import DeepFocusMode from "./components/DeepFocusMode";
import KeyboardShortcutsProvider from "./components/KeyboardShortcutsProvider";
import "./components.ff.css";

function App() {
  const [showFocusMode, setShowFocusMode] = useState(false);

  // Global Timer State
  const [timerTimeLeft, setTimerTimeLeft] = useState(0);
  const [timerIsActive, setTimerIsActive] = useState(false);
  const [timerActiveTaskId, setTimerActiveTaskId] = useState(null);
  const [timerUsePomodoro, setTimerUsePomodoro] = useState(false);
  const [timerDuration, setTimerDuration] = useState(25);
  const [timerKey, setTimerKey] = useState(0); // For resetting PomodoroTimer component internal state
  const [timerPhase, setTimerPhase] = useState(1);
  const [timerTotalPhases, setTimerTotalPhases] = useState(1);
  const [timerMode, setTimerMode] = useState("focus"); // 'focus' | 'break'

  // Global Ticker
  useEffect(() => {
    let interval = null;
    if (timerIsActive && timerTimeLeft > 0) {
      interval = setInterval(() => {
        setTimerTimeLeft(prev => {
          if (prev <= 1) {
            // PHASE TRANSITION LOGIC
            if (timerMode === "focus") {
              if (timerPhase < timerTotalPhases) {
                // Time for a break
                setTimerMode("break");
                setTimerTimeLeft(5 * 60); // 5 minute break
                return 5 * 60;
              } else {
                setTimerIsActive(false);
                return 0;
              }
            } else {
              // Break ended, back to focus
              setTimerMode("focus");
              setTimerPhase(p => p + 1);
              setTimerTimeLeft(25 * 60); // Next 25m focus
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerIsActive, timerTimeLeft]);

  const handleStartFocus = (task) => {
    // BUG 1 FIX: Don't restart if this task is already active
    if (timerActiveTaskId === task.id && timerIsActive) return;

    const duration = timerUsePomodoro ? 25 : task.duration;
    const totalPhases = timerUsePomodoro ? Math.max(1, Math.ceil(task.duration / 25)) : 1;
    
    setTimerActiveTaskId(task.id);
    setTimerDuration(duration);
    setTimerTimeLeft(duration * 60);
    setTimerIsActive(true);
    setTimerPhase(1);
    setTimerTotalPhases(totalPhases);
    setTimerMode("focus");
    setTimerKey(Date.now());
  };

  const handleTimerToggle = (active) => {
    setTimerIsActive(active);
  };

  const handleTimerReset = () => {
    setTimerIsActive(false);
    setTimerTimeLeft(timerDuration * 60);
    setTimerKey(Date.now());
  };

  const handleSetTimerMode = (isPomodoro) => {
    setTimerUsePomodoro(isPomodoro);
    setTimerActiveTaskId(null);
    setTimerIsActive(false);
    setTimerTimeLeft(25 * 60);
    setTimerDuration(25);
    setTimerPhase(1);
    setTimerTotalPhases(1);
    setTimerMode("focus");
    setTimerKey(Date.now());
  };

  return (
    <BrowserRouter>
      <KeyboardShortcutsProvider onToggleFocusMode={() => setShowFocusMode(s => !s)} />
      <div className="ff-app-layout">
        <Sidebar />
        <div className="ff-app-content">
          <Routes>
            <Route 
              path="/" 
              element={
                <HomePage 
                  timerProps={{
                    timeLeft: timerTimeLeft,
                    isActive: timerIsActive,
                    activeTaskId: timerActiveTaskId,
                    usePomodoro: timerUsePomodoro,
                    duration: timerDuration,
                    key: timerKey,
                    onStartFocus: handleStartFocus,
                    onToggle: handleTimerToggle,
                    onReset: handleTimerReset,
                    onSetMode: handleSetTimerMode,
                    setTimeLeft: setTimerTimeLeft,
                    setIsActive: setTimerIsActive,
                    phase: timerPhase,
                    totalPhases: timerTotalPhases,
                    mode: timerMode
                  }} 
                />
              } 
            />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/flashcards" element={<FlashcardsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/knowledge-graph" element={<KnowledgeGraphPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route 
              path="/planner" 
              element={
                <PlannerPage 
                  timerProps={{
                    timeLeft: timerTimeLeft,
                    isActive: timerIsActive,
                    activeTaskId: timerActiveTaskId,
                    phase: timerPhase,
                    totalPhases: timerTotalPhases,
                    mode: timerMode
                  }} 
                />
              } 
            />
            <Route path="/focus-score" element={<FocusScorePage />} />
            <Route path="/data" element={<DataManager />} />
          </Routes>
        </div>
      </div>

      {/* Deep Focus Mode Overlay */}
      {showFocusMode && (
        <DeepFocusMode 
          onClose={() => setShowFocusMode(false)} 
          initialMinutes={timerDuration}
          timerState={{
            timeLeft: timerTimeLeft,
            isActive: timerIsActive,
            setTimeLeft: setTimerTimeLeft,
            setIsActive: setTimerIsActive,
            reset: handleTimerReset
          }}
        />
      )}
    </BrowserRouter>
  );
}

export default App;
