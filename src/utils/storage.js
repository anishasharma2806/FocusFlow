/**
 * FocusFlow — Centralized LocalStorage Utility
 * All features use this module for consistent data persistence.
 */

const STORAGE_KEYS = {
  TASKS: 'focusflow_tasks',
  POMODORO_SETTINGS: 'focusflow_pomodoro_settings',
  DAILY_FOCUS: 'focusflow_daily_focus',
  NOTES: 'focusflow_notes',
  FLASHCARDS: 'focusflow_flashcards',
  STREAKS: 'focusflow_streaks',
  XP: 'focusflow_xp',
  ACHIEVEMENTS: 'focusflow_achievements',
  PLANNER: 'focusflow_planner',
};

export function getItem(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      console.error('LocalStorage quota exceeded! Task data might be too large.', e);
      // Optional: alert the user once per session or add a flag
    } else {
      console.error('LocalStorage write failed:', e);
    }
    return false;
  }
}

export function removeItem(key) {
  localStorage.removeItem(key);
}

/**
 * Export ALL FocusFlow data as a single JSON object.
 */
export function getAllData() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('focusflow_')) {
      data[key] = getItem(key);
    }
  }
  return data;
}

/**
 * Import a previously exported backup.
 * Merges/overwrites each key found in the JSON.
 */
export function importData(json) {
  if (!json || typeof json !== 'object') return false;
  try {
    Object.entries(json).forEach(([key, value]) => {
      if (key.startsWith('focusflow_')) {
        setItem(key, value);
      }
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get today's date string (YYYY-MM-DD) for daily tracking.
 */
export function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

export { STORAGE_KEYS };
