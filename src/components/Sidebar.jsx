import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  StickyNote,
  Layers,
  BarChart3,
  Network,
  Trophy,
  CalendarRange,
  Menu,
  X,
  Zap,
  Download,
} from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/notes", icon: StickyNote, label: "Notes" },
  { to: "/flashcards", icon: Layers, label: "Flashcards" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/knowledge-graph", icon: Network, label: "Knowledge Graph" },
  { to: "/achievements", icon: Trophy, label: "Achievements" },
  { to: "/planner", icon: CalendarRange, label: "Planner" },
  { to: "/focus-score", icon: Zap, label: "Focus Score" },
  { to: "/data", icon: Download, label: "Data Manager" },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="ff-sidebar-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="ff-sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={`ff-sidebar ${mobileOpen ? "open" : ""}`}>
        <div className="ff-sidebar-header">
          <Zap size={20} className="ff-sidebar-logo-icon" />
          <span className="ff-sidebar-logo-text">FocusFlow</span>
        </div>

        <ul className="ff-sidebar-nav">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `ff-sidebar-link ${isActive ? "active" : ""}`
                }
                onClick={() => setMobileOpen(false)}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
