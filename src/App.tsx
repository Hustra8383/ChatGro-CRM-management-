import React, { useState, useEffect } from 'react';
import { dbService, isSupabaseConfigured } from './dbService';
import { Lead, DailyStat, Reminder, CallRecord, Note } from './types';
import {
  Plus,
  Search,
  Filter,
  LogOut,
  Sparkles,
  PhoneCall,
  Heart,
  XCircle,
  Calendar as CalendarIcon,
  Award,
  Users,
  Grid,
  Map as MapIcon,
  BookOpen,
  Mail,
  Lock,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  Trash2,
  Pencil,
  Copy,
  Phone,
  ExternalLink,
  CheckCircle,
  MapPin,
  Bell,
  Sun,
  Moon,
  Star,
  Menu,
  ChevronLeft,
  ChevronDown,
  Check,
  Play,
  Info,
  Eye,
  ClipboardList
} from 'lucide-react';
import PipelineBoard from './components/PipelineBoard';
import AnalyticsChart from './components/AnalyticsChart';
import MapView from './components/MapView';
import CalendarView from './components/CalendarView';
import LeadModal from './components/LeadModal';
import DashboardView from './components/DashboardView';
import LeadsView from './components/LeadsView';
import CallsView from './components/CallsView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import { motion, AnimatePresence } from 'motion/react';
import chatgroLogo from './assets/images/chatgro_logo_1783251412416.jpg';

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Core CRM Data State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [allReminders, setAllReminders] = useState<{ reminder: Reminder; leadName: string }[]>([]);
  const [allCalls, setAllCalls] = useState<CallRecord[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);

  // App Layout Navigation
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  
  // Custom Workspace States
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('chatgro_theme') === 'dark';
    } catch {
      return false;
    }
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [pinnedLeadIds, setPinnedLeadIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('chatgro_pinned_leads');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const togglePinLead = (leadId: string) => {
    setPinnedLeadIds(prev => {
      const next = prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId];
      localStorage.setItem('chatgro_pinned_leads', JSON.stringify(next));
      showToast(prev.includes(leadId) ? 'Lead removed from Pinned' : 'Lead pinned to workspace', 'success');
      return next;
    });
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('chatgro_theme', next ? 'dark' : 'light');
      return next;
    });
  };
  
  // Lead Modal Controls
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // radius of Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDistance = (distInKm: number): string => {
    if (distInKm < 1) {
      return `${Math.round(distInKm * 1000)} m`;
    }
    return `${distInKm.toFixed(1)} km`;
  };

  const handleRequestUserLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.", "error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        showToast("Successfully acquired current GPS location for sorting", "success");
      },
      (err) => {
        console.error(err);
        showToast("Failed to retrieve GPS location. Please check browser permissions.", "error");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
        },
        (err) => console.log("Silent location fetch failed (expected if not permitted):", err),
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAllData = async () => {
    try {
      const fetchedLeads = await dbService.leads.getAll();
      setLeads(fetchedLeads);

      const allRem = await dbService.reminders.getAll();
      const allC = await dbService.calls.getAll();
      const allN = await dbService.notes.getAll();

      const tempReminders = allRem.map(rem => {
        const matchingLead = fetchedLeads.find(l => l.id === rem.leadId);
        return { reminder: rem, leadName: matchingLead ? matchingLead.businessName : 'Unknown Store' };
      });

      setAllReminders(tempReminders);
      setAllCalls(allC);
      setAllNotes(allN);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLeadsLoading(false);
    }
  };

  // Monitor Authentication State
  useEffect(() => {
    const unsubscribe = dbService.auth.onAuthStateChange((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen to Leads & sub-records in Real-time / Local changes
  useEffect(() => {
    if (!user) return;

    setLeadsLoading(true);
    fetchAllData();

    const unsubscribe = dbService.leads.subscribe(() => {
      fetchAllData();
    });

    return () => unsubscribe();
  }, [user]);

  // Auth Operations
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const { error } = await dbService.auth.signIn(email, password);
      if (error) {
        setAuthError(error.message || 'Failed to sign in. Please check credentials.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to sign in. Please check credentials.');
    }
  };

  const handleLogout = async () => {
    await dbService.auth.signOut();
  };

  // Move lead stage inside Kanban Board
  const handleMoveLead = async (leadId: string, newStatus: Lead['currentStatus']) => {
    try {
      await dbService.leads.update(leadId, {
        currentStatus: newStatus,
        updatedAt: new Date().toISOString()
      });
      fetchAllData();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  // Toggle Reminder completion
  const handleToggleReminderComplete = async (leadId: string, reminderId: string, completed: boolean) => {
    try {
      await dbService.reminders.update(leadId, reminderId, completed);
      fetchAllData();
    } catch (err) {
      console.error("Error toggling reminder:", err);
    }
  };

  // Dynamic Metrics Compilation (Calculated from Firestore values)
  const computeStats = () => {
    const todayStr = new Date().toLocaleDateString('en-US');
    
    const todayCalls = allCalls.filter(c => c.date === todayStr).length;
    const interested = leads.filter(l => l.currentStatus === 'Interested').length;
    const rejected = leads.filter(l => l.currentStatus === 'Rejected').length;
    
    // Reminders scheduled for today
    const activeRemindersToday = allReminders.filter(r => {
      const isCompleted = r.reminder.completed;
      const isToday = new Date(r.reminder.datetime).toDateString() === new Date().toDateString();
      return !isCompleted && isToday;
    }).length;

    const meetings = leads.filter(l => l.currentStatus === 'Meeting').length;
    const clientsCount = leads.filter(l => l.currentStatus === 'Client').length;

    // Conversion rate formulas
    const conversionRate = leads.length > 0 ? Math.round((clientsCount / leads.length) * 100) : 0;
    const interestedRate = leads.length > 0 ? Math.round((interested / leads.length) * 100) : 0;
    const rejectedRate = leads.length > 0 ? Math.round((rejected / leads.length) * 100) : 0;

    const pendingFollowups = allReminders.filter(r => !r.reminder.completed).length;
    const totalRecords = leads.length + allReminders.length + allCalls.length;

    const uniqueCallDays = new Set(allCalls.map(c => c.date)).size || 1;
    const avgCallsPerDay = Math.round((allCalls.length / uniqueCallDays) * 10) / 10;

    return {
      todayCalls,
      interested,
      rejected,
      activeRemindersToday,
      meetings,
      conversionRate,
      interestedRate,
      rejectedRate,
      clientsCount,
      pendingFollowups,
      totalRecords,
      avgCallsPerDay,
      totalLeads: leads.length
    };
  };

  const stats = computeStats();

  const handleDeleteConfirm = async () => {
    if (!leadToDelete) return;
    try {
      await dbService.leads.delete(leadToDelete.id);
      showToast('Lead business record and details deleted successfully', 'success');
      setLeadToDelete(null);
      fetchAllData();
    } catch (err) {
      console.error("Error deleting lead:", err);
      showToast('Failed to delete lead record', 'error');
    }
  };

  // Dynamic Chart Compilation
  const compileChartData = (): DailyStat[] => {
    const dateGroups: { [key: string]: DailyStat } = {};

    leads.forEach(lead => {
      const dateKey = new Date(lead.createdAt || lead.dateAdded).toISOString().slice(0, 10);
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = {
          date: dateKey,
          totalCalls: 0,
          interested: 0,
          rejected: 0,
          followups: 0,
          meetings: 0
        };
      }
    });

    allCalls.forEach(call => {
      const dateKey = new Date(call.createdAt).toISOString().slice(0, 10);
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = {
          date: dateKey,
          totalCalls: 0,
          interested: 0,
          rejected: 0,
          followups: 0,
          meetings: 0
        };
      }
      dateGroups[dateKey].totalCalls += 1;
      if (call.status === 'Interested') dateGroups[dateKey].interested += 1;
      if (call.status === 'Rejected') dateGroups[dateKey].rejected += 1;
      if (call.status === 'Meeting') dateGroups[dateKey].meetings += 1;
    });

    return Object.values(dateGroups).sort((a, b) => a.date.localeCompare(b.date));
  };

  const chartData = compileChartData();

  // Filter and Search Leads List with Advanced Date & Unified Notes search
  const filteredLeads = leads.filter((lead) => {
    const term = searchTerm.toLowerCase();
    
    const matchesProfile =
      lead.businessName.toLowerCase().includes(term) ||
      lead.ownerName.toLowerCase().includes(term) ||
      lead.mobileNumber.includes(term) ||
      lead.category.toLowerCase().includes(term);

    // Filter by note content matches
    const matchingNotes = allNotes.filter(n => n.leadId === lead.id && n.text.toLowerCase().includes(term));
    const matchesNotes = matchingNotes.length > 0;

    const matchesSearch = matchesProfile || matchesNotes;
    
    const matchesStatus = statusFilter === 'All' || lead.currentStatus === statusFilter;
    const matchesCategory = categoryFilter === 'All' || lead.category === categoryFilter;

    // Date Filter logic (Today, Yesterday, This Week, This Month)
    let matchesDate = true;
    if (dateFilter !== 'All') {
      const leadDate = new Date(lead.createdAt || lead.dateAdded);
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
      const startOfThisWeek = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      if (dateFilter === 'Today') {
        matchesDate = leadDate >= startOfToday;
      } else if (dateFilter === 'Yesterday') {
        matchesDate = leadDate >= startOfYesterday && leadDate < startOfToday;
      } else if (dateFilter === 'Week') {
        matchesDate = leadDate >= startOfThisWeek;
      } else if (dateFilter === 'Month') {
        matchesDate = leadDate >= startOfThisMonth;
      }
    }

    return matchesSearch && matchesStatus && matchesCategory && matchesDate;
  });

  const sortedAndFilteredLeads = [...filteredLeads].sort((a, b) => {
    if (sortBy === 'nearest') {
      const aLat = a.lat !== undefined ? a.lat : a.latitude;
      const aLng = a.lng !== undefined ? a.lng : a.longitude;
      const bLat = b.lat !== undefined ? b.lat : b.latitude;
      const bLng = b.lng !== undefined ? b.lng : b.longitude;

      if (userLocation && aLat !== undefined && aLng !== undefined && bLat !== undefined && bLng !== undefined) {
        return calculateDistance(userLocation.lat, userLocation.lng, aLat, aLng) -
               calculateDistance(userLocation.lat, userLocation.lng, bLat, bLng);
      }
      if (aLat !== undefined && aLng !== undefined) return -1;
      if (bLat !== undefined && bLng !== undefined) return 1;
      return 0;
    }
    if (sortBy === 'newest') {
      return new Date(b.createdAt || b.dateAdded).getTime() - new Date(a.createdAt || a.dateAdded).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt || a.dateAdded).getTime() - new Date(b.createdAt || b.dateAdded).getTime();
    }
    if (sortBy === 'name-asc') {
      return a.businessName.localeCompare(b.businessName);
    }
    if (sortBy === 'name-desc') {
      return b.businessName.localeCompare(a.businessName);
    }
    return 0;
  });

  const getUniqueCategories = (): string[] => {
    const cats = new Set(leads.map(l => l.category));
    return ['All', ...Array.from(cats) as string[]];
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="text-emerald-500 mb-4"
        >
          <RefreshCw size={36} />
        </motion.div>
        <p className="text-xs font-semibold text-slate-500 font-mono tracking-wider uppercase">Initializing Secure Workspace...</p>
      </div>
    );
  }

  // Gated Auth Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Abstract background blobs for premium feel */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-100 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-50 rounded-full blur-3xl opacity-80"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-[24px] border border-slate-100 shadow-2xl w-full max-w-md p-8 space-y-8 relative z-10"
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <img 
              src={chatgroLogo} 
              alt="ChatGro Logo" 
              className="w-16 h-16 rounded-2xl object-cover shadow-md shadow-emerald-500/20"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome to ChatGro</h1>
              <p className="text-xs text-slate-400 font-medium mt-1">
                The high-performance workspace for modern sales development.
              </p>
            </div>
          </div>

          {authError && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3.5 rounded-xl flex items-start gap-2.5 font-medium"
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{authError}</span>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 text-slate-400" size={14} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50 transition-all placeholder-slate-400 text-slate-800"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Security Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 text-slate-400" size={14} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50 transition-all placeholder-slate-400 text-slate-800"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white text-xs font-bold py-3 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              Sign In to Workspace
              <ChevronRight size={14} />
            </motion.button>
          </form>

          <div className="text-center pt-2 border-t border-slate-50">
            <span className="text-[10px] font-semibold text-slate-400 font-mono">
              SECURE DEPLOYMENT • PORT 3000
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-200 ${
      isDarkMode ? 'bg-[#0B0F19] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* 1. PREMIUM DARK COLLAPSIBLE SIDEBAR */}
      <aside 
        className={`shrink-0 z-40 transition-all duration-300 flex flex-col justify-between select-none ${
          isDarkMode ? 'bg-[#0F1424] border-r border-[#1B2541]' : 'bg-[#0F172A] border-r border-slate-900'
        } ${sidebarCollapsed ? 'w-20' : 'w-64'} md:flex hidden`}
      >
        <div className="flex flex-col flex-1">
          {/* Sidebar Brand Logo */}
          <div className="p-5 border-b border-[#222E4E]/40 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <img 
                src={chatgroLogo} 
                alt="ChatGro Logo" 
                className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-emerald-500/10 shrink-0"
                referrerPolicy="no-referrer"
              />
              {!sidebarCollapsed && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="space-y-0.5"
                >
                  <h1 className="text-xs font-bold text-white tracking-tight uppercase flex items-center gap-1.5">
                    ChatGro
                    <span className="text-[8px] bg-emerald-500/20 text-emerald-400 font-extrabold px-1 py-0.5 rounded-full">
                      CRM
                    </span>
                  </h1>
                  <p className="text-[10px] text-slate-400 font-mono">Enterprise Workspace</p>
                </motion.div>
              )}
            </div>

            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 hover:bg-slate-800/80 text-slate-400 hover:text-white rounded-lg transition"
            >
              <ChevronLeft size={14} className={`transform transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Sidebar Nav Items */}
          <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto scrollbar-none">
            {/* Core Section Title */}
            {!sidebarCollapsed && (
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">
                WORKSPACE APPS
              </p>
            )}

            {[
              { id: 'dashboard', label: 'Dashboard', icon: Grid },
              { id: 'leads', label: 'Leads Directory', icon: Users, badge: leads.length },
              { id: 'pinned', label: 'Pinned Leads', icon: Star, badge: pinnedLeadIds.length > 0 ? pinnedLeadIds.length : undefined },
              { id: 'pipeline', label: 'Sales Pipeline', icon: TrendingUp },
              { id: 'calls', label: 'Call Logs & Audio', icon: PhoneCall, badge: allCalls.length > 0 ? allCalls.length : undefined },
              { id: 'reminders', label: 'Follow Ups', icon: CalendarIcon, badge: stats.activeRemindersToday > 0 ? stats.activeRemindersToday : undefined },
              { id: 'map', label: 'Walking Map Route', icon: MapIcon }
            ].map((item) => {
              const IconComp = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition group cursor-pointer ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' 
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <IconComp size={15} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!sidebarCollapsed && item.badge !== undefined && (
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#1F2C4E] text-[#93C5FD]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Utility Space Title */}
            {!sidebarCollapsed && (
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-3 mt-5 mb-2">
                REPORTS & CONTROLS
              </p>
            )}

            {[
              { id: 'analytics', label: 'CRM Analytics', icon: Sparkles },
              { id: 'reports', label: 'Funnel Reports', icon: BookOpen },
              { id: 'settings', label: 'Workspace Settings', icon: Lock },
              { id: 'profile', label: 'User Profile', icon: Mail }
            ].map((item) => {
              const IconComp = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition group cursor-pointer ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10' 
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <IconComp size={15} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User context footer card */}
        <div className="p-4 border-t border-[#222E4E]/40 overflow-hidden shrink-0 bg-[#0A0F1D]/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                {user.email ? user.email.substring(0, 1).toUpperCase() : 'U'}
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0 text-left">
                  <p className="text-white font-bold text-[11px] truncate">{user.email}</p>
                  <p className="text-[9px] text-slate-400 font-medium">Enterprise Agent</p>
                </div>
              )}
            </div>

            {!sidebarCollapsed && (
              <button 
                onClick={handleLogout}
                title="Sign out of CRM session"
                className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition"
              >
                <LogOut size={13} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* TOP GLASSMORPHIC NAVIGATION HEADER */}
        <header className={`px-6 py-4 border-b flex items-center justify-between shrink-0 sticky top-0 z-30 backdrop-blur-md ${
          isDarkMode 
            ? 'bg-[#0B0F19]/80 border-[#1B2541]' 
            : 'bg-white/80 border-slate-200 shadow-3xs'
        }`}>
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Drawer Trigger */}
            <button 
              className="p-2 md:hidden block hover:bg-slate-100 rounded-lg transition text-slate-600"
              onClick={() => {
                const tabs = ['dashboard', 'leads', 'pipeline', 'reminders', 'map', 'calls', 'analytics', 'reports', 'settings', 'profile'];
                const nextIdx = (tabs.indexOf(currentTab) + 1) % tabs.length;
                setCurrentTab(tabs[nextIdx]);
                showToast(`Switched tab to: ${tabs[nextIdx]}`, 'info');
              }}
            >
              <Menu size={18} />
            </button>

            {/* Title block */}
            <div className="space-y-0.5">
              <h2 className={`text-sm font-black tracking-tight uppercase ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                {currentTab === 'dashboard' ? 'Overview Dashboard' :
                 currentTab === 'leads' ? 'Store Leads Directory' :
                 currentTab === 'pinned' ? 'Pinned Records' :
                 currentTab === 'pipeline' ? 'Deal Pipeline Kanban' :
                 currentTab === 'calls' ? 'Call outcome Timeline' :
                 currentTab === 'reminders' ? 'Followups Schedule' :
                 currentTab === 'map' ? 'Offline Visit Planner' :
                 currentTab === 'analytics' ? 'Performance Analytics' :
                 currentTab === 'reports' ? 'Wholesale Reports' :
                 currentTab === 'settings' ? 'CRM Configurations' :
                 'User Profile space'}
              </h2>
              
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                  isSupabaseConfigured 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  <span className={`w-1 h-1 rounded-full ${isSupabaseConfigured ? 'bg-indigo-500' : 'bg-amber-500 animate-pulse'}`} />
                  {isSupabaseConfigured ? 'Supabase Synchronized' : 'Offline Mode (Local)'}
                </span>
                
                <span className="text-[10px] text-slate-400">•</span>
                <span className="text-[10px] text-slate-400 font-mono">PORT 3000 ACTIVE</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
              className={`p-2 rounded-xl transition ${
                isDarkMode 
                  ? 'hover:bg-[#1C263F] text-amber-500 border border-[#1C263F]' 
                  : 'hover:bg-slate-100 text-indigo-500 border border-slate-200'
              }`}
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {/* Quick Register Button */}
            <button
              onClick={() => {
                setSelectedLead(null);
                setIsModalOpen(true);
              }}
              className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold text-xs py-2 px-4 rounded-xl transition duration-150 flex items-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              <Plus size={14} />
              Register Lead
            </button>
          </div>
        </header>

        {/* WORKSPACE SCROLLER COMPONENT */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {leadsLoading ? (
              <div className="h-96 flex flex-col items-center justify-center">
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="text-emerald-500 mb-3"
                >
                  <RefreshCw size={28} />
                </motion.div>
                <p className="text-xs text-slate-400 font-mono tracking-wider uppercase font-semibold">Syncing Active Database...</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {currentTab === 'dashboard' && (
                    <DashboardView
                      stats={stats}
                      chartData={chartData}
                      leads={leads}
                      allCalls={allCalls}
                      allNotes={allNotes}
                      allReminders={allReminders}
                      isDarkMode={isDarkMode}
                      setCurrentTab={setCurrentTab}
                    />
                  )}

                  {(currentTab === 'leads' || currentTab === 'pinned') && (
                    <LeadsView
                      leads={leads}
                      sortedAndFilteredLeads={sortedAndFilteredLeads}
                      pinnedLeadIds={pinnedLeadIds}
                      togglePinLead={togglePinLead}
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      statusFilter={statusFilter}
                      setStatusFilter={setStatusFilter}
                      categoryFilter={categoryFilter}
                      setCategoryFilter={setCategoryFilter}
                      dateFilter={dateFilter}
                      setDateFilter={setDateFilter}
                      sortBy={sortBy}
                      setSortBy={setSortBy}
                      userLocation={userLocation}
                      handleRequestUserLocation={handleRequestUserLocation}
                      calculateDistance={calculateDistance}
                      formatDistance={formatDistance}
                      showToast={showToast}
                      setSelectedLead={(lead) => setSelectedLead(lead)}
                      setIsModalOpen={setIsModalOpen}
                      setLeadToDelete={setLeadToDelete}
                      getUniqueCategories={getUniqueCategories}
                      isDarkMode={isDarkMode}
                      showOnlyPinned={currentTab === 'pinned'}
                    />
                  )}

                  {currentTab === 'pipeline' && (
                    <PipelineBoard
                      leads={leads}
                      onMoveLead={handleMoveLead}
                      onSelectLead={(lead) => {
                        setSelectedLead(lead);
                        setIsModalOpen(true);
                      }}
                    />
                  )}

                  {currentTab === 'reminders' && (
                    <CalendarView
                      leads={leads}
                      reminders={allReminders}
                      onToggleComplete={handleToggleReminderComplete}
                      onSelectLead={(lead) => {
                        setSelectedLead(lead);
                        setIsModalOpen(true);
                      }}
                    />
                  )}

                  {currentTab === 'map' && (
                    <MapView
                      leads={leads}
                      onSelectLead={(lead) => {
                        setSelectedLead(lead);
                        setIsModalOpen(true);
                      }}
                    />
                  )}

                  {currentTab === 'calls' && (
                    <CallsView
                      allCalls={allCalls}
                      leads={leads}
                      isDarkMode={isDarkMode}
                      setSelectedLead={(lead) => setSelectedLead(lead)}
                      setIsModalOpen={setIsModalOpen}
                    />
                  )}

                  {currentTab === 'analytics' && (
                    <div className="space-y-6">
                      <div className="px-1">
                        <h2 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>CRM Analytics Engine</h2>
                        <p className="text-xs text-slate-400 font-medium">Visual representation of daily call frequency and pipelines</p>
                      </div>
                      <AnalyticsChart data={chartData} />
                    </div>
                  )}

                  {currentTab === 'reports' && (
                    <ReportsView
                      leads={leads}
                      allCalls={allCalls}
                      allReminders={allReminders}
                      isDarkMode={isDarkMode}
                    />
                  )}

                  {currentTab === 'settings' && (
                    <SettingsView
                      user={user}
                      isSupabaseConfigured={isSupabaseConfigured}
                      leadsCount={leads.length}
                      isDarkMode={isDarkMode}
                      toggleTheme={toggleTheme}
                      handleLogout={handleLogout}
                    />
                  )}

                  {currentTab === 'profile' && (
                    <SettingsView
                      user={user}
                      isSupabaseConfigured={isSupabaseConfigured}
                      leadsCount={leads.length}
                      isDarkMode={isDarkMode}
                      toggleTheme={toggleTheme}
                      isProfileOnly={true}
                      handleLogout={handleLogout}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Lead Entry Slideover Modal */}
      {isModalOpen && (
        <LeadModal
          lead={selectedLead}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedLead(null);
          }}
          onSaved={() => {
            // Live Firestore subscription updates lists automatically
          }}
        />
      )}

      {/* Delete Lead Safety Confirmation Modal */}
      {leadToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-100"
          >
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Trash2 className="text-red-600" size={16} />
              Confirm Record Deletion
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-3 leading-relaxed">
              Are you sure you want to delete this cold call record? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => setLeadToDelete(null)}
                className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Elegant Toast Notifications Container */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' :
              toast.type === 'error' ? 'bg-red-50 text-red-800 border-red-100' :
              'bg-blue-50 text-blue-800 border-blue-100'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${
              toast.type === 'success' ? 'bg-emerald-500' :
              toast.type === 'error' ? 'bg-red-500' :
              'bg-blue-500'
            }`} />
            {toast.message}
          </motion.div>
        </div>
      )}
    </div>
  );
}
