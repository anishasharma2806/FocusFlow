import React, { useMemo } from "react";
import { Zap, TrendingUp, Award, Target, Flame, Clock, CheckCircle, Layers, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { getItem, STORAGE_KEYS, getTodayKey } from "../utils/storage";

function calculateDayScore(dayData) {
  if (!dayData) return 0;
  let score = 0;
  score += Math.min(40, (dayData.focusMinutes || 0) * 0.4); // Max 40 from focus
  score += Math.min(25, (dayData.completedTasks || 0) * 5);  // Max 25 from tasks
  score += Math.min(20, (dayData.pomodoroSessions || 0) * 4); // Max 20 from pomodoro
  score += Math.min(15, (dayData.flashcardReviews || 0) * 1.5); // Max 15 from flashcards
  return Math.min(100, Math.round(score));
}

function getInsight(score) {
  if (score >= 80) return { text: "Outstanding productivity! You're in the zone.", color: "#16a34a", icon: "🔥" };
  if (score >= 60) return { text: "Great effort today. Keep pushing!", color: "#6366f1", icon: "💪" };
  if (score >= 40) return { text: "Decent progress. Try adding a Pomodoro session.", color: "#d97706", icon: "📈" };
  if (score >= 20) return { text: "Slow day. Consider reviewing some flashcards.", color: "#f97316", icon: "⚡" };
  return { text: "Just getting started? Even 15 minutes makes a difference!", color: "#94a3b8", icon: "🌱" };
}

export default function FocusScorePage() {
  const dailyFocus = getItem(STORAGE_KEYS.DAILY_FOCUS, {});
  const streakData = getItem(STORAGE_KEYS.STREAKS, { currentStreak: 0 });

  const today = getTodayKey();
  const todayData = dailyFocus[today] || {};
  const todayScore = calculateDayScore(todayData);
  const insight = getInsight(todayScore);

  // Last 7 days trend
  const weekData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      days.push({
        date: d.toLocaleDateString("en", { weekday: "short" }),
        score: calculateDayScore(dailyFocus[key]),
      });
    }
    return days;
  }, []);

  const weekAvg = Math.round(weekData.reduce((s, d) => s + d.score, 0) / 7);
  const yesterday = weekData[weekData.length - 2]?.score || 0;
  const scoreDiff = todayScore - yesterday;

  // Score ring
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = (todayScore / 100) * circumference;

  const scoreColor = todayScore >= 80 ? "#16a34a" : todayScore >= 60 ? "#6366f1" : todayScore >= 40 ? "#d97706" : todayScore >= 20 ? "#f97316" : "#94a3b8";

  return (
    <div className="ff-page">
      <div className="ff-page-header">
        <div className="flex items-center gap-3">
          <div className="ff-page-icon" style={{ background: "#eef2ff" }}>
            <Zap size={22} style={{ color: "#6366f1" }} />
          </div>
          <div>
            <h1 className="ff-page-title">Focus Score</h1>
            <p className="ff-page-subtitle">Your daily productivity rating</p>
          </div>
        </div>
      </div>

      {/* Main Score Card */}
      <div className="card ff-score-main">
        <div className="ff-score-ring-container">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
            <circle
              cx="100" cy="100" r={radius} fill="none"
              stroke={scoreColor}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              transform="rotate(-90 100 100)"
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
            <text x="100" y="90" textAnchor="middle" className="ff-score-number" fill={scoreColor} fontSize="42" fontWeight="700">{todayScore}</text>
            <text x="100" y="115" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="500">out of 100</text>
          </svg>
        </div>

        <div className="ff-score-details">
          <div className="ff-score-insight">
            <span className="ff-insight-emoji">{insight.icon}</span>
            <p style={{ color: insight.color, fontWeight: 600 }}>{insight.text}</p>
          </div>

          <div className="ff-score-comparison">
            <div className="ff-score-comp-item">
              {scoreDiff > 0 ? <ArrowUp size={16} style={{ color: "#16a34a" }} /> :
               scoreDiff < 0 ? <ArrowDown size={16} style={{ color: "#ef4444" }} /> :
               <Minus size={16} style={{ color: "#94a3b8" }} />}
              <span>{Math.abs(scoreDiff)} vs yesterday</span>
            </div>
            <div className="ff-score-comp-item">
              <Award size={16} style={{ color: "#6366f1" }} />
              <span>Week avg: {weekAvg}/100</span>
            </div>
            <div className="ff-score-comp-item">
              <Flame size={16} style={{ color: "#f97316" }} />
              <span>{streakData.currentStreak || 0} day streak</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="ff-stats-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="ff-stat-card">
          <div className="ff-stat-icon" style={{ background: "#eef2ff", color: "#6366f1" }}><Clock size={18} /></div>
          <div className="ff-stat-value">{todayData.focusMinutes || 0}m</div>
          <div className="ff-stat-label">Focus Time</div>
        </div>
        <div className="ff-stat-card">
          <div className="ff-stat-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}><CheckCircle size={18} /></div>
          <div className="ff-stat-value">{todayData.completedTasks || 0}</div>
          <div className="ff-stat-label">Tasks</div>
        </div>
        <div className="ff-stat-card">
          <div className="ff-stat-icon" style={{ background: "#fef2f2", color: "#ef4444" }}><Target size={18} /></div>
          <div className="ff-stat-value">{todayData.pomodoroSessions || 0}</div>
          <div className="ff-stat-label">Pomodoros</div>
        </div>
        <div className="ff-stat-card">
          <div className="ff-stat-icon" style={{ background: "#faf5ff", color: "#8b5cf6" }}><Layers size={18} /></div>
          <div className="ff-stat-value">{todayData.flashcardReviews || 0}</div>
          <div className="ff-stat-label">Reviews</div>
        </div>
      </div>

      {/* Weekly Trend */}
      <div className="card ff-chart-card">
        <h3 className="ff-chart-title">Weekly Score Trend</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={weekData}>
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
            <Area type="monotone" dataKey="score" stroke="#6366f1" fill="url(#scoreGrad)" strokeWidth={2} name="Score" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
