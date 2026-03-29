import React, { useState } from "react";
import {
  Plus,
  Sparkles,
  Calendar,
  Clock,
  BookOpen,
  Link as LinkIcon,
  AlertCircle,
  X,
} from "lucide-react";

export default function TaskForm({ onAddTask }) {
  const [formData, setFormData] = useState({
    subject: "",
    topic: "",
    duration: "",
    difficulty: "Easy",
    roadmap: "",
    resources: "",
    files: [],
    deadline: "",
  });

  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const removeFile = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleGenerateRoadmap = async () => {
    if (!formData.subject || !formData.topic) {
      alert("Please enter Subject and Topic first.");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
          formData.topic,
        )}`,
      );

      const data = await response.json();
      const summary =
        data.extract || `Study the core fundamentals of ${formData.topic}.`;

      const links = formData.resources
        .split("\n")
        .filter((line) => line.includes("http"));

      let practiceSection = "";
      let projectSection = "";

      // ----- Easy / Medium / Hard Logic -----
      if (formData.difficulty === "Easy") {
        practiceSection = `
• Define ${formData.topic} in simple terms
• List basic concepts
• Solve introductory problems
`;
        projectSection = `
• Build a basic "Hello World" style demo
• Create flashcards for verification
`;
      } else if (formData.difficulty === "Medium") {
        practiceSection = `
• Compare ${formData.topic} with related concepts
• Solve applied exercises
• Identify common pitfalls
`;
        projectSection = `
• Build a functional mini-tool using ${formData.topic}
• Integrate into a small existing project
`;
      } else {
        // Hard
        practiceSection = `
• Deep dive into internals/architecture
• Solve complex real-world scenarios
• Performance analysis and optimization
`;
        projectSection = `
• Build a production-ready module
• Benchmark and optimize implementation
`;
      }

      // Check if subject or topic implies practical/build-based work
      const practicalKeywords = [
        // Core Domains
        "computer science",
        "information technology",
        "software",
        "engineering",
        "robotics",
        "web",
        "mobile",
        "app",
        "game",
        "cloud",
        "security",
        "network",
        "devops",
        "sysadmin",
        "data science",

        // Languages & Technologies
        "code",
        "coding",
        "programming",
        "development",
        "html",
        "css",
        "javascript",
        "typescript",
        "python",
        "java",
        "c++",
        "c#",
        "rust",
        "go",
        "php",
        "ruby",
        "swift",
        "kotlin",
        "sql",
        "nosql",
        "react",
        "vue",
        "angular",
        "node",
        "express",
        "django",
        "flask",
        "spring",
        "docker",
        "kubernetes",
        "aws",
        "azure",
        "firebase",
      ];

      const isPractical = practicalKeywords.some(
        (k) =>
          formData.subject.toLowerCase().includes(k) ||
          formData.topic.toLowerCase().includes(k),
      );

      // Define project templates dynamically
      if (isPractical) {
        if (formData.difficulty === "Easy") {
          projectSection = `
• Build a Personal Portfolio Website using ${formData.topic}
• Create a ${formData.topic} Cheat Sheet / Reference Guide
• Design a simple Quiz Interface regarding ${formData.topic}
`;
        } else if (formData.difficulty === "Medium") {
          projectSection = `
• Build a Responsive Dashboard Layout using ${formData.topic}
• Develop a To-Do List App focusing on ${formData.topic} features
• Create a Weather Widget or Mini-Tool with ${formData.topic}
`;
        } else {
          // Hard
          projectSection = `
• Recreate a popular app (e.g. Netflix/Spotify) UI using ${formData.topic}
• Architect a Scalable Application Structure with ${formData.topic}
• Build a Reusable Component Library or Module in ${formData.topic}
`;
        }
      }

      let suggestedRoadmap = `
🎯 Topic: ${formData.topic}
📚 Difficulty: ${formData.difficulty}

📖 Overview:
${summary}

🧠 Study Plan:
1. Break ${formData.topic} into core concepts
2. Create structured notes
3. Apply spaced repetition

📝 Practice:
${practiceSection}
`;

      // Only add projects for practical subjects
      if (isPractical) {
        suggestedRoadmap += `
🚀 Projects:
${projectSection}
`;
      }

      setFormData((prev) => ({
        ...prev,
        roadmap: suggestedRoadmap.trim(),
      }));
    } catch (error) {
      console.error(error);
      setFormData((prev) => ({
        ...prev,
        roadmap: `Failed to fetch AI plan. Try manually adding steps for ${prev.topic}.`,
      }));
    }

    setIsGenerating(false);
  };

  const parseRoadmap = (text, difficulty, topic) => {
    // Default structure
    const structured = {
      title: topic,
      difficulty: difficulty,
      overview: "",
      subtopics: [],
      practiceTasks: [],
      projects: [],
      additionalResources: [],
    };

    if (!text) return structured;

    // Simple parsing strategy based on sections
    const lines = text.split("\n");
    let currentSection = "overview";

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Detect sections
      if (
        trimmed.includes("Study Plan:") ||
        trimmed.includes("Core Concepts")
      ) {
        currentSection = "subtopics";
        return;
      }
      if (trimmed.includes("Practice:") || trimmed.includes("Exercises")) {
        currentSection = "practiceTasks";
        return;
      }
      if (trimmed.includes("Projects:")) {
        currentSection = "projects";
        return;
      }
      if (trimmed.includes("Resources:") || trimmed.includes("Overview:")) {
        if (trimmed.includes("Overview:")) currentSection = "overview";
        // Resources in roadmap text are usually just links, we handle them below
        return;
      }

      // Parse content based on section
      if (currentSection === "overview") {
        if (
          !trimmed.startsWith("Target Topic") &&
          !trimmed.startsWith("Difficulty")
        ) {
          structured.overview += trimmed + " ";
        }
      } else {
        // It's a list item
        const cleanItem = trimmed.replace(/^[•\-\d+\.]\s*/, "");
        if (cleanItem.length > 2) {
          structured[currentSection].push({
            id: Date.now() + Math.random(),
            text: cleanItem,
            completed: false,
          });
        }
      }
    });

    structured.overview = structured.overview.trim();
    return structured;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject || !formData.topic || !formData.duration) return;

    // Check for past deadline
    if (
      formData.deadline &&
      new Date(formData.deadline) < new Date().setHours(0, 0, 0, 0)
    ) {
      alert("Deadline cannot be in the past!");
      return;
    }

    // Regex to find all URLs in resources string
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const textLinks = formData.resources.match(urlRegex) || [];

    // Create structured resource objects for text links
    const linkResources = textLinks.map((link) => ({
      name: link,
      type: "link",
      url: link,
    }));

    // Convert files to base64 for persistence
    const fileResources = [];

    for (const file of formData.files) {
      // Increased check file size to 10MB to avoid quota issues (10MB = 10 * 1024 * 1024 bytes)
      const maxSize = 10 * 1024 * 1024;

      if (file.size > maxSize) {
        alert(
          `File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Please upload files smaller than 10MB.`,
        );
        continue;
      }

      // Convert to base64
      try {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        fileResources.push({
          name: file.name,
          type: file.type,
          url: base64, // base64 string
          size: file.size,
        });
      } catch (error) {
        console.error(`Failed to convert ${file.name}:`, error);
        alert(`Failed to process file "${file.name}". Please try again.`);
      }
    }

    // Combine all resources
    const unifiedResources = [...linkResources, ...fileResources];

    // Parse roadmap text into structure
    const structuredRoadmap = parseRoadmap(
      formData.roadmap,
      formData.difficulty,
      formData.topic,
    );

    onAddTask({
      ...formData,
      resources: unifiedResources, // Unified array with base64 files
      roadmap: structuredRoadmap, // Object
      files: [], // No longer needed, files are in resources
      id: Date.now(),
      completed: false,
      actualTime: 0,
      duration: parseInt(formData.duration),
    });

    setFormData({
      subject: "",
      topic: "",
      duration: "",
      difficulty: "Easy",
      roadmap: "",
      resources: "",
      files: [],
      deadline: "",
    });

    // Clear file input
    const fileInput = document.getElementById("fileUpload");
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
          <Plus size={22} />
        </div>
        <div>
          <h2 className="text-xl font-heading font-bold">New Study Session</h2>
          <p className="text-sm text-secondary">Plan your focus time smartly</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* SUBJECT + TOPIC */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="input-group">
            <label className="input-label flex items-center gap-2">
              <BookOpen size={16} /> Subject
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Computer Science"
              className="input-field"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label flex items-center gap-2">
              <AlertCircle size={16} /> Topic
            </label>
            <input
              type="text"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              placeholder="Software Design Patterns"
              className="input-field"
              required
            />
          </div>
        </div>

        {/* DURATION + DEADLINE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="input-group">
            <label className="input-label flex items-center gap-2">
              <Clock size={16} /> Duration (min)
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              min="1"
              placeholder="e.g. 25"
              className="input-field"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label flex items-center gap-2">
              <Calendar size={16} /> Deadline
            </label>
            <input
              type="date"
              name="deadline"
              min={new Date().toISOString().split("T")[0]}
              value={formData.deadline}
              onChange={handleChange}
              placeholder="Select deadline"
              className="input-field"
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Difficulty Level</label>
          <select
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            className="input-field"
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>

        {/* ROADMAP */}
        <div className="input-group">
          <div className="flex justify-between items-center mb-4">
            <label className="input-label mb-0 text-slate-700">
              Study Roadmap
            </label>
            <button
              type="button"
              onClick={handleGenerateRoadmap}
              disabled={isGenerating}
              className={`ff-btn ff-btn-ai text-xs py-2 px-4 ${
                isGenerating ? "opacity-80 cursor-wait" : ""
              }`}
            >
              <Sparkles size={14} />
              {isGenerating ? "Generating..." : "AI Plan"}
            </button>
          </div>

          <textarea
            name="roadmap"
            value={formData.roadmap}
            onChange={handleChange}
            placeholder="AI roadmap will appear here..."
            className="input-field min-h-[140px] resize-y"
          />
        </div>

        {/* RESOURCES */}
        <div className="input-group">
          <label className="input-label flex items-center gap-2">
            <LinkIcon size={16} /> Resources (One URL per line)
          </label>

          <textarea
            name="resources"
            value={formData.resources}
            onChange={handleChange}
            placeholder="Paste URLs here (e.g. YouTube, Articles)..."
            className="input-field h-24 resize-y font-mono text-sm"
          />

          {/* File Upload */}
          <div className="file-upload-wrapper mt-4">
            <input
              id="fileUpload"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,image/*"
              onChange={(e) => {
                if (e.target.files) {
                  const newFiles = Array.from(e.target.files);
                  setFormData((prev) => ({
                    ...prev,
                    files: [...prev.files, ...newFiles],
                  }));
                }
              }}
              className="file-input-hidden"
              style={{ display: "none" }}
            />

            <div className="flex flex-col items-start gap-4">
              <div className="flex items-center gap-3">
                <label
                  htmlFor="fileUpload"
                  className="ff-btn ff-btn-outline cursor-pointer"
                >
                  Attach Files
                </label>
                <span className="text-xs text-secondary">
                  PDF, Docs, Images supported
                </span>
              </div>

              {formData.files.length > 0 && (
                <div className="file-preview flex flex-wrap gap-2 w-full">
                  {formData.files.map((file, index) => (
                    <div key={index} className="ff-file-chip">
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <button type="submit" className="ff-btn ff-btn-primary w-full py-3">
          Create Session
        </button>
      </form>
    </div>
  );
}
