import React, { useState, useEffect, useRef } from "react";
import { StickyNote, Plus, Search, X, Tag, Save, Eye, Edit3, Image as ImageIcon, Bold, Italic, Heading, List, Link as LinkIcon, Trash2 } from "lucide-react";
import { getItem, setItem, STORAGE_KEYS } from "../utils/storage";

const EMPTY_NOTE = {
  id: null,
  title: "",
  content: "",
  tags: [],
  createdAt: null,
  updatedAt: null,
};

export default function NotesPage() {
  const [notes, setNotes] = useState(() => getItem(STORAGE_KEYS.NOTES, []));
  const [activeNote, setActiveNote] = useState(null);
  const [draft, setDraft] = useState({ ...EMPTY_NOTE });
  const [searchQuery, setSearchQuery] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const textareaRef = useRef(null);
  const autoSaveTimer = useRef(null);

  // Persist notes
  useEffect(() => {
    setItem(STORAGE_KEYS.NOTES, notes);
  }, [notes]);

  // Auto-save every 2 seconds of inactivity
  useEffect(() => {
    if (!draft.id) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveNote();
    }, 2000);
    return () => clearTimeout(autoSaveTimer.current);
  }, [draft.content, draft.title, draft.tags]);

  const createNewNote = () => {
    const newNote = {
      ...EMPTY_NOTE,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDraft(newNote);
    setActiveNote(newNote.id);
    setPreviewMode(false);
  };

  const saveNote = () => {
    if (!draft.id) return;
    const updated = { ...draft, updatedAt: new Date().toISOString() };
    setNotes(prev => {
      const exists = prev.find(n => n.id === updated.id);
      if (exists) {
        return prev.map(n => n.id === updated.id ? updated : n);
      }
      return [updated, ...prev];
    });
  };

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeNote === id) {
      setActiveNote(null);
      setDraft({ ...EMPTY_NOTE });
    }
  };

  const selectNote = (note) => {
    // Save current draft before switching
    if (draft.id) saveNote();
    setDraft({ ...note });
    setActiveNote(note.id);
    setPreviewMode(false);
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !draft.tags.includes(tag)) {
      setDraft(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput("");
  };

  const removeTag = (tag) => {
    setDraft(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const insertFormatting = (prefix, suffix = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = draft.content;
    const selected = text.substring(start, end);
    const newText = text.substring(0, start) + prefix + selected + suffix + text.substring(end);
    setDraft(prev => ({ ...prev, content: newText }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  const insertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      insertFormatting(`![image](${url})\n`, "");
    }
  };

  const filteredNotes = notes.filter(note => {
    const q = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(q) ||
      note.content.toLowerCase().includes(q) ||
      note.tags.some(t => t.includes(q))
    );
  });

  // Simple markdown renderer
  const renderMarkdown = (text) => {
    if (!text) return "";
    let html = text
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:8px 0" />')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/\n/g, '<br/>');
    return html;
  };

  return (
    <div className="ff-page">
      <div className="ff-page-header">
        <div className="flex items-center gap-3">
          <div className="ff-page-icon">
            <StickyNote size={22} />
          </div>
          <div>
            <h1 className="ff-page-title">Notes</h1>
            <p className="ff-page-subtitle">{notes.length} notes</p>
          </div>
        </div>
        <button className="ff-btn ff-btn-primary" onClick={createNewNote}>
          <Plus size={18} /> New Note
        </button>
      </div>

      <div className="ff-notes-layout">
        {/* Notes List Panel */}
        <div className="ff-notes-sidebar">
          <div className="ff-search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="ff-search-input"
            />
          </div>

          <div className="ff-notes-list">
            {filteredNotes.length === 0 && (
              <div className="ff-empty-state">
                <StickyNote size={32} className="opacity-20" />
                <p>No notes yet</p>
              </div>
            )}
            {filteredNotes.map(note => (
              <div
                key={note.id}
                className={`ff-note-item ${activeNote === note.id ? 'active' : ''}`}
                onClick={() => selectNote(note)}
              >
                <div className="ff-note-item-header">
                  <h4 className="ff-note-item-title">{note.title || "Untitled"}</h4>
                  <button
                    className="ff-note-delete"
                    onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="ff-note-item-preview">
                  {note.content.substring(0, 80) || "Empty note..."}
                </p>
                {note.tags.length > 0 && (
                  <div className="ff-note-item-tags">
                    {note.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="ff-tag-mini">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Editor Panel */}
        <div className="ff-notes-editor">
          {draft.id ? (
            <>
              {/* Title */}
              <input
                type="text"
                className="ff-note-title-input"
                placeholder="Note title..."
                value={draft.title}
                onChange={e => setDraft(prev => ({ ...prev, title: e.target.value }))}
              />

              {/* Tags */}
              <div className="ff-tags-bar">
                <Tag size={14} />
                {draft.tags.map(tag => (
                  <span key={tag} className="ff-tag">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="ff-tag-remove"><X size={12} /></button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  className="ff-tag-input"
                />
              </div>

              {/* Toolbar */}
              <div className="ff-editor-toolbar">
                <button onClick={() => insertFormatting("**", "**")} title="Bold"><Bold size={16} /></button>
                <button onClick={() => insertFormatting("*", "*")} title="Italic"><Italic size={16} /></button>
                <button onClick={() => insertFormatting("## ", "")} title="Heading"><Heading size={16} /></button>
                <button onClick={() => insertFormatting("- ", "")} title="List"><List size={16} /></button>
                <button onClick={() => insertFormatting("[", "](url)")} title="Link"><LinkIcon size={16} /></button>
                <button onClick={insertImage} title="Image"><ImageIcon size={16} /></button>
                <div className="ff-toolbar-spacer" />
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={previewMode ? 'active' : ''}
                  title={previewMode ? "Edit" : "Preview"}
                >
                  {previewMode ? <Edit3 size={16} /> : <Eye size={16} />}
                </button>
                <button onClick={() => { saveNote(); }} title="Save">
                  <Save size={16} />
                </button>
              </div>

              {/* Editor / Preview */}
              {previewMode ? (
                <div
                  className="ff-note-preview"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(draft.content) }}
                />
              ) : (
                <textarea
                  ref={textareaRef}
                  className="ff-note-textarea"
                  placeholder="Start writing... (Markdown supported)"
                  value={draft.content}
                  onChange={e => setDraft(prev => ({ ...prev, content: e.target.value }))}
                />
              )}
            </>
          ) : (
            <div className="ff-empty-editor">
              <StickyNote size={48} className="opacity-10" />
              <p>Select a note or create a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
