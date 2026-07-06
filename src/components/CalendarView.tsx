import React, { useState } from 'react';
import { Lead, Reminder } from '../types';
import { 
  Bell, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  AlertCircle, 
  Plus, 
  Check,
  CalendarCheck
} from 'lucide-react';
import { dbService } from '../dbService';

interface CalendarViewProps {
  leads: Lead[];
  reminders: { reminder: Reminder; leadName: string }[];
  onToggleComplete: (leadId: string, reminderId: string, completed: boolean) => void;
  onSelectLead: (lead: Lead) => void;
}

export default function CalendarView({
  leads,
  reminders,
  onToggleComplete,
  onSelectLead,
}: CalendarViewProps) {
  
  const now = new Date();
  const todayStr = now.toDateString();
  
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = tomorrow.toDateString();

  const startOfWeek = new Date();
  const endOfWeek = new Date();
  endOfWeek.setDate(now.getDate() + 7);

  // Quick form states
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [text, setText] = useState('');
  const [datetime, setDatetime] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId) {
      setError("Please select a target store lead.");
      return;
    }
    if (!text.trim()) {
      setError("Please write the reminder instruction.");
      return;
    }
    if (!datetime) {
      setError("Please select date & time.");
      return;
    }

    try {
      setError(null);
      await dbService.reminders.add(selectedLeadId, {
        text: text.trim(),
        datetime,
        completed: false
      });
      setText('');
      setDatetime('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving quick reminder:", err);
      setError("Failed to save reminder.");
    }
  };

  // Group reminders
  const missed: typeof reminders = [];
  const today: typeof reminders = [];
  const tomorrowGroup: typeof reminders = [];
  const thisWeek: typeof reminders = [];

  reminders.forEach((item) => {
    if (item.reminder.completed) return;

    const remDate = new Date(item.reminder.datetime);
    const remDateStr = remDate.toDateString();

    if (remDate < now && remDateStr !== todayStr) {
      missed.push(item);
    } else if (remDateStr === todayStr) {
      today.push(item);
    } else if (remDateStr === tomorrowStr) {
      tomorrowGroup.push(item);
    } else if (remDate >= now && remDate <= endOfWeek) {
      thisWeek.push(item);
    }
  });

  const renderReminderList = (list: typeof reminders, title: string, color: string, badgeBg: string, textCol: string, icon: any) => {
    const IconComponent = icon;
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col h-full min-h-[180px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className={`p-1 rounded-md ${badgeBg} ${textCol}`}>
              <IconComponent size={14} />
            </span>
            <span className="text-xs font-bold text-slate-700">{title}</span>
          </div>
          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${badgeBg} ${textCol}`}>
            {list.length}
          </span>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[250px]">
          {list.length === 0 ? (
            <div className="h-full flex items-center justify-center p-4 border border-dashed border-slate-200 rounded-xl">
              <p className="text-[10px] text-slate-400 font-semibold">No follow-ups scheduled</p>
            </div>
          ) : (
            list.map((item) => {
              const matchedLead = leads.find((l) => l.id === item.reminder.leadId);
              return (
                <div
                  key={item.reminder.id}
                  className="bg-white border border-slate-100 rounded-xl p-3 shadow-3xs flex items-start justify-between gap-2.5 hover:border-slate-300 transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 line-clamp-2">{item.reminder.text}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 font-medium">
                      <span className="font-bold text-emerald-600 truncate max-w-[120px]">
                        {item.leadName}
                      </span>
                      <span>•</span>
                      <span>{new Date(item.reminder.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    <button
                      onClick={() => onToggleComplete(item.reminder.leadId, item.reminder.id, true)}
                      className="text-[10px] bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 font-bold px-2 py-1 rounded-lg transition"
                    >
                      Done
                    </button>
                    {matchedLead && (
                      <button
                        onClick={() => onSelectLead(matchedLead)}
                        className="text-[9px] text-slate-400 hover:text-slate-600 flex items-center"
                      >
                        Profile <ChevronRight size={10} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <Bell size={18} className="text-emerald-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-800">Smart CRM Reminders & Follow-up Planner</h3>
            <p className="text-xs text-slate-500 font-medium">Auto-aggregated reminders for prompt customer followups</p>
          </div>
        </div>
      </div>

      {/* Quick Add Smart Reminder Card */}
      <div className="bg-white border border-slate-200 rounded-[20px] p-5 shadow-3xs max-w-2xl space-y-4">
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <CalendarCheck size={16} className="text-emerald-500" />
          <h4 className="text-xs font-bold text-slate-800">Quick-Schedule a New Follow-up</h4>
        </div>

        <form onSubmit={handleQuickAdd} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">Target Store Lead *</label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
              >
                <option value="">-- Choose Lead --</option>
                {leads.map(lead => (
                  <option key={lead.id} value={lead.id}>
                    {lead.businessName} ({lead.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">Reminder Instruction *</label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. Call Bright Mobiles"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500">Scheduled Date & Time *</label>
              <input
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
              />
            </div>
          </div>

          {error && (
            <div className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-3 py-1.5 rounded-xl flex items-center gap-1">
              <AlertCircle size={12} /> {error}
            </div>
          )}

          {success && (
            <div className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1">
              <Check size={12} /> Reminder scheduled successfully!
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              Schedule Smart Reminder
            </button>
          </div>
        </form>
      </div>

      {/* Grid displays */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderReminderList(missed, "Overdue", "border-red-200 bg-red-50", "bg-red-100", "text-red-700", AlertCircle)}
        {renderReminderList(today, "Today", "border-yellow-200 bg-yellow-50", "bg-yellow-100", "text-yellow-700", Clock)}
        {renderReminderList(tomorrowGroup, "Tomorrow", "border-blue-200 bg-blue-50", "bg-blue-100", "text-blue-700", CalendarIcon)}
        {renderReminderList(thisWeek, "Upcoming", "border-purple-200 bg-purple-50", "bg-purple-100", "text-purple-700", Bell)}
      </div>
    </div>
  );
}
