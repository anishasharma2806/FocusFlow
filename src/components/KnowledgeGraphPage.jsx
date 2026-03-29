import React, { useState, useRef, useEffect, useCallback } from "react";
import { Network, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { getItem, STORAGE_KEYS } from "../utils/storage";

export default function KnowledgeGraphPage() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(null);
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState(null);
  const animRef = useRef(null);

  // Build graph from data
  // Build graph from data
  useEffect(() => {
    const notes = getItem(STORAGE_KEYS.NOTES, []);
    const flashcards = getItem(STORAGE_KEYS.FLASHCARDS, []);
    const tasks = getItem(STORAGE_KEYS.TASKS, []);

    const graphNodes = [];
    const graphEdges = [];
    const tagMap = {};

    // Add note nodes
    if (Array.isArray(notes)) {
      notes.forEach((note, i) => {
        if (!note || !note.id) return;
        const id = `note-${note.id}`;
        graphNodes.push({
          id, label: note.title || "Untitled", type: "note",
          x: 200 + Math.cos(i * 0.8) * 200 + Math.random() * 50,
          y: 300 + Math.sin(i * 0.8) * 200 + Math.random() * 50,
          vx: 0, vy: 0, color: "#6366f1",
        });
        if (Array.isArray(note.tags)) {
          note.tags.forEach(tag => {
            if (!tag) return;
            if (!tagMap[tag]) {
              tagMap[tag] = { id: `tag-${tag}`, label: `#${tag}`, type: "tag", color: "#8b5cf6", connections: [] };
            }
            tagMap[tag].connections.push(id);
            graphEdges.push({ from: id, to: `tag-${tag}` });
          });
        }
      });
    }

    // Add flashcard deck nodes
    const decks = {};
    if (Array.isArray(flashcards)) {
      flashcards.forEach(card => {
        if (!card) return;
        const deck = card.deck || "General";
        if (!decks[deck]) decks[deck] = [];
        decks[deck].push(card);
      });
    }
    
    Object.entries(decks).forEach(([deck, cards], i) => {
      const id = `deck-${deck}`;
      graphNodes.push({
        id, label: `📚 ${deck} (${cards.length})`, type: "deck",
        x: 500 + Math.cos(i * 1.2) * 150 + Math.random() * 50,
        y: 200 + Math.sin(i * 1.2) * 150 + Math.random() * 50,
        vx: 0, vy: 0, color: "#ec4899",
      });
    });

    // Add task topic nodes
    if (Array.isArray(tasks)) {
      tasks.forEach((task, i) => {
        if (!task || !task.id) return;
        const id = `task-${task.id}`;
        graphNodes.push({
          id, label: task.topic || "Untopiced", type: "task",
          x: 400 + Math.cos(i * 0.6) * 250 + Math.random() * 50,
          y: 400 + Math.sin(i * 0.6) * 250 + Math.random() * 50,
          vx: 0, vy: 0, color: "#10b981",
        });
      });
    }

    // Connect tasks to matching tags
    if (Array.isArray(tasks)) {
      tasks.forEach(task => {
        if (!task || !task.id) return;
        const taskId = `task-${task.id}`;
        Object.keys(tagMap).forEach(tag => {
          const tagId = `tag-${tag}`;
          if (task.topic?.toLowerCase().includes(tag) || task.subject?.toLowerCase().includes(tag)) {
            graphEdges.push({ from: taskId, to: tagId });
          }
        });
      });
    }

    // Add tag nodes
    Object.values(tagMap).forEach((tag, i) => {
      graphNodes.push({
        ...tag,
        x: 350 + Math.cos(i * 1.5) * 300 + Math.random() * 50,
        y: 350 + Math.sin(i * 1.5) * 300 + Math.random() * 50,
        vx: 0, vy: 0,
      });
    });

    // Subject-based clustering (connect items in the same subject)
    const subjectMap = {};
    graphNodes.forEach(node => {
      let subject = "";
      if (node.type === "note") {
        const noteObj = notes.find(n => `note-${n.id}` === node.id);
        subject = (noteObj?.tags?.[0]) || "General";
      } else if (node.type === "task") {
        const taskObj = tasks.find(t => `task-${t.id}` === node.id);
        subject = taskObj?.subject || "General";
      } else if (node.type === "deck") {
        subject = node.label.replace("📚 ", "").split(" (")[0];
      }

      if (subject) {
        if (!subjectMap[subject]) subjectMap[subject] = [];
        subjectMap[subject].push(node.id);
      }
    });

    // Create edges for subject clusters (limit to avoid too many edges)
    Object.values(subjectMap).forEach(group => {
      if (group.length > 1) {
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < Math.min(i + 3, group.length); j++) {
            graphEdges.push({ from: group[i], to: group[j] });
          }
        }
      }
    });

    setNodes(graphNodes);
    setEdges(graphEdges);
  }, []); // Re-run if any data changes (manually triggered by page visit)

  // Force simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    let rafId;
    let frame = 0;
    const maxFrames = 300; // Increased for better settling

    const simulate = () => {
      if (frame > maxFrames) return;
      frame++;

      setNodes(prev => {
        const next = prev.map(n => ({ ...n }));

        // Repulsion
        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const dx = next[j].x - next[i].x;
            const dy = next[j].y - next[i].y;
            const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
            if (dist < 400) {
              const force = 3000 / (dist * dist);
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;
              next[i].vx -= fx; next[i].vy -= fy;
              next[j].vx += fx; next[j].vy += fy;
            }
          }
        }

        // Attraction (edges)
        edges.forEach(e => {
          const a = next.find(n => n.id === e.from);
          const b = next.find(n => n.id === e.to);
          if (!a || !b) return;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            const force = (dist - 100) * 0.02; // Increased attraction
            a.vx += (dx / dist) * force;
            a.vy += (dy / dist) * force;
            b.vx -= (dx / dist) * force;
            b.vy -= (dy / dist) * force;
          }
        });

        // Center gravity
        const cx = 400, cy = 300;
        next.forEach(n => {
          n.vx += (cx - n.x) * 0.002; // Increased center gravity
          n.vy += (cy - n.y) * 0.002;
          n.vx *= 0.8; n.vy *= 0.8; // Dampening
          n.x += n.vx; n.y += n.vy;
        });

        return next;
      });

      rafId = requestAnimationFrame(simulate);
    };

    simulate();
    return () => cancelAnimationFrame(rafId);
  }, [nodes.length, edges.length]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const container = containerRef.current;
    if (!container) return;

    const w = container.clientWidth;
    const h = container.clientHeight;
    canvas.width = w * window.devicePixelRatio;
    canvas.height = h * window.devicePixelRatio;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(offset.x + w / 2, offset.y + h / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-400, -300);

    // Draw edges
    edges.forEach(e => {
      const a = nodes.find(n => n.id === e.from);
      const b = nodes.find(n => n.id === e.to);
      if (!a || !b) return;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw nodes
    nodes.forEach(n => {
      const isHovered = hoveredNode === n.id;
      const r = isHovered ? 28 : 22;

      // Glow
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 8, 0, Math.PI * 2);
        ctx.fillStyle = n.color + "20";
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = n.color;
      ctx.shadowColor = n.color;
      ctx.shadowBlur = isHovered ? 15 : 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // White border
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = "#1e293b";
      ctx.font = `${isHovered ? '13' : '11'}px Inter, sans-serif`;
      ctx.textAlign = "center";
      const label = n.label.length > 20 ? n.label.substring(0, 18) + "…" : n.label;
      ctx.fillText(label, n.x, n.y + r + 16);
    });

    ctx.restore();
  }, [nodes, edges, zoom, offset, hoveredNode]);

  // Mouse handlers
  const getCanvasPoint = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const container = containerRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;
    return {
      x: ((e.clientX - rect.left - offset.x - w / 2) / zoom) + 400,
      y: ((e.clientY - rect.top - offset.y - h / 2) / zoom) + 300,
    };
  };

  const handleMouseDown = (e) => {
    const point = getCanvasPoint(e);
    const hit = nodes.find(n => Math.hypot(n.x - point.x, n.y - point.y) < 25);
    if (hit) {
      setDragging(hit.id);
    } else {
      setPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      const point = getCanvasPoint(e);
      setNodes(prev => prev.map(n => n.id === dragging ? { ...n, x: point.x, y: point.y, vx: 0, vy: 0 } : n));
    } else if (panning) {
      setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else {
      const point = getCanvasPoint(e);
      const hit = nodes.find(n => Math.hypot(n.x - point.x, n.y - point.y) < 25);
      setHoveredNode(hit ? hit.id : null);
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setPanning(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    setZoom(prev => Math.max(0.3, Math.min(3, prev - e.deltaY * 0.001)));
  };

  return (
    <div className="ff-page">
      <div className="ff-page-header">
        <div className="flex items-center gap-3">
          <div className="ff-page-icon" style={{ background: "#faf5ff" }}>
            <Network size={22} style={{ color: "#8b5cf6" }} />
          </div>
          <div>
            <h1 className="ff-page-title">Knowledge Graph</h1>
            <p className="ff-page-subtitle">Visual connections between your study materials</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="ff-btn ff-btn-outline" onClick={() => setZoom(z => Math.min(3, z + 0.2))}><ZoomIn size={18} /></button>
          <button className="ff-btn ff-btn-outline" onClick={() => setZoom(z => Math.max(0.3, z - 0.2))}><ZoomOut size={18} /></button>
          <button className="ff-btn ff-btn-outline" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}><Maximize2 size={18} /></button>
        </div>
      </div>

      {/* Legend */}
      <div className="ff-graph-legend">
        <span className="ff-legend-item"><span className="ff-legend-dot" style={{ background: "#6366f1" }} /> Notes</span>
        <span className="ff-legend-item"><span className="ff-legend-dot" style={{ background: "#ec4899" }} /> Flashcard Decks</span>
        <span className="ff-legend-item"><span className="ff-legend-dot" style={{ background: "#10b981" }} /> Tasks</span>
        <span className="ff-legend-item"><span className="ff-legend-dot" style={{ background: "#8b5cf6" }} /> Tags</span>
      </div>

      <div className="ff-graph-container" ref={containerRef}>
        {nodes.length === 0 ? (
          <div className="ff-empty-state">
            <Network size={48} className="opacity-15" />
            <p>No data yet. Create notes, flashcards, or tasks to see your knowledge graph.</p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ cursor: dragging ? "grabbing" : panning ? "grabbing" : hoveredNode ? "pointer" : "grab" }}
          />
        )}
      </div>
    </div>
  );
}
