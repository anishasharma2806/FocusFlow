/**
 * KeyboardShortcutsProvider — wrapper component that uses the hook inside Router context.
 */
import useKeyboardShortcuts from "../hooks/useKeyboardShortcuts";

export default function KeyboardShortcutsProvider({ onToggleFocusMode }) {
  useKeyboardShortcuts({ onToggleFocusMode });
  return null;
}
