import React from 'react';
import { motion } from 'motion/react';
import {
  Users,
  PhoneCall,
  Heart,
  XCircle,
  MessageSquare,
  Award,
  Calendar,
  BookOpen,
  TrendingUp,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import AnalyticsChart from './AnalyticsChart';

interface DashboardViewProps {
  stats: any;
  chartData: any[];
  leads: any[];
  allCalls: any[];
  allNotes: any[];
  allReminders: any[];
  isDarkMode: boolean;
  setCurrentTab: (tab: string) => void;
}

export default function DashboardView({
  stats,
  chartData,
  leads,
  allCalls,
  allNotes,
  allReminders,
  isDarkMode,
  setCurrentTab
}: DashboardViewProps) {
  
  // Custom theme colors based on dark mode
  const bgCard = isDarkMode ? 'bg-[#121B2E]/90 border-[#1E2943]' : 'bg-white border-slate-100';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  const kpis = [
    {
      id: 'leads',
      label: "Total Leads",
      value: stats.totalLeads,
      subtext: "Store profiles tracked",
      trend: "+12% this month",
      trendType: "up",
      icon: Users,
      colorClass: "bg-blue-500/10 text-blue-500",
      gradient: "from-blue-500/5 to-cyan-500/5"
    },
    {
      id: 'calls',
      label: "Today's Calls",
      value: stats.todayCalls,
      subtext: `Avg: ${stats.avgCallsPerDay}/day`,
      trend: "Daily target active",
      trendType: "neutral",
      icon: PhoneCall,
      colorClass: "bg-amber-500/10 text-amber-500",
      gradient: "from-amber-500/5 to-orange-500/5"
    },
    {
      id: 'interested',
      label: "Interested Leads",
      value: stats.interested,
      subtext: `${stats.interestedRate}% conversion rate`,
      trend: "+5 new today",
      trendType: "up",
      icon: Heart,
      colorClass: "bg-emerald-500/10 text-emerald-500",
      gradient: "from-emerald-500/5 to-teal-500/5"
    },
    {
      id: 'rejected',
      label: "Rejected Leads",
      value: stats.rejected,
      subtext: `${stats.rejectedRate}% refused rate`,
      trend: "-2% from last week",
      trendType: "down",
      icon: XCircle,
      colorClass: "bg-rose-500/10 text-rose-500",
      gradient: "from-rose-500/5 to-red-500/5"
    },
    {
      id: 'reminders',
      label: "Followups Today",
      value: stats.activeRemindersToday,
      subtext: "Action required today",
      trend: `${stats.pendingFollowups} future scheduled`,
      trendType: "neutral",
      icon: MessageSquare,
      colorClass: "bg-violet-500/10 text-violet-500",
      gradient: "from-violet-500/5 to-purple-500/5"
    },
    {
      id: 'clients',
      label: "Closed Clients",
      value: stats.clientsCount,
      subtext: `${stats.conversionRate}% overall closed`,
      trend: "Top sales milestone",
      trendType: "up",
      icon: Award,
      colorClass: "bg-sky-500/10 text-sky-500",
      gradient: "from-sky-500/5 to-indigo-500/5"
    },
    {
      id: 'revenue',
      label: "Estimated Revenue",
      value: `$${(stats.clientsCount * 499).toLocaleString()}`,
      subtext: "Based on $499 standard setup",
      trend: "SaaS pipeline active",
      trendType: "up",
      icon: TrendingUp,
      colorClass: "bg-teal-500/10 text-teal-500",
      gradient: "from-teal-500/5 to-emerald-500/5"
    },
    {
      id: 'records',
      label: "Total Database Records",
      value: stats.totalRecords,
      subtext: "Fully synchronized live",
      trend: "100% healthy",
      trendType: "up",
      icon: BookOpen,
      colorClass: "bg-slate-500/10 text-slate-400",
      gradient: "from-slate-500/5 to-slate-400/5"
    }
  ];

  // Get recent 4 notes/logs for a live activity stream
  const sortedNotes = [...allNotes]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-[24px] border relative overflow-hidden bg-gradient-to-r ${
          isDarkMode 
            ? 'from-[#111A2E] via-[#12233F] to-[#121B2E] border-[#1E2943]' 
            : 'from-slate-900 via-slate-800 to-slate-900 border-slate-800 text-white'
        }`}
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-2.5 py-1 rounded-full uppercase tracking-widest inline-flex items-center gap-1">
            <Sparkles size={10} /> Startup Workspace Active
          </span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Optimize your wholesale cold-call conversions with Attio CRM
          </h2>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            Real-time pipeline tracking, coordinate-based offline route planning, WhatsApp proposal sharing, and persistent cloud logs to accelerate store registration.
          </p>
        </div>
      </motion.div>

      {/* KPI Bento Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4"
      >
        {kpis.map((kpi) => {
          const IconComponent = kpi.icon;
          return (
            <motion.div
              key={kpi.id}
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.01 }}
              className={`border p-5 rounded-[20px] shadow-xs flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden group ${bgCard}`}
              onClick={() => {
                if (kpi.id === 'leads') setCurrentTab('leads');
                if (kpi.id === 'calls') setCurrentTab('calls');
                if (kpi.id === 'interested') setCurrentTab('leads');
                if (kpi.id === 'reminders') setCurrentTab('reminders');
                if (kpi.id === 'clients') setCurrentTab('pipeline');
              }}
            >
              {/* Soft subtle gradient highlight */}
              <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

              <div className="flex justify-between items-start relative z-10">
                <span className={`text-[10px] uppercase tracking-wider font-bold ${textSecondary}`}>
                  {kpi.label}
                </span>
                <span className={`p-2 rounded-xl transition-transform group-hover:scale-110 duration-200 ${kpi.colorClass}`}>
                  <IconComponent size={16} />
                </span>
              </div>

              <div className="mt-4 relative z-10">
                <p className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${textPrimary}`}>
                  {kpi.value}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <p className={`text-[10px] font-bold ${textSecondary}`}>{kpi.subtext}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                    kpi.trendType === 'up' ? 'bg-emerald-500/10 text-emerald-500' :
                    kpi.trendType === 'down' ? 'bg-rose-500/10 text-rose-500' :
                    'bg-slate-500/10 text-slate-400'
                  }`}>
                    {kpi.trend}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Chart and Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AnalyticsChart data={chartData} />
        </div>

        {/* Live Activity Logs */}
        <div className={`border rounded-[20px] p-5 shadow-2xs flex flex-col justify-between ${bgCard}`}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E2943]">
              <div>
                <h3 className={`text-sm font-bold ${textPrimary}`}>Recent Workspace Activity</h3>
                <p className="text-[10px] text-slate-400 font-medium">Automatic system & audit logs</p>
              </div>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            </div>

            <div className="mt-4 space-y-4">
              {sortedNotes.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No logged notes or status changes in database yet.
                </div>
              ) : (
                sortedNotes.map((note) => {
                  const isSystem = note.text.startsWith('[System');
                  const cleanText = note.text.replace(/\[System Log:\s*\w+\]/, '').trim();
                  return (
                    <div key={note.id} className="flex gap-3 text-xs">
                      <div className="mt-0.5 shrink-0">
                        {isSystem ? (
                          <div className="w-6 h-6 bg-slate-100 dark:bg-[#1E2943] text-slate-600 dark:text-slate-300 rounded-full flex items-center justify-center">
                            <Clock size={11} />
                          </div>
                        ) : (
                          <div className="w-6 h-6 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center font-bold font-mono">
                            N
                          </div>
                        )}
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <p className={`font-semibold text-[11px] truncate ${textPrimary}`}>{cleanText}</p>
                        <p className="text-[9px] text-slate-400 font-medium font-mono">
                          {new Date(note.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50 dark:border-[#1E2943] mt-4">
            <button
              onClick={() => setCurrentTab('reports')}
              className="w-full py-2 bg-slate-50 dark:bg-[#1E2943] hover:bg-slate-100 dark:hover:bg-[#25324E] text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
            >
              View System Logs
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Shared Workspace Strip */}
      <div className={`p-4 rounded-xl border flex items-center justify-between flex-wrap gap-2 ${
        isDarkMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-100'
      }`}>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="text-emerald-500" size={16} />
          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Enterprise Attio Sync Active</p>
        </div>
        <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono text-right">
          Real-time synchronized across all authorized sales agents
        </p>
      </div>
    </div>
  );
}
