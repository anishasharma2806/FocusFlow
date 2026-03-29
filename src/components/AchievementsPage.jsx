import React, { useState, useEffect, useMemo } from "react";
import { Trophy, Star, Zap, Target, Flame, BookOpen, CheckCircle, Layers } from "lucide-react";
import { getItem, setItem, STORAGE_KEYS } from "../utils/storage";

const LEVEL_XP = 100; // XP per level

const ACHIEVEMENTS = [
  { id: "first_task", title: "First Step", desc: "Complete your first task", icon: "🎯", xp: 10, check: (d) => d.completedTasks >= 1 },
  { id: "five_tasks", title: "Getting Started", desc: "Complete 5 tasks", icon: "📋", xp: 25, check: (d) => d.completedTasks >= 5 },
  { id: "twenty_tasks", title: "Taskmaster", desc: "Complete 20 tasks", icon: "🏆", xp: 50, check: (d) => d.completedTasks >= 20 },
  { id: "first_pomodoro", title: "Focused", desc: "Complete 1 Pomodoro session", icon: "🍅", xp: 10, check: (d) => d.pomodoroSessions >= 1 },
  { id: "ten_pomodoros", title: "Deep Worker", desc: "Complete 10 Pomodoro sessions", icon: "⏱️", xp: 30, check: (d) => d.pomodoroSessions >= 10 },
  { id: "fifty_pomodoros", title: "Flow State Master", desc: "Complete 50 Pomodoro sessions", icon: "🧠", xp: 100, check: (d) => d.pomodoroSessions >= 50 },
  { id: "first_flashcard", title: "Quick Learner", desc: "Review your first flashcard", icon: "📇", xp: 10, check: (d) => d.flashcardReviews >= 1 },
  { id: "hundred_reviews", title: "Card Shark", desc: "Review 100 flashcards", icon: "🃏", xp: 50, check: (d) => d.flashcardReviews >= 100 },
  { id: "three_streak", title: "Consistent", desc: "Maintain a 3-day streak", icon: "🔥", xp: 20, check: (d) => d.longestStreak >= 3 },
  { id: "seven_streak", title: "Weekly Warrior", desc: "Maintain a 7-day streak", icon: "💪", xp: 50, check: (d) => d.longestStreak >= 7 },
  { id: "thirty_streak", title: "Unstoppable", desc: "Maintain a 30-day streak", icon: "⚡", xp: 150, check: (d) => d.longestStreak >= 30 },
  { id: "one_hour", title: "Dedicated", desc: "Study for 1 hour total", icon: "📖", xp: 15, check: (d) => d.totalFocusMinutes >= 60 },
  { id: "ten_hours", title: "Scholar", desc: "Study for 10 hours total", icon: "🎓", xp: 75, check: (d) => d.totalFocusMinutes >= 600 },
  { id: "fifty_hours", title: "Expert", desc: "Study for 50 hours total", icon: "🏅", xp: 200, check: (d) => d.totalFocusMinutes >= 3000 },
  { id: "first_note", title: "Note Taker", desc: "Create your first note", icon: "📝", xp: 10, check: (d) => d.notesCount >= 1 },
  { id: "ten_notes", title: "Organized Mind", desc: "Create 10 notes", icon: "🗂️", xp: 40, check: (d) => d.notesCount >= 10 },
];

