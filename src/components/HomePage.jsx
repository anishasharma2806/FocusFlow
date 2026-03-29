/**
 * HomePage — The original FocusFlow main view, extracted for routing.
 * All existing logic (tasks, timer, quotes) lives here unchanged.
 */
import React, { useState, useEffect } from "react";
import Dashboard from "./Dashboard";
import TaskForm from "./TaskForm";
import TaskList from "./TaskList";
import PomodoroTimer from "./PomodoroTimer";
import { Layout, Brain, Quote } from "lucide-react";

export default function HomePage({ timerProps }) {
  const {
    timeLeft,
    isActive,
    activeTaskId,
    usePomodoro,
    duration,
    timerKey,
    onStartFocus,
    onToggle,
    onReset,
    onSetMode,
    setTimeLeft,
    setIsActive,
    phase,
    totalPhases,
    mode
  } = timerProps;

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("focusflow_tasks");
    return saved ? JSON.parse(saved) : [];
  });

  const [confirmCompleteId, setConfirmCompleteId] = useState(null);

  // ---------------- SAVE TASKS ----------------
  useEffect(() => {
    import("../utils/storage").then(({ setItem, STORAGE_KEYS }) => {
      try {
        const success = setItem(STORAGE_KEYS.TASKS, tasks);
        if (!success) {
          alert("Storage Full! Could not save tasks. Please try removing large file attachments or old notes.");
        }
      } catch (e) {
        if (e.name === 'QuotaExceededError') {
          alert("LocalStorage Quota Exceeded! Failed to save tasks. Please delete some old tasks or large attachments.");
        } else {
          console.error("Failed to save tasks:", e);
        }
      }
    });
  }, [tasks]);

  const addTask = (newTask) => {
    setTasks([newTask, ...tasks]);
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const toggleComplete = (id, force = false) => {
    const task = tasks.find(t => t.id === id);
    if (!task.completed && !force) {
        if (activeTaskId === id && timeLeft > 15 * 60) {
            setConfirmCompleteId(id);
            return;
        }
    }

    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          const newCompletedState = force ? true : !task.completed;
          let updatedSubtasks = task.subtasks;
          
          if (newCompletedState && task.subtasks && task.subtasks.length > 0) {
            updatedSubtasks = task.subtasks.map(st => ({ ...st, completed: true }));
          }

          if (activeTaskId === id && newCompletedState) {
            onReset(); // Reset timer if completed
          }

          return {
            ...task,
            completed: newCompletedState,
            subtasks: updatedSubtasks,
          };
        }
        return task;
      }),
    );
    setConfirmCompleteId(null);
  };

  const updateTask = (taskId, updates) => {
    setTasks(prevTasks => prevTasks.map(task => 
        task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  // ---------------- TIMER COMPLETION AUTO-SAVE ----------------
  useEffect(() => {
    if (timeLeft === 0 && isActive && activeTaskId) {
        // Find task and update actualTime
        setTasks(prev => prev.map(t => {
            if (t.id === activeTaskId) {
                return {
                    ...t,
                    actualTime: (t.actualTime || 0) + duration
                };
            }
            return t;
        }));
    }
  }, [timeLeft, isActive, activeTaskId, duration]);

  const handleTimerToggle = React.useCallback((active) => {
    onToggle(active);
  }, [onToggle]);

  const startFocus = (task) => {
    onStartFocus(task);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getStats = () => {
    const completedTasks = tasks.filter((t) => t.completed);
    const totalMinutes = completedTasks.reduce(
      (acc, curr) => acc + (curr.actualTime || 0),
      0,
    );
    return {
      timeSpent: totalMinutes,
      completed: completedTasks.length,
      upcoming: tasks.filter((t) => !t.completed).length,
    };
  };

  // ---------------- QUOTES ----------------
  const quotes = [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Success is the sum of small efforts repeated daily.", author: "Robert Collier" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
    { text: "Your limitation—it's only your imagination.", author: "Unknown" },
    { text: "Dream it. Wish it. Do it.", author: "Unknown" },
    { text: "Push yourself because no one else will.", author: "Unknown" },
    { text: "Great things never come from comfort zones.", author: "Unknown" },
    { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
    { text: "Don't stop when you're tired. Stop when you're done.", author: "Marilyn Monroe" },
    { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
    { text: "Small progress is still progress.", author: "Anonymous" },
    { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
    { text: "Push yourself because no one else is going to do it for you.", author: "Unknown" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
    { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
    { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  ];

  const [dailyQuote] = useState(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  });

  return (
    <>
      {/* HEADER */}
      <header className="ff-header">
        <div className="ff-header-brand">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <Brain size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading">FocusFlow</h1>
            <p className="text-xs text-secondary">Smart Study Planner</p>
          </div>
        </div>

        {/* Pomodoro Toggle */}
        <div className="ff-toggle-container">
          <button 
             className={`ff-toggle-btn ${usePomodoro ? 'active' : ''}`}
             onClick={() => onSetMode(true)}
          >
             Pomodoro 25m
          </button>
          
          <button 
             className={`ff-toggle-btn ${!usePomodoro ? 'active' : ''}`}
             onClick={() => onSetMode(false)}
          >
             Task Duration
          </button>
        </div>
      </header>

      <main className="ff-section-gap">
        <Dashboard stats={getStats()} />

        <div className="main-grid">
          <div className="flex flex-col gap-8">
            <TaskForm onAddTask={addTask} />

            <div>
              <div className="flex items-center gap-3 mb-4">
                <Layout size={20} />
                <h2 className="text-xl font-bold font-heading">
                  Your Study Plan
                </h2>
              </div>

              <TaskList
                tasks={tasks}
                onDelete={deleteTask}
                onComplete={toggleComplete}
                onStartFocus={startFocus}
                onUpdateTask={updateTask}
                activeTaskId={activeTaskId}
              />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <PomodoroTimer
              initialMinutes={duration}
              timeLeftProp={timeLeft}
              isActiveProp={isActive}
              keyProp={timerKey}
              onStatusChange={onToggle}
              isPomodoro={usePomodoro}
              onReset={onReset}
              onTimeUpdate={setTimeLeft}
              setTimeLeft={setTimeLeft}
              setIsActive={setIsActive}
              phase={phase}
              totalPhases={totalPhases}
              timerMode={mode}
            />

            {/* DAILY WISDOM */}
            <div className="card relative overflow-hidden">
              <Quote
                size={50}
                className="absolute -right-4 -bottom-6 opacity-10"
              />
              <h3 className="font-bold mb-3 text-xs uppercase tracking-widest text-secondary">
                Daily Wisdom
              </h3>
              <p className="italic text-lg leading-relaxed font-heading">
                "{dailyQuote.text}"
              </p>
              <p className="text-xs text-secondary mt-4">— {dailyQuote.author}</p>
            </div>

            {/* PRO TIP */}
            <div className="card bg-slate-900 text-white">
              <h3 className="font-bold mb-3 text-xs uppercase tracking-widest text-indigo-300">
                Pro Tip
              </h3>
              <p className="text-sm leading-relaxed">
                Break complex topics into smaller chunks. Deep focus beats long
                distracted hours.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Early Completion Confirmation Dialog */}
      {confirmCompleteId && (
        <div className="ff-dialog-overlay" onClick={() => setConfirmCompleteId(null)}>
          <div className="ff-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="ff-dialog-icon">
                <Brain size={24} />
            </div>
            <h3 className="ff-dialog-title">Early Completion?</h3>
            <p className="ff-dialog-message">
                You still have {Math.ceil(timeLeft / 60)} minutes left in your focus session. 
                Are you sure you want to finish now?
            </p>
            <div className="ff-dialog-actions" style={{ marginTop: '1.5rem' }}>
                <button 
                  className="ff-dialog-btn"
                  onClick={() => toggleComplete(confirmCompleteId, true)}
                >
                  Yes, I'm finished
                </button>
                <button 
                  className="ff-dialog-btn-outline"
                  onClick={() => setConfirmCompleteId(null)}
                >
                  Keep focusing
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
