import React, { useState, useRef } from "react";
import { Download, Upload, AlertCircle, Check, RefreshCw, Trash2 } from "lucide-react";
import { getAllData, importData } from "../utils/storage";

export default function DataManager() {
  const [status, setStatus] = useState(null); // { type: 'success'|'error', message: string }
  const [showConfirm, setShowConfirm] = useState(false);
  const fileInputRef = useRef(null);

  const handleExport = () => {
    try {
      const data = getAllData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `focusflow-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus({ type: "success", message: "Data exported successfully!" });
    } catch (e) {
      setStatus({ type: "error", message: "Export failed: " + e.message });
    }
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (typeof data !== "object" || data === null) {
          throw new Error("Invalid format");
        }
        setShowConfirm(true);
        // Store pending import data temporarily
        window.__ff_pending_import = data;
      } catch (err) {
        setStatus({ type: "error", message: "Invalid JSON file: " + err.message });
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    const data = window.__ff_pending_import;
    if (!data) return;
    const success = importData(data);
    if (success) {
      setStatus({ type: "success", message: "Data imported successfully! Refresh to see changes." });
    } else {
      setStatus({ type: "error", message: "Import failed." });
    }
    window.__ff_pending_import = null;
    setShowConfirm(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClearAll = () => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("focusflow_")) keys.push(key);
    }
    keys.forEach(k => localStorage.removeItem(k));
    setStatus({ type: "success", message: `Cleared ${keys.length} data keys. Refresh to see changes.` });
  };

  // Count storage usage
  const storageKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("focusflow_")) {
      const value = localStorage.getItem(key);
      storageKeys.push({ key, size: new Blob([value]).size });
    }
  }
  const totalSize = storageKeys.reduce((s, k) => s + k.size, 0);

  return (
    <div className="ff-page">
      <div className="ff-page-header">
        <div className="flex items-center gap-3">
          <div className="ff-page-icon" style={{ background: "#f1f5f9" }}>
            <Download size={22} style={{ color: "#475569" }} />
          </div>
          <div>
            <h1 className="ff-page-title">Data Manager</h1>
            <p className="ff-page-subtitle">Export, import, and manage your study data</p>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {status && (
        <div className={`ff-alert ${status.type === 'success' ? 'ff-alert-success' : 'ff-alert-error'}`}>
          {status.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{status.message}</span>
          <button onClick={() => setStatus(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", opacity: 0.6 }}>✕</button>
        </div>
      )}

      {/* Actions */}
      <div className="ff-data-actions">
        <div className="card ff-data-card">
          <div className="ff-data-card-icon" style={{ background: "#eef2ff" }}>
            <Download size={24} style={{ color: "#6366f1" }} />
          </div>
          <h3>Export Data</h3>
          <p>Download all your FocusFlow data as a JSON file.</p>
          <button className="ff-btn ff-btn-primary" onClick={handleExport}>
            <Download size={16} /> Export JSON
          </button>
        </div>

        <div className="card ff-data-card">
          <div className="ff-data-card-icon" style={{ background: "#f0fdf4" }}>
            <Upload size={24} style={{ color: "#16a34a" }} />
          </div>
          <h3>Import Data</h3>
          <p>Restore from a previously exported backup file.</p>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
          <button className="ff-btn ff-btn-outline" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> Choose File
          </button>
        </div>

        <div className="card ff-data-card">
          <div className="ff-data-card-icon" style={{ background: "#fef2f2" }}>
            <Trash2 size={24} style={{ color: "#ef4444" }} />
          </div>
          <h3>Clear Data</h3>
          <p>Remove all FocusFlow data from this browser.</p>
          <button className="ff-btn ff-btn-outline" style={{ borderColor: "#fecaca", color: "#ef4444" }} onClick={handleClearAll}>
            <Trash2 size={16} /> Clear All
          </button>
        </div>
      </div>

      {/* Storage Info */}
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h3 className="ff-section-title">Storage Usage</h3>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1rem" }}>
          Total: {(totalSize / 1024).toFixed(1)} KB across {storageKeys.length} keys
        </p>
        <div className="ff-storage-list">
          {storageKeys.map(k => (
            <div key={k.key} className="ff-storage-item">
              <span className="ff-storage-key">{k.key.replace("focusflow_", "")}</span>
              <span className="ff-storage-size">{(k.size / 1024).toFixed(1)} KB</span>
            </div>
          ))}
        </div>
      </div>

      {/* Import Confirmation Dialog */}
      {showConfirm && (
        <div className="ff-dialog-overlay" onClick={() => setShowConfirm(false)}>
          <div className="ff-dialog-card" onClick={e => e.stopPropagation()}>
            <div className="ff-dialog-icon" style={{ background: "#fef3c7", color: "#d97706" }}>
              <AlertCircle size={24} />
            </div>
            <h3 className="ff-dialog-title">Confirm Import</h3>
            <p className="ff-dialog-message">
              This will overwrite your existing data. Are you sure?
            </p>
            <div className="ff-dialog-actions" style={{ marginTop: "1.5rem" }}>
              <button className="ff-dialog-btn" onClick={confirmImport}>
                Yes, Import
              </button>
              <button className="ff-dialog-btn-outline" onClick={() => { setShowConfirm(false); window.__ff_pending_import = null; }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
