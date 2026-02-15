import React from "react";
import TaskCard from "./TaskCard";
import { Layers } from "lucide-react";

export default function TaskList({
  tasks,
  onDelete,
  onComplete,
  onStartFocus,
  onUpdateTask,
  activeTaskId,
}) {
  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.subject]) acc[task.subject] = [];
    acc[task.subject].push(task);
    return acc;
  }, {});

  return (
    <div className="ff-section-gap animate-fadeIn">
      {Object.keys(groupedTasks).length === 0 && (
        <div className="text-center text-gray-400 py-16 px-8 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm animate-fadeIn">
          <Layers size={48} className="mx-auto mb-4 opacity-20 text-indigo-500" />
          <p className="text-lg font-medium text-slate-500">
            No tasks yet. Create a study session to get started!
          </p>
        </div>
      )}

      {Object.entries(groupedTasks).map(([subject, subjectTasks]) => (
        <div key={subject} className="animate-slideUp">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
              {subject}
            </h2>
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              {subjectTasks.length} tasks
            </span>
          </div>

          <div className="focusflow-task-grid">
            {subjectTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDelete={onDelete}
                onComplete={onComplete}
                onStartFocus={onStartFocus}
                onUpdateTask={onUpdateTask}
                activeTaskId={activeTaskId}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
