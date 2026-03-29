import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Global keyboard shortcuts for FocusFlow.
 * Space → Start/Pause Pomodoro (only on home page)
 * N → Navigate to Notes (new note)
 * T → Navigate to Home (new task)
 * F → Toggle Deep Focus Mode
 * D → Navigate to Analytics
 */
export default function useKeyboardShortcuts({ onToggleFocusMode }) {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      // Ignore if user is typing in an input/textarea/select
      const tag = e.target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable) {
        return;
      }

      switch (e.code) {
        case "KeyN":
          e.preventDefault();
          navigate("/notes");
          break;
        case "KeyT":
          e.preventDefault();
          navigate("/");
          // Scroll to task form after navigation
          setTimeout(() => {
            const form = document.querySelector(".card");
            if (form) form.scrollIntoView({ behavior: "smooth" });
          }, 100);
          break;
        case "KeyF":
          e.preventDefault();
          if (onToggleFocusMode) onToggleFocusMode();
          break;
        case "KeyD":
          e.preventDefault();
          navigate("/analytics");
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [navigate, onToggleFocusMode]);
}
