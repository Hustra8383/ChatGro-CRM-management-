import React from 'react';
import { motion } from 'motion/react';
import {
  Phone,
  Clock,
  Play,
  Volume2,
  Calendar,
  AlertCircle,
  ExternalLink,
  PhoneCall,
  User,
  Heart,
  XCircle,
  Award
} from 'lucide-react';
import { CallRecord, Lead } from '../types';

interface CallsViewProps {
  allCalls: CallRecord[];
  leads: Lead[];
  isDarkMode: boolean;
  setSelectedLead: (lead: Lead) => void;
  setIsModalOpen: (open: boolean) => void;
}

export default function CallsView({
  allCalls,
  leads,
  isDarkMode,
  setSelectedLead,
  setIsModalOpen
}: CallsViewProps) {

  const bgCard = isDarkMode ? 'bg-[#121B2E]/90 border-[#1E2943]' : 'bg-white border-slate-100';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  const sortedCalls = [...allCalls].sort(
    (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Interested':
        return <Heart size={12} className="text-emerald-500" fill="currentColor" />;
      case 'Rejected':
        return <XCircle size={12} className="text-rose-500" />;
      case 'Meeting':
        return <Calendar size={12} className="text-indigo-500" />;
      case 'Client':
        return <Award size={12} className="text-sky-500" />;
      default:
        return <PhoneCall size={12} className="text-amber-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Interested':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'Meeting':
        return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'Client':
        return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
      default:
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className={`text-base font-bold ${textPrimary}`}>Call logs & Voice Recordings Feed</h2>
          <p className="text-xs text-slate-400 font-medium">Chronological cold calling outcomes across your territory</p>
        </div>
      </div>

      {sortedCalls.length === 0 ? (
        <div className={`p-16 border rounded-[24px] text-center flex flex-col items-center justify-center ${bgCard}`}>
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-400 mb-4 border border-dashed border-slate-200 dark:border-slate-800">
            <Phone size={24} />
          </div>
          <h4 className={`text-sm font-bold ${textPrimary}`}>No Calls Registered Yet</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Call records with duration logs and voice notes appear dynamically as your agents log calls in store profiles.
          </p>
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 pl-6 space-y-6">
          {sortedCalls.map((call, index) => {
            const matchedLead = leads.find((l) => l.id === call.leadId);
            return (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                {/* Vertical Timeline Dot */}
                <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white dark:bg-[#0B0F19] border-2 border-emerald-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>

                <div className={`border rounded-[20px] p-5 shadow-3xs hover:border-slate-300 dark:hover:border-slate-700 transition duration-150 ${bgCard}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-50 dark:border-[#1E2943] pb-3 mb-3">
                    <div className="space-y-0.5">
                      {matchedLead ? (
                        <button
                          onClick={() => {
                            setSelectedLead(matchedLead);
                            setIsModalOpen(true);
                          }}
                          className="font-bold text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 text-left"
                        >
                          {matchedLead.businessName}
                          <ExternalLink size={11} />
                        </button>
                      ) : (
                        <p className={`font-bold text-sm ${textPrimary}`}>Unknown Store</p>
                      )}
                      <p className="text-[10px] text-slate-400 font-semibold font-mono">
                        {new Date(call.createdAt || call.date).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 font-bold">
                        <Clock size={11} /> {call.duration > 0 ? `${call.duration}s` : 'no duration'}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border ${getStatusBadge(call.status)}`}>
                        {getStatusIcon(call.status)}
                        {call.status}
                      </span>
                    </div>
                  </div>

                  {/* Call Notes */}
                  <div className="space-y-3">
                    <p className={`text-xs leading-relaxed font-medium ${textSecondary}`}>
                      {call.notes || "No additional call notes logged."}
                    </p>

                    {/* Audio Player Container */}
                    {call.audioUrl ? (
                      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Volume2 size={14} className="text-emerald-500 animate-bounce" />
                          <div>
                            <p className={`text-[10px] font-bold ${textPrimary}`}>{call.audioName || "voice_record.mp3"}</p>
                            <p className="text-[9px] text-slate-400 font-medium">Recorded with secure pipeline microphone</p>
                          </div>
                        </div>
                        <audio
                          src={call.audioUrl}
                          controls
                          className="h-8 max-w-full sm:w-60 focus:outline-hidden"
                        />
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 bg-slate-50/50 dark:bg-[#1E2943]/20 px-2.5 py-1.5 rounded-lg w-max max-w-full">
                        <AlertCircle size={10} /> No recorded speech attachment for this log
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
