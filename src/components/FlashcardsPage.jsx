import React, { useState, useEffect } from "react";
import {
  Layers, Plus, RotateCcw, ChevronLeft, ChevronRight,
  Edit3, Trash2, Check, X, Star, Clock, Zap
} from "lucide-react";
import { getItem, setItem, STORAGE_KEYS, getTodayKey } from "../utils/storage";

/**
 * SM-2 Spaced Repetition Algorithm
 * quality: 0-5 (0-2 = fail, 3+ = pass)
 */
function sm2(card, quality) {
  let { easeFactor = 2.5, interval = 1, repetitions = 0 } = card;

  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    easeFactor,
    interval,
    repetitions,
    nextReview: nextReview.toISOString().split("T")[0],
    lastReview: getTodayKey(),
  };
}

export default function FlashcardsPage() {
  const [cards, setCards] = useState(() => getItem(STORAGE_KEYS.FLASHCARDS, []));
  const [tasks] = useState(() => getItem(STORAGE_KEYS.TASKS, []));
  const [mode, setMode] = useState("manage"); // manage | review | create | select-task
  const [editCard, setEditCard] = useState(null);
  const [form, setForm] = useState({ front: "", back: "", difficulty: "medium", deck: "General" });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateCount, setGenerateCount] = useState(5);

  const loadPdfJs = async () => {
    if (window.pdfjsLib) return window.pdfjsLib;
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  const loadTesseract = async () => {
    if (window.Tesseract) return window.Tesseract;
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
      script.onload = () => resolve(window.Tesseract);
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  const FALLBACKS = {
    javascript: [
      { front: "What is a closure in JavaScript?", back: "A feature where an inner function has access to the outer function's scope." },
      { front: "What does JS stand for?", back: "JavaScript" },
      { front: "What is hoisting in JS?", back: "Variable and function declarations are moved to the top of their scope before code execution." }
    ],
    html: [
      { front: "What does HTML stand for?", back: "HyperText Markup Language" },
      { front: "What is the purpose of the <head> tag?", back: "To contain metadata, title, and links to scripts/styles." }
    ],
    css: [
      { front: "What does CSS stand for?", back: "Cascading Style Sheets" },
      { front: "What is the CSS Box Model?", back: "A box that wraps around every HTML element, consisting of margins, borders, padding, and the actual content." },
      { front: "How do you select an element with id 'header'?", back: "#header" }
    ],
    "carbon compounds": [
      { front: "What is an organic compound?", back: "A chemical compound containing carbon-hydrogen bonds." },
      { front: "What is catenation?", back: "The binding of an element to itself through covalent bonds to form chain or ring molecules, remarkably common in Carbon." }
    ],
    trigonometry: [
      { front: "What is the sine of an angle in a right triangle?", back: "Opposite / Hypotenuse" },
      { front: "What is the Pythagorean theorem?", back: "a² + b² = c²" },
      { front: "What is the cosine of 0 degrees?", back: "1" }
    ]
  };

  const generateLocalQuestions = (text) => {
    const sentences = text.split(/[.!?\n\r]+/).map(s => s.trim()).filter(s => s.length > 10 && s.length < 300);
    if (!sentences.length) return [];
    
    // Create exactly generateCount cards
    const result = [];
    const pool = sentences.sort(() => 0.5 - Math.random());
    for(let i = 0; i < generateCount; i++) {
      const sentence = pool[i % pool.length];
      const wrapIndex = Math.floor(i / pool.length);
      const words = sentence.split(' ').filter(w => w.length > 4).sort((a,b) => b.length - a.length);
      
      if (!words.length) {
        const prefix = wrapIndex > 0 ? `(Review) ` : ``;
        result.push({ front: `${prefix}Significance of: "${sentence.substring(0, 50)}..."?`, back: sentence });
      } else {
        const keywordIdx = wrapIndex % words.length;
        const keyword = words[keywordIdx];
        
        const templateType = wrapIndex % 3;
        if (templateType === 0) {
           const front = sentence.replace(keyword, "______");
           result.push({ front: `Fill in the blank: ${front}`, back: keyword.replace(/[^a-zA-Z0-9]/g, '') });
        } else if (templateType === 1) {
           result.push({ front: `Explain the term "${keyword.replace(/[^a-zA-Z0-9]/g, '')}" in the context of: "${sentence.substring(0, 30)}..."`, back: sentence });
        } else {
           result.push({ front: `True or False? ${sentence}`, back: `True. Focused on ${keyword}.` });
        }
      }
    }
    return result;
  };

  const generateFromTask = async (task) => {
    setIsGenerating(true);
    try {
      let extractedText = "";

      if (task.resources && Array.isArray(task.resources) && task.resources.length > 0) {
        for (const res of task.resources) {
          if (res.type && res.type.includes('pdf')) {
            const pdfjsLib = await loadPdfJs();
            const loadingTask = pdfjsLib.getDocument(res.url);
            const pdf = await loadingTask.promise;
            for (let i = 1; i <= pdf.numPages && i <= 5; i++) { 
              const page = await pdf.getPage(i);
              const content = await page.getTextContent();
              extractedText += content.items.map(item => 'str' in item ? item.str : '').join(" ") + " ";
            }
          } else if (res.type && res.type.startsWith('image/')) {
            const Tesseract = await loadTesseract();
            const { data } = await Tesseract.recognize(res.url, 'eng');
            extractedText += data.text + " ";
          }
        }
      }
      
      let generatedFlashcards = [];

      if (extractedText.trim().length > 50) {
        generatedFlashcards = generateLocalQuestions(extractedText);
      } 
      
      if (!generatedFlashcards.length) {
        // Fallback checks
        const searchTopic = task.topic.toLowerCase();
        let matchedKey = Object.keys(FALLBACKS).find(k => searchTopic === k || searchTopic === 'js' && k === 'javascript');
        
        let pool = [];
        if (matchedKey) {
          pool = FALLBACKS[matchedKey];
        } else {
          pool = [
            `What is the main concept of ${task.topic}?`,
            `Why is ${task.topic} important in ${task.subject || 'this field'}?`,
            `List 3 key takeaways about ${task.topic}.`,
            `What are the common challenges when studying ${task.topic}?`,
            `How does ${task.topic} relate to other topics in ${task.subject || 'your subject'}?`,
            `Explain ${task.topic} to a beginner.`,
            `What are the historical origins or basic foundations of ${task.topic}?`,
            `What is a real-world application of ${task.topic}?`,
            `Describe the most complex part of ${task.topic}.`,
            `Summarize ${task.topic} in one sentence.`
          ].map(q => ({ front: q, back: typeof task.roadmap === 'string' ? task.roadmap : `Review your study notes to answer this question about ${task.topic}.` }));
        }

        generatedFlashcards = [];
        for(let i=0; i < generateCount; i++) {
           const card = pool[i % pool.length];
           const wrapIndex = Math.floor(i / pool.length);
           const prefix = wrapIndex > 0 ? `(Part ${wrapIndex + 1}) ` : '';
           generatedFlashcards.push({ front: prefix + card.front, back: card.back });
        }
      }

      if (!generatedFlashcards.length) throw new Error("Could not generate cards from these resources.");

      const newCards = generatedFlashcards.map((fc, i) => ({
        id: Date.now() + i,
        front: fc.front,
        back: fc.back,
        difficulty: 'medium',
        deck: task.subject || 'General',
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: getTodayKey(),
        lastReview: null,
        createdAt: new Date().toISOString(),
      }));

      setCards(prev => [...newCards, ...prev]);
      setMode("manage");

    } catch (err) {
      console.error(err);
      alert(`Failed to generate flashcards locally: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };


  // Review state
  const [reviewQueue, setReviewQueue] = useState([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setItem(STORAGE_KEYS.FLASHCARDS, cards);
  }, [cards]);

  // Get due cards
  const getDueCards = () => {
    const today = getTodayKey();
    return cards.filter(c => !c.nextReview || c.nextReview <= today);
  };

  const startReview = () => {
    const due = getDueCards();
    if (due.length === 0) return;
    setReviewQueue(due);
    setReviewIndex(0);
    setFlipped(false);
    setMode("review");
  };

  const handleCardClick = (card) => {
    setReviewQueue(cards);
    const idx = cards.findIndex(c => c.id === card.id);
    setReviewIndex(idx >= 0 ? idx : 0);
    setFlipped(false);
    setMode("review");
  };

  const handleDifficulty = (quality) => {
    const card = reviewQueue[reviewIndex];
    const updated = { ...card, ...sm2(card, quality) };
    setCards(prev => prev.map(c => c.id === card.id ? updated : c));

    // Track review activity
    const today = getTodayKey();
    const dailyFocus = getItem(STORAGE_KEYS.DAILY_FOCUS, {});
    const dayData = dailyFocus[today] || { focusMinutes: 0, completedTasks: 0, flashcardReviews: 0, pomodoroSessions: 0 };
    dayData.flashcardReviews = (dayData.flashcardReviews || 0) + 1;
    dailyFocus[today] = dayData;
    setItem(STORAGE_KEYS.DAILY_FOCUS, dailyFocus);

    if (reviewIndex < reviewQueue.length - 1) {
      setReviewIndex(prev => prev + 1);
      setFlipped(false);
    } else {
      setMode("manage");
    }
  };

  const saveCard = () => {
    if (!form.front.trim() || !form.back.trim()) return;
    if (editCard) {
      setCards(prev => prev.map(c => c.id === editCard.id ? { ...c, ...form } : c));
      setEditCard(null);
    } else {
      const newCard = {
        ...form,
        id: Date.now(),
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReview: getTodayKey(),
        lastReview: null,
        createdAt: new Date().toISOString(),
      };
      setCards(prev => [newCard, ...prev]);
    }
    setForm({ front: "", back: "", difficulty: "medium", deck: "General" });
    setMode("manage");
  };

  const deleteCard = (id) => {
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const startEdit = (card) => {
    setForm({ front: card.front, back: card.back, difficulty: card.difficulty, deck: card.deck || "General" });
    setEditCard(card);
    setMode("create");
  };

  const dueCount = getDueCards().length;

  // Unique decks
  const decks = [...new Set(cards.map(c => c.deck || "General"))];

  return (
    <div className="ff-page">
      <div className="ff-page-header">
        <div className="flex items-center gap-3">
          <div className="ff-page-icon" style={{ background: "#eef2ff" }}>
            <Layers size={22} style={{ color: "#6366f1" }} />
          </div>
          <div>
            <h1 className="ff-page-title">Flashcards</h1>
            <p className="ff-page-subtitle">{cards.length} cards · {dueCount} due</p>
          </div>
        </div>
        <div className="flex gap-3">
          {dueCount > 0 && (
            <button className="ff-btn ff-btn-primary" onClick={startReview}>
              <Zap size={18} /> Review ({dueCount})
            </button>
          )}
          <button className="ff-btn ff-btn-outline" onClick={() => setMode("select-task")}>
            <RotateCcw size={18} /> From Task
          </button>
          <button className="ff-btn ff-btn-outline" onClick={() => { setEditCard(null); setForm({ front: "", back: "", difficulty: "medium", deck: "General" }); setMode("create"); }}>
            <Plus size={18} /> New Card
          </button>
        </div>
      </div>

      {/* SELECT TASK MODE */}
      {mode === "select-task" && (
        <div className="card animate-slideUp">
          <h3 className="ff-section-title">Generate from Task</h3>
          <p className="text-sm text-slate-500 mb-4">Select a task to convert its roadmap into flashcards.</p>
          
          <div className="mb-4">
            <label className="input-label">Number of cards to generate:</label>
            <input 
              type="number" 
              min="1" 
              max="50" 
              className="input-field" 
              value={generateCount} 
              onChange={(e) => setGenerateCount(Math.max(1, parseInt(e.target.value) || 1))} 
            />
          </div>

          <div className="grid gap-3 max-h-[400px] overflow-y-auto mb-4 p-1">
            {tasks.length === 0 ? (
              <p className="text-center py-8 text-slate-400 italic">No tasks found. Create a task first!</p>
            ) : (
              tasks.map(task => (
                <button 
                  key={task.id} 
                  className={`w-full text-left p-4 rounded-xl border border-slate-200 transition-all group ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-400 hover:bg-indigo-50'}`}
                  onClick={() => generateFromTask(task)}
                  disabled={isGenerating}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-indigo-500">{task.subject}</span>
                      <h4 className="font-bold text-slate-800">{task.topic}</h4>
                    </div>
                    {isGenerating ? (
                      <span className="text-xs text-indigo-500 flex items-center gap-1">
                        <svg className="animate-spin h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </span>
                    ) : (
                      <Plus size={16} className="text-slate-300 group-hover:text-indigo-500" />
                    )}
                  </div>
                </button>              ))
            )}
          </div>
          <button className="ff-btn ff-btn-ghost w-full" onClick={() => setMode("manage")}>Cancel</button>
        </div>
      )}

      {/* CREATE / EDIT MODE */}
      {mode === "create" && (
        <div className="card ff-flashcard-form">
          <h3 className="ff-section-title">{editCard ? "Edit Card" : "New Flashcard"}</h3>

          <div className="ff-form-grid">
            <div className="input-group" style={{ marginBottom: "1rem" }}>
              <label className="input-label">Front (Question)</label>
              <textarea
                className="input-field"
                rows="3"
                placeholder="What is..."
                value={form.front}
                onChange={e => setForm(prev => ({ ...prev, front: e.target.value }))}
              />
            </div>
            <div className="input-group" style={{ marginBottom: "1rem" }}>
              <label className="input-label">Back (Answer)</label>
              <textarea
                className="input-field"
                rows="3"
                placeholder="The answer is..."
                value={form.back}
                onChange={e => setForm(prev => ({ ...prev, back: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-3" style={{ marginBottom: "1rem" }}>
            <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="input-label">Difficulty</label>
              <select className="input-field" value={form.difficulty} onChange={e => setForm(prev => ({ ...prev, difficulty: e.target.value }))}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="input-label">Deck</label>
              <input
                className="input-field"
                placeholder="General"
                value={form.deck}
                onChange={e => setForm(prev => ({ ...prev, deck: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button className="ff-btn ff-btn-primary" onClick={saveCard}>
              <Check size={18} /> {editCard ? "Update" : "Create"}
            </button>
            <button className="ff-btn ff-btn-outline" onClick={() => { setMode("manage"); setEditCard(null); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* REVIEW MODE */}
      {mode === "review" && reviewQueue.length > 0 && (
        <div className="ff-review-container">
          <div className="ff-review-progress">
            <span>{reviewIndex + 1} / {reviewQueue.length}</span>
            <div className="ff-progress-bar">
              <div className="ff-progress-fill" style={{ width: `${((reviewIndex + 1) / reviewQueue.length) * 100}%` }} />
            </div>
          </div>

          <div
            className={`ff-flashcard-3d ${flipped ? 'flipped' : ''}`}
            onClick={() => setFlipped(!flipped)}
          >
            <div className="ff-flashcard-inner">
              <div className="ff-flashcard-front">
                <p className="ff-flashcard-label">Question</p>
                <p className="ff-flashcard-text">{reviewQueue[reviewIndex].front}</p>
                <p className="ff-flashcard-hint">Click to flip</p>
              </div>
              <div className="ff-flashcard-back">
                <p className="ff-flashcard-label">Answer</p>
                <p className="ff-flashcard-text">{reviewQueue[reviewIndex].back}</p>
              </div>
            </div>
          </div>

          {flipped && (
            <div className="ff-difficulty-buttons">
              <button className="ff-diff-btn ff-diff-hard" onClick={() => handleDifficulty(1)}>
                Hard <span>Again</span>
              </button>
              <button className="ff-diff-btn ff-diff-medium" onClick={() => handleDifficulty(3)}>
                Good <span>~{Math.max(1, Math.round(reviewQueue[reviewIndex].interval * (reviewQueue[reviewIndex].easeFactor || 2.5)))}d</span>
              </button>
              <button className="ff-diff-btn ff-diff-easy" onClick={() => handleDifficulty(5)}>
                Easy <span>~{Math.max(1, Math.round(reviewQueue[reviewIndex].interval * (reviewQueue[reviewIndex].easeFactor || 2.5) * 1.3))}d</span>
              </button>
            </div>
          )}

          <div className="flex justify-between w-full" style={{ marginTop: "1rem", maxWidth: "400px", margin: "1rem auto 0" }}>
            <button 
              className="ff-btn ff-btn-outline" 
              onClick={() => {
                setReviewIndex(prev => Math.max(0, prev - 1));
                setFlipped(false); // Reset flip state for new card
              }}
              disabled={reviewIndex === 0}
            >
              <ChevronLeft size={18} /> Previous
            </button>
            
            <button className="ff-btn ff-btn-ghost" onClick={() => setMode("manage")}>
              Exit Review
            </button>

            <button 
              className="ff-btn ff-btn-outline" 
              onClick={() => {
                setReviewIndex(prev => Math.min(reviewQueue.length - 1, prev + 1));
                setFlipped(false); // Reset flip state for new card
              }}
              disabled={reviewIndex === reviewQueue.length - 1}
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* MANAGE MODE */}
      {mode === "manage" && (
        <div className="ff-cards-grid">
          {cards.length === 0 && (
            <div className="ff-empty-state" style={{ gridColumn: "1 / -1" }}>
              <Layers size={48} className="opacity-15" />
              <p>No flashcards yet. Create your first card!</p>
            </div>
          )}
          {decks.map(deck => {
            const deckCards = cards.filter(c => (c.deck || "General") === deck);
            return (
              <div key={deck} className="ff-deck-section">
                <h3 className="ff-deck-title">{deck} <span className="ff-deck-count">{deckCards.length}</span></h3>
                <div className="ff-deck-cards">
                  {deckCards.map(card => (
                    <div 
                      key={card.id} 
                      className="ff-card-mini" 
                      onClick={() => handleCardClick(card)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="ff-card-mini-front">{card.front}</div>
                      <div className="ff-card-mini-meta">
                        <span className={`ff-diff-tag ${card.difficulty}`}>{card.difficulty}</span>
                        {card.nextReview && card.nextReview <= getTodayKey() && (
                          <span className="ff-due-tag">Due</span>
                        )}
                      </div>
                      <div className="ff-card-mini-actions">
                        <button onClick={(e) => { e.stopPropagation(); startEdit(card); }}><Edit3 size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); deleteCard(card.id); }}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
