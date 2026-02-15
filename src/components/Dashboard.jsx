import React from 'react';
import { Clock, CheckCircle, Calendar, TrendingUp } from 'lucide-react';

export default function Dashboard({ stats }) {
  const cards = [
    {
      title: "Focus Time",
      value: `${stats.timeSpent || 0}m`,
      icon: <Clock size={22} className="text-indigo-600" />,
      bg: "bg-indigo-50",
      border: "border-indigo-100",
      desc: "Total duration today"
    },
    {
      title: "Completed",
      value: stats.completed,
      icon: <CheckCircle size={22} className="text-emerald-600" />,
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      desc: "Tasks finished"
    },
    {
      title: "Pending",
      value: stats.upcoming,
      icon: <Calendar size={22} className="text-violet-600" />,
      bg: "bg-violet-50",
      border: "border-violet-100",
      desc: "Tasks to do"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
      {cards.map((card, index) => (
        <div 
            key={index} 
            className={`card flex flex-col justify-between p-6 hover:translate-y-[-4px] transition-all duration-300 border ${card.border} ${index === 2 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
        >
          <div className="flex justify-between items-start mb-6">
            <div className={`p-3 rounded-xl shadow-sm ${card.bg}`}>
                {card.icon}
            </div>
            {index === 0 && <TrendingUp size={20} className="text-slate-300" />}
          </div>
          <div>
            <h2 className="text-4xl font-bold text-slate-900 mb-1 tracking-tight font-heading tabular-nums">{card.value}</h2>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{card.title}</p>
            <p className="text-xs text-slate-400 mt-2">{card.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
