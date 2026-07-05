import React from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  Download,
  Award,
  Users,
  Percent,
  CheckCircle,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Lead } from '../types';

interface ReportsViewProps {
  leads: Lead[];
  allCalls: any[];
  allReminders: any[];
  isDarkMode: boolean;
}

export default function ReportsView({
  leads,
  allCalls,
  allReminders,
  isDarkMode
}: ReportsViewProps) {

  const bgCard = isDarkMode ? 'bg-[#121B2E]/90 border-[#1E2943]' : 'bg-white border-slate-100';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  const computeReportStats = () => {
    const totalLeads = leads.length;
    const clients = leads.filter(l => l.currentStatus === 'Client').length;
    const interested = leads.filter(l => l.currentStatus === 'Interested').length;
    const rejected = leads.filter(l => l.currentStatus === 'Rejected').length;
    const followups = leads.filter(l => l.currentStatus === 'Called').length;
    const newLeads = leads.filter(l => l.currentStatus === 'New Lead').length;
    const meetings = leads.filter(l => l.currentStatus === 'Meeting').length;

    // Conversion rate
    const conversion = totalLeads > 0 ? ((clients / totalLeads) * 100).toFixed(1) : '0';

    // Group by niche category
    const categoryCounts: { [key: string]: number } = {};
    leads.forEach(l => {
      categoryCounts[l.category] = (categoryCounts[l.category] || 0) + 1;
    });

    const categoriesBreakdown = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
      pct: totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(0) : '0'
    })).sort((a, b) => b.count - a.count);

    // Group by source channel
    const sourceCounts: { [key: string]: number } = {};
    leads.forEach(l => {
      sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1;
    });

    const sourceBreakdown = Object.entries(sourceCounts).map(([name, count]) => ({
      name,
      count,
      pct: totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(0) : '0'
    }));

    return {
      totalLeads,
      clients,
      interested,
      rejected,
      followups,
      newLeads,
      meetings,
      conversion,
      categoriesBreakdown,
      sourceBreakdown
    };
  };

  const report = computeReportStats();

  const handleSimulateCSVDownload = (reportType: string) => {
    alert(`CSV Export Successful!\n\nDownloaded standard-format wholesale conversion logs for: "${reportType}"\n- Rows: ${leads.length}\n- Columns: ID, Store Name, Niche, GPS coordinates, Call Outcome, Date added.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className={`text-base font-bold ${textPrimary}`}>Wholesale Conversion Reports</h2>
          <p className="text-xs text-slate-400 font-medium">Downloadable CSV worksheets and pipeline statistics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric Summaries card */}
        <div className={`border p-5 rounded-[20px] shadow-3xs ${bgCard}`}>
          <h3 className={`text-sm font-bold pb-2 border-b border-slate-50 dark:border-[#1E2943] ${textPrimary}`}>
            Funnel Conversion Summary
          </h3>
          
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Total Leads Entered:</span>
              <span className={`font-bold ${textPrimary}`}>{report.totalLeads}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">New Uncalled Leads:</span>
              <span className="font-bold text-violet-500">{report.newLeads}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Follow-up Status:</span>
              <span className="font-bold text-amber-500">{report.followups}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Meeting Scheduled:</span>
              <span className="font-bold text-indigo-500">{report.meetings}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Interested Responses:</span>
              <span className="font-bold text-emerald-500">{report.interested}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Closed Deal Clients:</span>
              <span className="font-bold text-sky-500">{report.clients}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Refused/Rejected Leads:</span>
              <span className="font-bold text-rose-500">{report.rejected}</span>
            </div>

            <div className="pt-3 border-t border-slate-50 dark:border-[#1E2943] flex justify-between items-center text-sm font-bold">
              <span className={`${textPrimary}`}>Overall Conversion:</span>
              <span className="text-emerald-500 font-extrabold">{report.conversion}%</span>
            </div>
          </div>
        </div>

        {/* Niche Breakdown Card */}
        <div className={`border p-5 rounded-[20px] shadow-3xs ${bgCard}`}>
          <h3 className={`text-sm font-bold pb-2 border-b border-slate-50 dark:border-[#1E2943] ${textPrimary}`}>
            Store Niche Distribution
          </h3>

          <div className="mt-4 space-y-3 overflow-y-auto max-h-[220px]">
            {report.categoriesBreakdown.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No store niches registered.</div>
            ) : (
              report.categoriesBreakdown.map((cat) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className={`${textPrimary}`}>{cat.name}</span>
                    <span className="text-slate-400 font-mono">{cat.count} stores ({cat.pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full" 
                      style={{ width: `${cat.pct}%` }} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lead Source Breakdown Card */}
        <div className={`border p-5 rounded-[20px] shadow-3xs ${bgCard}`}>
          <h3 className={`text-sm font-bold pb-2 border-b border-slate-50 dark:border-[#1E2943] ${textPrimary}`}>
            Acquisition Channels
          </h3>

          <div className="mt-4 space-y-3">
            {report.sourceBreakdown.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No sources logged.</div>
            ) : (
              report.sourceBreakdown.map((src) => (
                <div key={src.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className={`${textPrimary}`}>{src.name}</span>
                    <span className="text-slate-400 font-mono">{src.count} ({src.pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="bg-violet-500 h-full rounded-full" 
                      style={{ width: `${src.pct}%` }} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* CSV Downloader Center */}
      <div className={`border p-6 rounded-[24px] shadow-3xs ${bgCard}`}>
        <h3 className={`text-sm font-bold mb-4 ${textPrimary}`}>Administrative Export Suite</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 flex flex-col justify-between">
            <div>
              <FileText className="text-emerald-500" size={18} />
              <h4 className={`text-xs font-bold mt-1 ${textPrimary}`}>Wholesale Leads CSV</h4>
              <p className="text-[10px] text-slate-400 font-medium">Standard Attio-format contact lists for all tracked businesses.</p>
            </div>
            <button
              onClick={() => handleSimulateCSVDownload("All Wholesale Leads")}
              className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Download size={12} /> Download CSV
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 flex flex-col justify-between">
            <div>
              <FileText className="text-violet-500" size={18} />
              <h4 className={`text-xs font-bold mt-1 ${textPrimary}`}>Call History Transcripts</h4>
              <p className="text-[10px] text-slate-400 font-medium">Log file containing duration, outcomes, date, and user voice refs.</p>
            </div>
            <button
              onClick={() => handleSimulateCSVDownload("Cold Calling Log Transcripts")}
              className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Download size={12} /> Download CSV
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 flex flex-col justify-between">
            <div>
              <FileText className="text-blue-500" size={18} />
              <h4 className={`text-xs font-bold mt-1 ${textPrimary}`}>Scheduled Follow Ups</h4>
              <p className="text-[10px] text-slate-400 font-medium">List of overdue, today's, and future reminders formatted for Excel.</p>
            </div>
            <button
              onClick={() => handleSimulateCSVDownload("Scheduled Follow Ups")}
              className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Download size={12} /> Download CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
