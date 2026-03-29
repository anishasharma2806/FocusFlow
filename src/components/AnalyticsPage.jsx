import React, { useState, useMemo } from "react";
import {
  BarChart3, TrendingUp, Calendar, CheckCircle, Layers, Flame
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { getItem, STORAGE_KEYS, getTodayKey } from "../utils/storage";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

export default function AnalyticsPage() {
  const dailyFocus = getItem(STORAGE_KEYS.DAILY_FOCUS, {});
  const tasks = getItem(STORAGE_KEYS.TASKS, []);
  const flashcards = getItem(STORAGE_KEYS.FLASHCARDS, []);
  const streakData = getItem(STORAGE_KEYS.STREAKS, { currentStreak: 0, longestStreak: 0, history: {} });

  // Last 7 days data
  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const data = dailyFocus[key] || {};
      days.push({
        date: d.toLocaleDateString("en", { weekday: "short" }),
        fullDate: key,
        focusMinutes: data.focusMinutes || 0,
        focusHours: Math.round((data.focusMinutes || 0) / 60 * 10) / 10,
        completedTasks: data.completedTasks || 0,
        flashcardReviews: data.flashcardReviews || 0,
        pomodoroSessions: data.pomodoroSessions || 0,
      });
    }
    return days;
  }, []);

  // Last 30 days
  const last30Days = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const data = dailyFocus[key] || {};
      days.push({
        date: d.getDate().toString(),
        focusHours: Math.round((data.focusMinutes || 0) / 60 * 10) / 10,
      });
    }
    return days;
  }, []);

  // Task stats
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const taskPieData = [
    { name: "Completed", value: completedTasks || 0 },
    { name: "Pending", value: pendingTasks || 0 },
  ];

  // Today stats
  const today = getTodayKey();
  const todayData = dailyFocus[today] || {};

  // Total stats
  const totalFocusMinutes = Object.values(dailyFocus).reduce((sum, d) => sum + (d.focusMinutes || 0), 0);
  const totalReviews = Object.values(dailyFocus).reduce((sum, d) => sum + (d.flashcardReviews || 0), 0);

  return (
    <div className="ff-page">
      <div className="ff-page-header">
        <div className="flex items-center gap-3">
          <div className="ff-page-icon" style={{ background: "#f0fdf4" }}>
            <BarChart3 size={22} style={{ color: "#16a34a" }} />
          </div>
          <div>
            <h1 className="ff-page-title">Study Analytics</h1>
            <p className="ff-page-subtitle">Track your learning progress</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="ff-stats-grid">
        <div className="ff-stat-card">
          <div className="ff-stat-icon" style={{ background: "#eef2ff", color: "#6366f1" }}><TrendingUp size={20} /></div>
          <div className="ff-stat-value">{Math.round(totalFocusMinutes / 60 * 10) / 10}h</div>
          <div className="ff-stat-label">Total Focus Time</div>
        </div>
        <div className="ff-stat-card">
          <div className="ff-stat-icon" style={{ background: "#f0fdf4", color: "#16a34a" }}><CheckCircle size={20} /></div>
          <div className="ff-stat-value">{completedTasks}</div>
          <div className="ff-stat-label">Tasks Completed</div>
        </div>
        <div className="ff-stat-card">
          <div className="ff-stat-icon" style={{ background: "#fef3c7", color: "#d97706" }}><Layers size={20} /></div>
          <div className="ff-stat-value">{totalReviews}</div>
          <div className="ff-stat-label">Card Reviews</div>
        </div>
        <div className="ff-stat-card">
          <div className="ff-stat-icon" style={{ background: "#fef2f2", color: "#ef4444" }}><Flame size={20} /></div>
          <div className="ff-stat-value">{streakData.currentStreak || 0}</div>
          <div className="ff-stat-label">Day Streak</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="ff-charts-grid">
        {/* Daily Focus Hours */}
        <div className="card ff-chart-card">
          <h3 className="ff-chart-title">Daily Focus Hours (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
              />
              <Bar dataKey="focusHours" fill="#6366f1" radius={[6, 6, 0, 0]} name="Hours" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Productivity Trend */}
        <div className="card ff-chart-card">
          <h3 className="ff-chart-title">Monthly Focus Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={last30Days}>
              <defs>
                <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
              <Area type="monotone" dataKey="focusHours" stroke="#6366f1" fill="url(#focusGradient)" strokeWidth={2} name="Hours" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tasks Breakdown */}
        <div className="card ff-chart-card">
          <h3 className="ff-chart-title">Tasks Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={taskPieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {taskPieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="ff-chart-legend">
            {taskPieData.map((entry, i) => (
              <span key={i} className="ff-legend-item">
                <span className="ff-legend-dot" style={{ background: COLORS[i] }} />
                {entry.name}: {entry.value}
              </span>
            ))}
          </div>
        </div>

        {/* Flashcard Reviews */}
        <div className="card ff-chart-card">
          <h3 className="ff-chart-title">Flashcard Reviews (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
              <Line type="monotone" dataKey="flashcardReviews" stroke="#ec4899" strokeWidth={2} dot={{ r: 4 }} name="Reviews" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
