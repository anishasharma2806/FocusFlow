import React, { useState } from "react";
import {
  Play,
  Trash2,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  CheckCircle,
  Clock,
  Youtube,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  ListTodo,
  X
} from "lucide-react";
import "../components.ff.css";

export default function TaskCard({ task, onDelete, onComplete, onStartFocus, onUpdateTask, activeTaskId }) {
  const [expanded, setExpanded] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const isCompleted = task.completed;
  const isOtherTaskActive = activeTaskId && activeTaskId !== task.id;
  const isActive = activeTaskId === task.id;

  // Handle both array (new format) and string (old format) for resources
  const resourcesList = Array.isArray(task.resources) 
    ? task.resources 
    : (task.resources ? task.resources.split('\n') : []);
    
  // Filter out empty lines - handle both string and object formats
  const validResources = resourcesList
    .map(r => typeof r === 'string' ? r.trim() : r)
    .filter(r => {
      if (typeof r === 'string') return r.length > 0;
      if (typeof r === 'object' && r !== null) return true;
      return false;
    });

  const hasResources = validResources.length > 0 || (task.files && task.files.length > 0);

  const getResourceIcon = (url) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return <Youtube size={14} className="text-red-500" />;
    if (url.endsWith('.pdf')) return <FileText size={14} className="text-orange-500" />;
    return <ExternalLink size={14} className="text-indigo-500" />;
  };

  const getFileIcon = (type) => {
    if (type && type.includes('image')) return <ImageIcon size={14} className="text-purple-500" />;
    if (type && type.includes('pdf')) return <FileText size={14} className="text-red-500" />;
    return <FileText size={14} className="text-slate-500" />;
  };

  const convertToSubtasks = () => {
    if (!task.roadmap) return;
    
    let newSubtasks = [];

    if (typeof task.roadmap === 'string') {
        const lines = task.roadmap.split('\n');
        newSubtasks = lines
            .map(line => line.trim())
            .filter(line => 
                line.length > 3 && 
                (line.startsWith('•') || line.startsWith('-') || /^\d+\./.test(line)) &&
                !line.includes('Topic:') && !line.includes('Difficulty:')
            )
            .map((text, index) => ({
                id: Date.now() + index,
                text: text.replace(/^[•\-\d+\.]\s*/, ''),
                completed: false
            }));
    } else {
        // Handle Structured Object
        const { subtopics = [], practiceTasks = [], projects = [] } = task.roadmap;
        newSubtasks = [...subtopics, ...practiceTasks, ...projects].map((item, i) => ({
             ...item,
             id: Date.now() + i, // Re-generate IDs to ensure they are unique in subtasks list
             completed: false
        }));
    }

    if (newSubtasks.length > 0) {
        onUpdateTask(task.id, { subtasks: newSubtasks });
    } else {
        alert("Could not automatically parse subtasks.");
    }
  };

  const toggleSubtask = (subtaskId) => {
    const updatedSubtasks = task.subtasks.map(st => 
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    
    // Check if all are completed
    const allDone = updatedSubtasks.every(st => st.completed);

    onUpdateTask(task.id, { 
        subtasks: updatedSubtasks, 
        completed: allDone // Auto-complete task if all subtasks are done
    });
  };

  // Calculate progress
  const subtaskProgress = task.subtasks && task.subtasks.length > 0
    ? Math.round((task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100)
    : 0;

  return (
    <div className={`card task-card ${isCompleted ? "task-completed" : ""}`}>
      <div className="task-header">
        <div className="task-info">
          <span className="task-subject">{task.subject}</span>

          <h3 className={`task-title ${isCompleted ? "completed-text" : ""}`}>
            {task.topic}
          </h3>

          <div className="task-meta flex items-center gap-3">
            <span className="flex items-center gap-1">
                <Clock size={14} />
                {task.duration} mins
            </span>
            {task.subtasks && task.subtasks.length > 0 && (
                <span className="ff-badge ff-badge-primary">
                    {subtaskProgress}% Done
                </span>
            )}
          </div>
        </div>

        <div className="task-actions">
          {!isCompleted && (
            <button
              onClick={() => !isOtherTaskActive && onStartFocus(task)}
              disabled={isOtherTaskActive}
              className={`btn-icon ${isActive ? "text-indigo-600 bg-indigo-50" : ""} ${isOtherTaskActive ? "opacity-50 cursor-not-allowed" : ""}`}
              title={isOtherTaskActive ? "Another task is active" : "Start Focus"}
            >
              <Play size={18} />
            </button>
          )}

          <button
            onClick={() => onComplete(task.id)}
            className="btn-icon"
            title={isCompleted ? "Mark Incomplete" : "Mark Complete"}
          >
            <CheckCircle size={18} />
          </button>

          <button
            onClick={() => onDelete(task.id)}
            className="btn-icon"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="task-footer">
        <button
          onClick={() => setExpanded(!expanded)}
          className="ff-btn ff-btn-ghost view-plan-btn"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Hide Plan" : "View Plan"}
        </button>

        {expanded && (
          <div className="task-details animate-slideUp">
            
            {/* SUBTASKS UI (If converted) */}
            {task.subtasks && task.subtasks.length > 0 ? (
                <div className="mb-6">
                    <p className="details-title mb-2">Checklist</p>
                    <div className="flex flex-col gap-2">
                        {task.subtasks.map(st => (
                            <div key={st.id} className="ff-checklist-item" onClick={() => toggleSubtask(st.id)}>
                                <div className={`ff-checkbox ${st.completed ? 'checked' : ''}`}>
                                    {st.completed && <CheckCircle size={14} />}
                                </div>
                                <span className={`ff-checklist-text ${st.completed ? 'completed' : ''}`}>
                                    {st.text}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* ROADMAP UI */
                task.roadmap ? (
                   typeof task.roadmap === 'string' ? (
                      // LEGACY STRING ROADMAP
                      <>
                        <div className="flex justify-between items-center mb-2">
                            <p className="details-title">Strategy</p>
                            <button 
                                onClick={convertToSubtasks}
                                className="ff-btn ff-btn-ghost"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                            >
                                <ListTodo size={14} />
                                Start All
                            </button>
                        </div>
                        <div className="details-text whitespace-pre-wrap mb-4">
                          {task.roadmap}
                        </div>
                      </>
                   ) : (
                      // STRUCTURED OBJECT ROADMAP
                      <div className="space-y-4 mb-6">
                        {task.roadmap.overview && (
                            <div>
                                <p className="details-title">Overview</p>
                                <p className="text-sm text-slate-600">{task.roadmap.overview}</p>
                            </div>
                        )}

                        {task.roadmap.subtopics && task.roadmap.subtopics.length > 0 && (
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <p className="details-title">Core Concepts</p>
                                    <button 
                                        onClick={convertToSubtasks} 
                                        className="ff-btn ff-btn-ghost"
                                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                    >
                                        Start All
                                    </button>
                                </div>
                                <ul className="list-disc list-inside text-sm text-slate-700 space-y-1 pl-1">
                                    {task.roadmap.subtopics.map((item, i) => (
                                        <li key={i}>{item.text}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {task.roadmap.practiceTasks && task.roadmap.practiceTasks.length > 0 && (
                            <div>
                                <p className="details-title">Practice</p>
                                <ul className="list-disc list-inside text-sm text-slate-700 space-y-1 pl-1">
                                    {task.roadmap.practiceTasks.map((item, i) => (
                                        <li key={i}>{item.text}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {task.roadmap.projects && task.roadmap.projects.length > 0 && (
                            <div>
                                <p className="details-title">Projects</p>
                                <ul className="list-none space-y-2">
                                    {task.roadmap.projects.map((item, i) => (
                                        <li key={i} className="bg-indigo-50 text-indigo-700 text-sm p-2 rounded-lg border border-indigo-100 flex gap-2">
                                            <span className="mt-0.5">🚀</span>
                                            {item.text}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                      </div>
                   )
                ) : (
                  <p className="text-sm text-gray-400 italic mb-4">
                    No roadmap generated.
                  </p>
                )
            )}

            {/* RESOURCES UI */}
            {(task.resources && task.resources.length > 0) || (task.files && task.files.length > 0) ? (
              <div className="task-resources border-t border-gray-100 pt-3">
                <p className="details-title flex items-center gap-1 mb-2">
                  <LinkIcon size={12} /> Resources
                </p>
                
                <div className="flex flex-col gap-3">
                    {/* Handle new Unified Resources Array */}
                    {Array.isArray(task.resources) && task.resources.length > 0 && typeof task.resources[0] === 'object' && task.resources[0] !== null && task.resources[0].url ? (
                        task.resources.map((res, i) => (
                            <div key={i} className="resource-item">
                                {/* IMAGE */}
                                {res.type && res.type.startsWith('image/') && (
                                    <div className="ff-resource-card">
                                        <img 
                                            src={res.url} 
                                            alt={res.name} 
                                            style={{ maxHeight: '120px', width: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                            className="mx-auto hover:opacity-90 transition-opacity" 
                                            onClick={() => setEnlargedImage({ url: res.url, name: res.name })}
                                            title="Click to enlarge"
                                        />
                                        <div className="p-2 text-xs text-slate-500 bg-white border-t border-slate-100 truncate">{res.name}</div>
                                    </div>
                                )}
                                
                                {/* VIDEO */}
                                {res.type && res.type.startsWith('video/') && (
                                    <div className="ff-resource-card">
                                        <video controls src={res.url} className="w-full h-auto max-h-[200px]" />
                                        <div className="p-2 text-xs text-slate-500 bg-white border-t border-slate-100 truncate">{res.name}</div>
                                    </div>
                                )}

                                {/* PDF (Preview if possible, else link) */}
                                {res.type && res.type.includes('pdf') && (
                                    <div className="ff-resource-card">
                                        <div className="ff-resource-header">
                                            <FileText size={16} className="text-red-500" />
                                            <span className="text-sm font-medium text-slate-700 truncate flex-1">{res.name}</span>
                                            <a href={res.url} target="_blank" rel="noopener noreferrer" className="ff-btn ff-btn-ghost" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>Open</a>
                                        </div>
                                        <iframe src={res.url} className="w-full h-[200px] bg-slate-100" title={res.name}></iframe>
                                    </div>
                                )}

                                {/* GENERIC LINK or OTHER FILE */}
                                {(!res.type || res.type === 'link' || (!res.type.startsWith('image/') && !res.type.startsWith('video/') && !res.type.includes('pdf'))) && (
                                    <a 
                                        href={res.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="ff-resource-link"
                                    >
                                        {getResourceIcon(res.url || '')}
                                        <span className="truncate flex-1">{res.name || res.url}</span>
                                        <ExternalLink size={12} className="opacity-50" />
                                    </a>
                                )}
                            </div>
                        ))
                    ) : (
                        // FALLBACK FOR LEGACY DATA (Strings or separate files array)
                        <>
                            {/* URLs - only render if they are strings */}
                            {validResources.filter(r => typeof r === 'string').map((url, i) => (
                                <a 
                                    key={i} 
                                    href={url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="ff-resource-link"
                                    style={{ marginBottom: '0.5rem' }}
                                >
                                    {getResourceIcon(url)}
                                    <span className="truncate flex-1">{url}</span>
                                    <ExternalLink size={12} className="opacity-50" />
                                </a>
                            ))}

                            {/* Files */}
                            {task.files && task.files.map((file, index) => (
                                <div key={index} className="ff-file-chip" style={{ marginBottom: '0.5rem' }}>
                                    {getFileIcon(file.type)}
                                    <span className="truncate flex-1">{file.name}</span>
                                    <span className="text-xs opacity-60">
                                        {file.size ? (file.size / 1024).toFixed(1) + ' KB' : ''}
                                    </span>
                                </div>
                            ))}
                        </>
                    )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Image Enlargement Modal */}
      {enlargedImage && (
        <div 
          className="ff-image-modal"
          onClick={() => setEnlargedImage(null)}
        >
          <button
            onClick={() => setEnlargedImage(null)}
            className="ff-modal-close"
            title="Close"
          >
            <X size={24} />
          </button>
          <div className="max-w-[90vw] max-h-[90vh] flex flex-col items-center">
            <img 
              src={enlargedImage.url} 
              alt={enlargedImage.name} 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-white text-sm mt-4 bg-black bg-opacity-50 px-4 py-2 rounded-lg">
              {enlargedImage.name}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
