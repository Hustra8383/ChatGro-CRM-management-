import React from 'react';
import { Lead } from '../types';
import { ShoppingBag, PhoneCall, Heart, Calendar, Award, XCircle, ArrowRight } from 'lucide-react';

interface PipelineBoardProps {
  leads: Lead[];
  onMoveLead: (leadId: string, newStatus: Lead['currentStatus']) => void;
  onSelectLead: (lead: Lead) => void;
}

const STAGES: { key: Lead['currentStatus']; label: string; color: string; icon: any }[] = [
  { key: 'New Lead', label: 'New Lead', color: 'bg-blue-50 border-blue-200 text-blue-700', icon: ShoppingBag },
  { key: 'Called', label: 'Follow Up / Called', color: 'bg-amber-50 border-amber-200 text-amber-700', icon: PhoneCall },
  { key: 'Interested', label: 'Interested', color: 'bg-green-50 border-green-200 text-green-700', icon: Heart },
  { key: 'Meeting', label: 'Meeting Scheduled', color: 'bg-purple-50 border-purple-200 text-purple-700', icon: Calendar },
  { key: 'Client', label: 'Closed Client', color: 'bg-purple-50 border-purple-200 text-purple-700', icon: Award },
  { key: 'Rejected', label: 'Rejected', color: 'bg-red-50 border-red-200 text-red-700', icon: XCircle },
];

export default function PipelineBoard({ leads, onMoveLead, onSelectLead }: PipelineBoardProps) {
  
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, stage: Lead['currentStatus']) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      onMoveLead(id, stage);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => {
        const stageLeads = leads.filter((l) => l.currentStatus === stage.key);
        const StageIcon = stage.icon;

        return (
          <div
            key={stage.key}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.key)}
            className="flex flex-col min-h-[500px] w-full rounded-2xl bg-slate-50 border border-slate-200 p-3 min-w-[200px]"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-1.5">
                <span className={`p-1 rounded-md ${stage.color}`}>
                  <StageIcon size={14} />
                </span>
                <span className="text-sm font-semibold text-slate-700">{stage.label}</span>
              </div>
              <span className="text-xs font-mono font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                {stageLeads.length}
              </span>
            </div>

            {/* List */}
            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
              {stageLeads.length === 0 ? (
                <div className="h-full border border-dashed border-slate-200 rounded-xl flex items-center justify-center p-6 text-center">
                  <p className="text-xs text-slate-400 font-medium">Drag leads here</p>
                </div>
              ) : (
                stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className="p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-xs transition duration-150 cursor-grab active:cursor-grabbing group relative"
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                        {lead.businessName}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">{lead.ownerName || 'No Owner Name'}</p>
                    
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                        {lead.category}
                      </span>
                      <button
                        onClick={() => onSelectLead(lead)}
                        className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-0.5"
                      >
                        Details
                        <ArrowRight size={10} className="transform group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
