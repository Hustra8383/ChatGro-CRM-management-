import React from 'react';
import { motion } from 'motion/react';
import {
  Search,
  MapPin,
  Phone,
  MessageSquare,
  Copy,
  Pencil,
  Trash2,
  Star,
  ExternalLink,
  Plus
} from 'lucide-react';
import { Lead } from '../types';

interface LeadsViewProps {
  leads: Lead[];
  sortedAndFilteredLeads: Lead[];
  pinnedLeadIds: string[];
  togglePinLead: (leadId: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
  dateFilter: string;
  setDateFilter: (filter: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  userLocation: { lat: number; lng: number } | null;
  handleRequestUserLocation: () => void;
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  formatDistance: (dist: number) => string;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  setSelectedLead: (lead: Lead) => void;
  setIsModalOpen: (open: boolean) => void;
  setLeadToDelete: (lead: Lead) => void;
  getUniqueCategories: () => string[];
  isDarkMode: boolean;
  showOnlyPinned?: boolean;
}

export default function LeadsView({
  leads,
  sortedAndFilteredLeads,
  pinnedLeadIds,
  togglePinLead,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  dateFilter,
  setDateFilter,
  sortBy,
  setSortBy,
  userLocation,
  handleRequestUserLocation,
  calculateDistance,
  formatDistance,
  showToast,
  setSelectedLead,
  setIsModalOpen,
  setLeadToDelete,
  getUniqueCategories,
  isDarkMode,
  showOnlyPinned = false
}: LeadsViewProps) {

  // Colors based on theme
  const bgCard = isDarkMode ? 'bg-[#121B2E]/90 border-[#1E2943]' : 'bg-white border-slate-100';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  // Filter out non-pinned if showOnlyPinned is true
  const listToRender = sortedAndFilteredLeads.filter(lead => {
    if (showOnlyPinned) return pinnedLeadIds.includes(lead.id);
    return true;
  });

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'New Lead':
        return 'bg-violet-500/10 text-violet-500 border-violet-500/20';
      case 'Called':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Interested':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Meeting':
        return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'Client':
        return 'bg-sky-500/10 text-sky-500 border-sky-500/20';
      case 'Rejected':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getInitialsGradient = (name: string) => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradients = [
      'from-emerald-500 to-teal-400',
      'from-blue-500 to-indigo-500',
      'from-violet-500 to-purple-500',
      'from-pink-500 to-rose-500',
      'from-orange-500 to-amber-500'
    ];
    return gradients[hash % gradients.length];
  };

  return (
    <div className="space-y-4">
      {/* Header Panel */}
      <div className={`p-4 rounded-[20px] border shadow-xs ${bgCard}`}>
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={14} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search store name, phone, niche, owner..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-[#1E2943] bg-slate-50/50 dark:bg-slate-900/50 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Quick Filter dropdown triggers */}
          <div className="flex flex-wrap gap-2.5 w-full lg:w-auto justify-start lg:justify-end items-center">
            {/* Status Stage Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stage:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 dark:border-[#1E2943] bg-white dark:bg-[#161D2F] text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden"
              >
                <option value="All">All Stages</option>
                <option value="New Lead">New Lead</option>
                <option value="Called">Follow Up / Called</option>
                <option value="Interested">Interested</option>
                <option value="Meeting">Meeting</option>
                <option value="Client">Closed Client</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Niche Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Niche:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 dark:border-[#1E2943] bg-white dark:bg-[#161D2F] text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden"
              >
                <option value="All">All Niches</option>
                {getUniqueCategories().filter(c => c !== 'All').map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date:</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 dark:border-[#1E2943] bg-white dark:bg-[#161D2F] text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden"
              >
                <option value="All">All Time</option>
                <option value="Today">Registered Today</option>
                <option value="Yesterday">Registered Yesterday</option>
                <option value="Week">Registered This Week</option>
                <option value="Month">Registered This Month</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 dark:border-[#1E2943] bg-white dark:bg-[#161D2F] text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name-asc">Store A-Z</option>
                <option value="name-desc">Store Z-A</option>
                <option value="nearest">Nearest GPS 📍</option>
              </select>
            </div>

            {sortBy === 'nearest' && !userLocation && (
              <button
                type="button"
                onClick={handleRequestUserLocation}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <MapPin size={11} />
                Get GPS
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pinned vs All Leads Tab headers (if showOnlyPinned isn't set, we can show a nice title) */}
      <div className="flex justify-between items-center px-1">
        <h3 className={`text-xs font-bold uppercase tracking-wider ${textSecondary}`}>
          {showOnlyPinned ? `Pinned Leads directory (${listToRender.length})` : `Store Directory Profile Cards (${listToRender.length})`}
        </h3>
        
        {!showOnlyPinned && (
          <p className="text-[10px] text-slate-400 font-medium">Click card line for premium side drawer details</p>
        )}
      </div>

      {/* Leads Cards Grid (Rounded Card Rows instead of Boring Tables!) */}
      <div className="space-y-3.5">
        {listToRender.length === 0 ? (
          <div className={`p-16 border rounded-[24px] text-center flex flex-col items-center justify-center ${bgCard}`}>
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-400 mb-4 border border-dashed border-slate-200 dark:border-slate-800">
              <Star size={24} />
            </div>
            <h4 className={`text-sm font-bold ${textPrimary}`}>No Matching Store Records Found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Adjust your filters above or register a new store lead in your authorized workspace to start converted calling.
            </p>
            <button
              onClick={() => {
                setSelectedLead(null as any);
                setIsModalOpen(true);
              }}
              className="mt-5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl text-xs font-bold hover:shadow-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} /> Register Store Lead
            </button>
          </div>
        ) : (
          listToRender.map((lead) => {
            const initials = lead.businessName ? lead.businessName.substring(0, 2).toUpperCase() : 'ST';
            const isPinned = pinnedLeadIds.includes(lead.id);
            const gradientClass = getInitialsGradient(lead.businessName);

            return (
              <motion.div
                key={lead.id}
                layoutId={`lead-card-${lead.id}`}
                whileHover={{ y: -2, scale: 1.005 }}
                className={`border rounded-[18px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200 relative group cursor-pointer shadow-3xs ${bgCard}`}
                onClick={(e) => {
                  // If target is inside a button/link, don't open details drawer
                  const target = e.target as HTMLElement;
                  if (target.closest('.interactive-action')) {
                    return;
                  }
                  setSelectedLead(lead);
                  setIsModalOpen(true);
                }}
              >
                {/* Visual outline highlight */}
                <div className="absolute inset-x-0 top-0 h-[2px] bg-emerald-500 rounded-t-[18px] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 pointer-events-none" />

                {/* Left side: Avatar & Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-11 h-11 bg-gradient-to-tr ${gradientClass} text-white font-extrabold text-sm rounded-xl flex items-center justify-center shrink-0 shadow-xs relative`}>
                    {initials}
                    {isPinned && (
                      <span className="absolute -top-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full border border-white">
                        <Star size={8} fill="currentColor" />
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`font-bold text-sm tracking-tight truncate group-hover:text-emerald-500 transition-colors ${textPrimary}`}>
                        {lead.businessName}
                      </h4>
                      {userLocation && (lead.lat !== undefined || lead.latitude !== undefined) && (lead.lng !== undefined || lead.longitude !== undefined) && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[9px] font-bold shrink-0">
                          <MapPin size={9} />
                          {formatDistance(calculateDistance(
                            userLocation.lat,
                            userLocation.lng,
                            lead.lat !== undefined ? lead.lat : lead.latitude!,
                            lead.lng !== undefined ? lead.lng : lead.longitude!
                          ))}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-semibold truncate flex items-center gap-1">
                      <span>Owner: {lead.ownerName || '—'}</span>
                      <span>•</span>
                      <span className="font-mono">{lead.location || 'No physical location'}</span>
                    </p>
                  </div>
                </div>

                {/* Center side: Niche & Phone */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 shrink-0 w-full sm:w-auto">
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-[#1E2943] text-slate-500 dark:text-slate-300 text-[9px] font-bold rounded-md uppercase tracking-wider border border-slate-200 dark:border-[#2A3755]">
                      {lead.category}
                    </span>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{lead.source}</p>
                  </div>

                  <div className="space-y-0.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                    <p className="font-bold">{lead.mobileNumber}</p>
                    {lead.whatsappNumber && (
                      <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                        <MessageSquare size={10} fill="currentColor" /> WA Active
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${getStatusBadgeStyles(lead.currentStatus)}`}>
                      {lead.currentStatus === 'Client' ? 'Closed Client' : lead.currentStatus === 'Called' ? 'Follow Up' : lead.currentStatus}
                    </span>
                  </div>
                </div>

                {/* Right side: Quick Actions */}
                <div className="flex items-center justify-end gap-1.5 self-stretch sm:self-auto border-t sm:border-t-0 pt-2.5 sm:pt-0 mt-1 sm:mt-0 border-slate-100 dark:border-[#1E2943]">
                  {/* Pin Lead */}
                  <button
                    onClick={() => togglePinLead(lead.id)}
                    title={isPinned ? "Unpin Lead" : "Pin Lead"}
                    className={`interactive-action p-2 rounded-xl transition ${
                      isPinned 
                        ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' 
                        : 'hover:bg-slate-100 dark:hover:bg-[#1E2943] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Star size={13} fill={isPinned ? "currentColor" : "none"} />
                  </button>

                  {/* Call Business */}
                  <a
                    href={`tel:${lead.mobileNumber}`}
                    title="Direct call"
                    className="interactive-action p-2 hover:bg-slate-150 dark:hover:bg-[#1E2943] text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition"
                  >
                    <Phone size={13} />
                  </a>

                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/${lead.whatsappNumber || lead.mobileNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="WhatsApp Business chat"
                    className="interactive-action p-2 hover:bg-slate-150 dark:hover:bg-[#1E2943] text-slate-400 hover:text-emerald-500 rounded-xl transition"
                  >
                    <ExternalLink size={13} />
                  </a>

                  {/* Copy Number */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(lead.mobileNumber);
                      showToast('Copied phone number to clipboard', 'success');
                    }}
                    title="Copy to clipboard"
                    className="interactive-action p-2 hover:bg-slate-150 dark:hover:bg-[#1E2943] text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition"
                  >
                    <Copy size={13} />
                  </button>

                  {/* Edit Pencil */}
                  <button
                    onClick={() => {
                      setSelectedLead(lead);
                      setIsModalOpen(true);
                    }}
                    title="Edit lead details"
                    className="interactive-action p-2 hover:bg-slate-150 dark:hover:bg-[#1E2943] text-slate-400 hover:text-blue-500 rounded-xl transition"
                  >
                    <Pencil size={13} />
                  </button>

                  {/* Delete Trash */}
                  <button
                    onClick={() => setLeadToDelete(lead)}
                    title="Delete store profile record"
                    className="interactive-action p-2 hover:bg-slate-150 dark:hover:bg-[#1E2943] text-slate-400 hover:text-rose-500 rounded-xl transition"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