export default function AchievementsPage() {
  const [xpData, setXpData] = useState(() => getItem(STORAGE_KEYS.XP, { totalXp: 0, unlockedAchievements: [] }));

  // Gather stats from all systems
  const stats = useMemo(() => {
    const tasks = getItem(STORAGE_KEYS.TASKS, []);
    const dailyFocus = getItem(STORAGE_KEYS.DAILY_FOCUS, {});
    const flashcards = getItem(STORAGE_KEYS.FLASHCARDS, []);
    const notes = getItem(STORAGE_KEYS.NOTES, []);
    const streakData = getItem(STORAGE_KEYS.STREAKS, { currentStreak: 0, longestStreak: 0 });

    const totalFocusMinutes = Object.values(dailyFocus).reduce((s, d) => s + (d.focusMinutes || 0), 0);
    const totalReviews = Object.values(dailyFocus).reduce((s, d) => s + (d.flashcardReviews || 0), 0);
    const totalPomodoros = Object.values(dailyFocus).reduce((s, d) => s + (d.pomodoroSessions || 0), 0);

    return {
      completedTasks: tasks.filter(t => t.completed).length,
      pomodoroSessions: totalPomodoros,
      flashcardReviews: totalReviews,
      longestStreak: streakData.longestStreak || 0,
      totalFocusMinutes,
      notesCount: notes.length,
    };
  }, []);

  // Check for new achievements
  useEffect(() => {
    let newXp = xpData.totalXp;
    const newUnlocked = [...xpData.unlockedAchievements];

    ACHIEVEMENTS.forEach(a => {
      if (!newUnlocked.includes(a.id) && a.check(stats)) {
        newUnlocked.push(a.id);
        newXp += a.xp;
      }
    });

    if (newUnlocked.length !== xpData.unlockedAchievements.length) {
      const updated = { totalXp: newXp, unlockedAchievements: newUnlocked };
      setXpData(updated);
      setItem(STORAGE_KEYS.XP, updated);
    }
  }, [stats]);

  const level = Math.floor(xpData.totalXp / LEVEL_XP) + 1;
  const xpInLevel = xpData.totalXp % LEVEL_XP;
  const xpProgress = (xpInLevel / LEVEL_XP) * 100;

  return (
    <div className="ff-page">
      <div className="ff-page-header">
        <div className="flex items-center gap-3">
          <div className="ff-page-icon" style={{ background: "#fef3c7" }}>
            <Trophy size={22} style={{ color: "#d97706" }} />
          </div>
          <div>
            <h1 className="ff-page-title">Achievements</h1>
            <p className="ff-page-subtitle">{xpData.unlockedAchievements.length}/{ACHIEVEMENTS.length} unlocked</p>
          </div>
        </div>
      </div>

      {/* XP / Level Card */}
      <div className="card ff-xp-card">
        <div className="ff-xp-header">
          <div className="ff-level-badge">
            <Star size={20} />
            <span>Level {level}</span>
          </div>
          <div className="ff-xp-total">
            <Zap size={16} /> {xpData.totalXp} XP
          </div>
        </div>
        <div className="ff-xp-bar-container">
          <div className="ff-xp-bar">
            <div className="ff-xp-bar-fill" style={{ width: `${xpProgress}%` }} />
          </div>
          <span className="ff-xp-label">{xpInLevel} / {LEVEL_XP} XP to Level {level + 1}</span>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="ff-stats-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="ff-stat-card">
          <div className="ff-stat-icon" style={{ background: "#eef2ff", color: "#6366f1" }}><CheckCircle size={18} /></div>
          <div className="ff-stat-value">{stats.completedTasks}</div>
          <div className="ff-stat-label">Tasks Done</div>
        </div>
        <div className="ff-stat-card">
          <div className="ff-stat-icon" style={{ background: "#fef2f2", color: "#ef4444" }}><Target size={18} /></div>
          <div className="ff-stat-value">{stats.pomodoroSessions}</div>
          <div className="ff-stat-label">Pomodoros</div>
        </div>
        <div className="ff-stat-card">
          <div className="ff-stat-icon" style={{ background: "#fff7ed", color: "#f97316" }}><Flame size={18} /></div>
          <div className="ff-stat-value">{stats.longestStreak}d</div>
          <div className="ff-stat-label">Best Streak</div>
        </div>
        <div className="ff-stat-card">
          <div className="ff-stat-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}><BookOpen size={18} /></div>
          <div className="ff-stat-value">{Math.round(stats.totalFocusMinutes / 60)}h</div>
          <div className="ff-stat-label">Study Hours</div>
        </div>
      </div>

      {/* Achievement Grid */}
      <div className="ff-achievements-grid">
        {ACHIEVEMENTS.map(a => {
          const unlocked = xpData.unlockedAchievements.includes(a.id);
          return (
            <div key={a.id} className={`ff-achievement-card ${unlocked ? 'unlocked' : 'locked'}`}>
              <div className="ff-achievement-icon">{a.icon}</div>
              <div className="ff-achievement-info">
                <h4 className="ff-achievement-title">{a.title}</h4>
                <p className="ff-achievement-desc">{a.desc}</p>
              </div>
              <div className="ff-achievement-xp">
                <Zap size={12} /> {a.xp} XP
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
