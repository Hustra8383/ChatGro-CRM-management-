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
import { jsPDF } from 'jspdf';

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

  const handleDownloadPDF = (reportType: string) => {
    const doc = new jsPDF();
    
    // Set Document metadata
    doc.setProperties({
      title: `${reportType} Report`,
      subject: 'ChatGro CRM Wholesale Report',
      author: 'ChatGro CRM',
    });

    // Draw Header Accent Band
    doc.setFillColor(18, 43, 37); // Deep brand green (#122B25)
    doc.rect(0, 0, 210, 35, 'F');
    
    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('CHATGRO CRM', 15, 18);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Enterprise Wholesale Analytics Hub', 15, 25);
    
    const dateStr = new Date().toLocaleString();
    doc.text(`Generated: ${dateStr}`, 135, 25);
    
    // Title
    doc.setTextColor(33, 41, 54);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(reportType.toUpperCase(), 15, 48);
    
    // Horizontal Divider Line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 52, 195, 52);

    let y = 60;

    if (reportType === "All Wholesale Leads") {
      // Table Headers
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('Store Name', 15, y);
      doc.text('Owner', 65, y);
      doc.text('Mobile', 100, y);
      doc.text('Niche/Category', 135, y);
      doc.text('Status', 175, y);
      
      y += 4;
      doc.line(15, y, 195, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);

      if (leads.length === 0) {
        doc.text('No leads registered in database.', 15, y);
      } else {
        leads.forEach((l) => {
          if (y > 275) {
            doc.addPage();
            y = 20;
            // Draw small header on next page
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139);
            doc.text('Store Name', 15, y);
            doc.text('Owner', 65, y);
            doc.text('Mobile', 100, y);
            doc.text('Niche/Category', 135, y);
            doc.text('Status', 175, y);
            y += 4;
            doc.line(15, y, 195, y);
            y += 6;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 41, 59);
          }

          const name = l.businessName || 'N/A';
          const owner = l.ownerName || 'N/A';
          const mob = l.mobileNumber || 'N/A';
          const cat = l.category || 'N/A';
          const stat = l.currentStatus || 'N/A';

          doc.text(name.substring(0, 24), 15, y);
          doc.text(owner.substring(0, 16), 65, y);
          doc.text(mob, 100, y);
          doc.text(cat, 135, y);
          doc.text(stat, 175, y);

          y += 8;
        });
      }
    } else if (reportType === "Cold Calling Log Transcripts") {
      // Table Headers
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('Store Name', 15, y);
      doc.text('Date', 55, y);
      doc.text('Status', 90, y);
      doc.text('Duration', 115, y);
      doc.text('Call Transcript / Notes Summary', 135, y);
      
      y += 4;
      doc.line(15, y, 195, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);

      if (allCalls.length === 0) {
        doc.text('No cold call recordings or transcripts logged.', 15, y);
      } else {
        allCalls.forEach((c) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
            // Headers
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139);
            doc.text('Store Name', 15, y);
            doc.text('Date', 55, y);
            doc.text('Status', 90, y);
            doc.text('Duration', 115, y);
            doc.text('Call Transcript / Notes Summary', 135, y);
            y += 4;
            doc.line(15, y, 195, y);
            y += 6;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 41, 59);
          }

          const matchingLead = leads.find(l => l.id === c.leadId);
          const storeName = matchingLead ? matchingLead.businessName : 'Unknown Store';
          const dateVal = c.date ? new Date(c.date).toLocaleDateString() : 'N/A';
          const statusVal = c.status || 'N/A';
          const durVal = `${c.duration || 0}s`;
          const notesVal = c.notes || 'No call notes.';

          doc.text(storeName.substring(0, 18), 15, y);
          doc.text(dateVal, 55, y);
          doc.text(statusVal, 90, y);
          doc.text(durVal, 115, y);
          
          // Wrap text for notes
          const splitNotes = doc.splitTextToSize(notesVal, 55);
          doc.text(splitNotes, 135, y);

          // Adjust y according to notes length
          const notesLinesHeight = splitNotes.length * 4;
          y += Math.max(8, notesLinesHeight + 2);
        });
      }
    } else if (reportType === "Scheduled Follow Ups") {
      // Table Headers
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text('Store Name', 15, y);
      doc.text('Date & Time', 60, y);
      doc.text('Reminder Instruction Details', 105, y);
      doc.text('Status', 175, y);
      
      y += 4;
      doc.line(15, y, 195, y);
      y += 6;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);

      if (allReminders.length === 0) {
        doc.text('No scheduled follow ups registered.', 15, y);
      } else {
        allReminders.forEach((item) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
            // Headers
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(100, 116, 139);
            doc.text('Store Name', 15, y);
            doc.text('Date & Time', 60, y);
            doc.text('Reminder Instruction Details', 105, y);
            doc.text('Status', 175, y);
            y += 4;
            doc.line(15, y, 195, y);
            y += 6;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(30, 41, 59);
          }

          const storeName = item.leadName || 'Unknown Store';
          const dateVal = item.reminder.datetime ? new Date(item.reminder.datetime).toLocaleString() : 'N/A';
          const descVal = item.reminder.text || 'N/A';
          const statusVal = item.reminder.completed ? 'COMPLETED' : 'PENDING';

          doc.text(storeName.substring(0, 20), 15, y);
          doc.text(dateVal, 60, y);
          
          // Wrap text for description
          const splitDesc = doc.splitTextToSize(descVal, 65);
          doc.text(splitDesc, 105, y);
          
          doc.text(statusVal, 175, y);

          const descHeight = splitDesc.length * 4;
          y += Math.max(8, descHeight + 2);
        });
      }
    }

    // Save PDF
    const filename = `${reportType.toLowerCase().replace(/\s+/g, '_')}_report.pdf`;
    doc.save(filename);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className={`text-base font-bold ${textPrimary}`}>Wholesale Conversion Reports</h2>
          <p className="text-xs text-slate-400 font-medium">Downloadable PDF reports and pipeline statistics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Funnel Conversion Summary */}
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

        {/* Store Niche Distribution */}
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

      {/* CSV/PDF Downloader Center */}
      <div className={`border p-6 rounded-[24px] shadow-3xs ${bgCard}`}>
        <h3 className={`text-sm font-bold mb-4 ${textPrimary}`}>Administrative Export Suite</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 flex flex-col justify-between">
            <div>
              <FileText className="text-emerald-500" size={18} />
              <h4 className={`text-xs font-bold mt-1 ${textPrimary}`}>Wholesale Leads Report</h4>
              <p className="text-[10px] text-slate-400 font-medium">Complete styled catalog of all wholesale stores, categories, contact numbers, and lead statuses.</p>
            </div>
            <button
              onClick={() => handleDownloadPDF("All Wholesale Leads")}
              className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Download size={12} /> Download PDF
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 flex flex-col justify-between">
            <div>
              <FileText className="text-violet-500" size={18} />
              <h4 className={`text-xs font-bold mt-1 ${textPrimary}`}>Call History Transcripts</h4>
              <p className="text-[10px] text-slate-400 font-medium">Log report containing call dates, outcome status, duration, and transcribed summaries.</p>
            </div>
            <button
              onClick={() => handleDownloadPDF("Cold Calling Log Transcripts")}
              className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Download size={12} /> Download PDF
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 flex flex-col justify-between">
            <div>
              <FileText className="text-blue-500" size={18} />
              <h4 className={`text-xs font-bold mt-1 ${textPrimary}`}>Scheduled Follow Ups</h4>
              <p className="text-[10px] text-slate-400 font-medium">Chronological itinerary listing upcoming reminders, target businesses, and pending actions.</p>
            </div>
            <button
              onClick={() => handleDownloadPDF("Scheduled Follow Ups")}
              className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Download size={12} /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
