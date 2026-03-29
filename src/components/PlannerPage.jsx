import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarRange, Clock, AlertCircle, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { getItem, setItem, STORAGE_KEYS } from "../utils/storage";

export default function PlannerPage({ timerProps = {} }) {
  const navigate = useNavigate();
  const [tasks] = useState(() => getItem(STORAGE_KEYS.TASKS, []));
  const [plannerData, setPlannerData] = useState(() => getItem(STORAGE_KEYS.PLANNER, { availableHours: 4, sessions: [] }));
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState("week"); // "week" | "day"

  const pad = n => n.toString().padStart(2, "0");
  const localNow = new Date();
  const [startDate, setStartDate] = useState(`${localNow.getFullYear()}-${pad(localNow.getMonth() + 1)}-${pad(localNow.getDate())}`);
  const [selectedDate, setSelectedDate] = useState(startDate);

  const pendingTasks = tasks.filter(t => !t.completed && t.deadline);

  const saveData = (data) => {
    setPlannerData(data);
    setItem(STORAGE_KEYS.PLANNER, data);
  };

  // Generate study schedule
  const generateSchedule = () => {
    const sorted = [...pendingTasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    const newSessions = [];
    const existingSessions = [...(plannerData.sessions || [])];
    
    // Parse the selected localized start date
    const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
    const scheduleStart = new Date(sYear, sMonth - 1, sDay);
    scheduleStart.setHours(0, 0, 0, 0);

    sorted.forEach(task => {
      let remainingDuration = task.duration;
      const deadline = new Date(task.deadline);
      const daysUntilDeadline = Math.max(1, Math.ceil((deadline - scheduleStart) / (1000 * 60 * 60 * 24)));
      const availableMinutes = plannerData.availableHours * 60;

      for (let d = 0; d < daysUntilDeadline && d < 14 && remainingDuration > 0; d++) {
        const date = new Date(scheduleStart);
        date.setDate(date.getDate() + d);
        const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

        // Check how much time is already allocated on this day (both existing and newly generated)
        const dayTotalExisting = existingSessions.filter(s => s.date === dateStr).reduce((sum, s) => sum + s.minutes, 0);
        const dayTotalNew = newSessions.filter(s => s.date === dateStr).reduce((sum, s) => sum + s.minutes, 0);
        const dayTotal = dayTotalExisting + dayTotalNew;
        const dayRemaining = availableMinutes - dayTotal;
        
        if (dayRemaining <= 0) continue;

        // Allocate up to 60m or the remaining duration, whichever is smaller, to distribute load
        const allocatable = Math.min(remainingDuration, dayRemaining, 60); 
        if (allocatable > 0) {
          newSessions.push({
            id: Date.now() + Math.random(),
            taskId: task.id,
            taskTopic: task.topic,
            taskSubject: task.subject,
            date: dateStr,
            minutes: allocatable,
            deadline: task.deadline,
            status: "pending"
          });
          remainingDuration -= allocatable;
        }
      }
    });

    saveData({ ...plannerData, sessions: [...existingSessions, ...newSessions] });
  };

  const updateSessionStatus = (sessionId, newStatus) => {
    // Manual update is being replaced by automatic binding, 
    // but keeping the function for any legacy persistence needs if called elsewhere.
    const newSessions = plannerData.sessions.map(s => 
      s.id === sessionId ? { ...s, status: newStatus } : s
    );
    saveData({ ...plannerData, sessions: newSessions });
  };

  const getSessionStatus = (session) => {
    const task = tasks.find(t => t.id === session.taskId);
    if (task?.completed) return "completed";
    
    const today = new Date().toISOString().split('T')[0];
    if (timerProps.isActive && timerProps.activeTaskId === session.taskId && session.date === today) {
      return "ongoing";
    }
    
    return session.status || "pending";
  };

  // Get week dates
  const weekDates = useMemo(() => {
    const days = [];
    const start = new Date(selectedDate + 'T00:00:00'); // Use selectedDate as base
    start.setDate(start.getDate() + weekOffset * 7);
    const dayOfWeek = start.getDay();
    start.setDate(start.getDate() - dayOfWeek); // Start from Sunday

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const pad = n => n.toString().padStart(2, "0");
      const localDateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

      days.push({
        date: localDateStr,
        dayName: d.toLocaleDateString("en", { weekday: "short" }),
        dayNum: d.getDate(),
        month: d.toLocaleDateString("en", { month: "short" }),
        isToday: localDateStr === todayStr,
      });
    }

    if (viewMode === "day") {
      return days.filter(d => d.date === selectedDate);
    }
    return days;
  }, [weekOffset, selectedDate, viewMode]);

  return (
    <div className="ff-page">
      <div className="ff-page-header">
        <div className="flex items-center gap-3">
          <div className="ff-page-icon" style={{ background: "#ecfdf5" }}>
            <CalendarRange size={22} style={{ color: "#10b981" }} />
          </div>
          <div>
            <h1 className="ff-page-title">Study Planner</h1>
            <p className="ff-page-subtitle">{pendingTasks.length} tasks with deadlines</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 relative z-10">
          <div className="flex gap-3 items-center justify-end">
            <div className="flex items-center gap-2">
              <label className="input-label" style={{ marginBottom: 0, whiteSpace: "nowrap" }}>
                <CalendarRange size={14} /> View Date:
              </label>
              <input
                type="date"
                className="input-field"
                style={{ padding: "0.5rem" }}
                value={selectedDate}
                onChange={e => {
                  setSelectedDate(e.target.value);
                  setStartDate(e.target.value);
                  setViewMode("day");
                  setWeekOffset(0);
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="input-label" style={{ marginBottom: 0, whiteSpace: "nowrap" }}>
                <Clock size={14} /> Hr/day:
              </label>
              <input
                type="number"
                className="input-field"
                style={{ width: "60px", padding: "0.5rem" }}
                min="1"
                max="16"
                value={plannerData.availableHours}
                onChange={e => saveData({ ...plannerData, availableHours: parseInt(e.target.value) || 4 })}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button className="ff-btn ff-btn-primary whitespace-nowrap" onClick={generateSchedule}>
              Generate Schedule
            </button>
          </div>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="ff-week-nav">
        <button className="ff-btn ff-btn-outline" onClick={() => setWeekOffset(w => w - 1)}>
          <ChevronLeft size={18} />
        </button>
        <span className="ff-week-label">
          {weekDates[0]?.month} {weekDates[0]?.dayNum} – {weekDates[6]?.month} {weekDates[6]?.dayNum}
        </span>
        <button className="ff-btn ff-btn-outline" onClick={() => setWeekOffset(w => w + 1)}>
          <ChevronRight size={18} />
        </button>
        {(weekOffset !== 0 || viewMode === "day") && (
          <button className="ff-btn ff-btn-ghost" onClick={() => {
            setWeekOffset(0);
            setSelectedDate(`${localNow.getFullYear()}-${pad(localNow.getMonth() + 1)}-${pad(localNow.getDate())}`);
            setViewMode("week");
          }}>Today / Full Week</button>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="ff-planner-grid">
        {weekDates.map(day => {
          const daySessions = plannerData.sessions.filter(s => s.date === day.date);
          const totalMinutes = daySessions.reduce((s, d) => s + d.minutes, 0);

          return (
            <div key={day.date} className={`ff-planner-day ${day.isToday ? 'today' : ''}`}>
              <div className="ff-planner-day-header">
                <span className="ff-planner-day-name">{day.dayName}</span>
                <span className="ff-planner-day-num">{day.dayNum}</span>
              </div>

              {totalMinutes > 0 && (
                <div className="ff-planner-day-total">{totalMinutes}m planned</div>
              )}

              <div className="ff-planner-sessions">
                {daySessions.map(session => {
                  const status = getSessionStatus(session);
                  return (
                    <div 
                      key={session.id} 
                      className="ff-planner-session" 
                      onClick={() => navigate('/')}
                      style={{ 
                        padding: "0.5rem", 
                        borderLeft: `3px solid ${status === 'completed' ? '#10b981' : status === 'ongoing' ? '#f59e0b' : '#cbd5e1'}`, 
                        marginBottom: "0.5rem",
                        cursor: "pointer"
                      }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="ff-planner-session-subject">{session.taskSubject}</span>
                        <span className="ff-planner-session-time font-bold text-slate-700">{session.minutes}m</span>
                      </div>
                      <span className="ff-planner-session-topic block mb-2">{session.taskTopic}</span>
                      <div className={`text-[10px] font-bold uppercase py-1 px-2 rounded inline-block ${
                        status === 'completed' ? 'bg-green-100 text-green-700' :
                        status === 'ongoing' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {status}
                      </div>
                    </div>
                  );
                })}
              </div>

              {daySessions.length === 0 && (
                <div className="ff-planner-empty">No sessions</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info */}
      {plannerData.sessions.length === 0 && (
        <div className="card" style={{ textAlign: "center", marginTop: "1rem" }}>
          <AlertCircle size={32} className="opacity-20" style={{ margin: "0 auto 0.5rem" }} />
          <p style={{ color: "#64748b" }}>
            Create tasks with deadlines on the Home page, then click "Generate Schedule" to automatically distribute your study time.
          </p>
        </div>
      )}
    </div>
  );
}
