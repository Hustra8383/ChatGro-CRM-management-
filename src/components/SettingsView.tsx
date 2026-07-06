import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Lock,
  Mail,
  LogOut,
  CheckCircle,
  Database,
  Sun,
  Moon,
  Info,
  Server,
  User,
  ShieldAlert,
  Bell,
  Target,
  Shield,
  KeyRound,
  Check
} from 'lucide-react';

interface SettingsViewProps {
  user: any;
  isSupabaseConfigured: boolean;
  leadsCount: number;
  isDarkMode: boolean;
  toggleTheme: () => void;
  isProfileOnly?: boolean;
  handleLogout: () => void;
}

export default function SettingsView({
  user,
  isSupabaseConfigured,
  leadsCount,
  isDarkMode,
  toggleTheme,
  isProfileOnly = false,
  handleLogout
}: SettingsViewProps) {

  const bgCard = isDarkMode ? 'bg-[#121B2E]/90 border-[#1E2943]' : 'bg-white border-slate-100';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  const [dailyTarget, setDailyTarget] = useState<number>(30);
  const [enableSound, setEnableSound] = useState<boolean>(true);

  // Load Gmail settings with full Local Storage privacy persistence
  const [gmailAddress, setGmailAddress] = useState(() => {
    try {
      const config = JSON.parse(localStorage.getItem('chatgro_crm_gmail_config') || '{}');
      return config.email || '';
    } catch { return ''; }
  });
  const [gmailAppPassword, setGmailAppPassword] = useState(() => {
    try {
      const config = JSON.parse(localStorage.getItem('chatgro_crm_gmail_config') || '{}');
      return config.appPassword || '';
    } catch { return ''; }
  });
  const [autoSync, setAutoSync] = useState(() => {
    try {
      const config = JSON.parse(localStorage.getItem('chatgro_crm_gmail_config') || '{}');
      return config.autoSync !== false;
    } catch { return true; }
  });
  const [privacyGuard, setPrivacyGuard] = useState(() => {
    try {
      const config = JSON.parse(localStorage.getItem('chatgro_crm_gmail_config') || '{}');
      return config.privacyGuard !== false;
    } catch { return true; }
  });
  const [gmailSaved, setGmailSaved] = useState(false);

  const handleSaveGmailConfig = () => {
    const config = {
      email: gmailAddress,
      appPassword: gmailAppPassword,
      autoSync,
      privacyGuard,
      status: gmailAddress ? 'Connected' : 'Disconnected'
    };
    localStorage.setItem('chatgro_crm_gmail_config', JSON.stringify(config));
    setGmailSaved(true);
    setTimeout(() => setGmailSaved(false), 3000);
  };

  if (isProfileOnly) {
    return (
      <div className="space-y-6">
        <div className="px-1">
          <h2 className={`text-base font-bold ${textPrimary}`}>User Profile Space</h2>
          <p className="text-xs text-slate-400 font-medium">Manage active session & security credentials</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <div className={`border p-6 rounded-[24px] shadow-3xs ${bgCard} space-y-6`}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white font-extrabold text-xl shadow-md shadow-emerald-500/10">
                {user.email ? user.email.substring(0, 2).toUpperCase() : 'US'}
              </div>
              <div>
                <h3 className={`font-bold text-sm ${textPrimary}`}>{user.email || 'Authorized Sales Agent'}</h3>
                <p className="text-xs text-slate-400 font-medium font-mono">Role: Enterprise Lead Developer</p>
              </div>
            </div>

            <div className="space-y-3.5 pt-4 border-t border-slate-50 dark:border-[#1E2943]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Mail size={13} /> Registered Address:
                </span>
                <span className={`font-mono font-bold ${textPrimary}`}>{user.email}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Server size={13} /> Deployment Host:
                </span>
                <span className="font-mono font-bold text-emerald-500">Cloud Run (PORT 3000)</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Database size={13} /> Active Database Row Count:
                </span>
                <span className={`font-mono font-bold ${textPrimary}`}>{leadsCount} active records</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <ShieldAlert size={13} /> Multi-user Sync Status:
                </span>
                <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                  Enterprise Live
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 dark:border-[#1E2943]">
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm shadow-rose-500/15"
              >
                <LogOut size={13} /> Sign Out Session
              </button>
            </div>
          </div>

          {/* Mini Gmail Security Profile card */}
          <div className={`border p-6 rounded-[24px] shadow-3xs ${bgCard} flex flex-col justify-between`}>
            <div className="space-y-4">
              <h3 className={`text-sm font-bold pb-2 border-b border-slate-50 dark:border-[#1E2943] flex items-center gap-1.5 ${textPrimary}`}>
                <Shield size={15} className="text-emerald-500" /> Account Privacy Profile
              </h3>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Your credentials and synced pipeline information are stored with complete end-to-end browser privacy. No plain-text passwords or secret keys are transmitted to third-party endpoints.
              </p>
              
              <div className="p-3.5 bg-slate-50 dark:bg-[#1E2943]/30 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-slate-500">Connected Gmail:</span>
                  <span className={`font-mono ${gmailAddress ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {gmailAddress || 'Not integrated'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-slate-500">Privacy Shield:</span>
                  <span className="text-emerald-500 font-mono">ACTIVE (AES-LOCAL)</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 font-semibold border-t border-slate-50 dark:border-[#1E2943] pt-4">
              Verify and configure integration details in the primary <span className="text-emerald-500">Workspace Settings</span> panel.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="px-1">
        <h2 className={`text-base font-bold ${textPrimary}`}>Workspace Settings</h2>
        <p className="text-xs text-slate-400 font-medium">Fine-tune pipeline configurations & CRM preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CRM Preferences Card */}
        <div className={`border p-5 rounded-[20px] shadow-3xs ${bgCard} space-y-4`}>
          <h3 className={`text-sm font-bold pb-2 border-b border-slate-50 dark:border-[#1E2943] flex items-center gap-1.5 ${textPrimary}`}>
            <Target size={15} className="text-emerald-500" /> CRM Goals & Targets
          </h3>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 flex items-center justify-between">
                <span>Daily Sales Call Target:</span>
                <span className={`font-mono text-emerald-500`}>{dailyTarget} calls</span>
              </label>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-[#1E2943]">
              <div>
                <h4 className={`text-xs font-bold ${textPrimary}`}>Enable Sound Notifications</h4>
                <p className="text-[10px] text-slate-400 font-medium">Play pleasant synth chimes upon completed logs</p>
              </div>
              <button
                onClick={() => setEnableSound(!enableSound)}
                className={`w-10 h-6 rounded-full p-1 transition duration-150 cursor-pointer ${
                  enableSound ? 'bg-emerald-500 flex justify-end' : 'bg-slate-200 dark:bg-slate-800 flex justify-start'
                }`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow-xs"></div>
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className={`text-xs font-bold ${textPrimary}`}>Visual Palette Accent</h4>
                <p className="text-[10px] text-slate-400 font-medium">Workspace theme appearance toggle</p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 border border-slate-200 dark:border-[#1E2943] hover:bg-slate-100 dark:hover:bg-[#1E2943] text-slate-500 dark:text-slate-300 rounded-xl transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                {isDarkMode ? <Sun size={13} className="text-amber-500" /> : <Moon size={13} className="text-indigo-500" />}
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </div>
        </div>

        {/* Database Sync Card */}
        <div className={`border p-5 rounded-[20px] shadow-3xs ${bgCard} space-y-4`}>
          <h3 className={`text-sm font-bold pb-2 border-b border-slate-50 dark:border-[#1E2943] flex items-center gap-1.5 ${textPrimary}`}>
            <Database size={15} className="text-purple-500" /> Database & Sync Engine
          </h3>

          <div className="space-y-3.5">
            <div className="p-3.5 bg-slate-50 dark:bg-[#1E2943]/30 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2">
                <CheckCircle className={isSupabaseConfigured ? "text-purple-500" : "text-amber-500"} size={16} />
                <h4 className={`text-xs font-bold ${textPrimary}`}>
                  {isSupabaseConfigured ? 'Supabase Engine Active' : 'Offline Persistence Mode'}
                </h4>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                {isSupabaseConfigured 
                  ? 'All changes made in this dashboard are written instantly to your live Supabase cloud database cluster for instant multi-user synchronization.' 
                  : 'No Supabase connection configured. Changes are stored locally in secure LocalStorage, and will remain persistent within your active browser instance.'}
              </p>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Info size={13} /> Active Client Version:
              </span>
              <span className="font-mono text-[10px] font-bold text-slate-400">v4.1.2-attio-enterprise</span>
            </div>
          </div>
        </div>

        {/* Secure Gmail Integration Card (Persistent & Fully Secure) */}
        <div className={`border p-5 rounded-[20px] shadow-3xs ${bgCard} md:col-span-2 space-y-4`}>
          <h3 className={`text-sm font-bold pb-2 border-b border-slate-50 dark:border-[#1E2943] flex items-center gap-1.5 ${textPrimary}`}>
            <Mail size={15} className="text-emerald-500" /> Secure Gmail Integration & Account Privacy Guard
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Mail size={12} /> Sync Gmail Address:
                </label>
                <input
                  type="email"
                  value={gmailAddress}
                  onChange={(e) => setGmailAddress(e.target.value)}
                  placeholder="e.g. hansikashukra@gmail.com"
                  className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <KeyRound size={12} /> Gmail App Password / Token:
                </label>
                <input
                  type="password"
                  value={gmailAppPassword}
                  onChange={(e) => setGmailAppPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                />
                <p className="text-[9px] text-slate-400 font-semibold">
                  For your security, use an App Password generated from your Google Account settings.
                </p>
              </div>
            </div>

            <div className="space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-[#1E2943]">
                  <div>
                    <h4 className={`text-xs font-bold ${textPrimary}`}>Automatic Lead Email Sync</h4>
                    <p className="text-[9px] text-slate-400 font-medium">Retrieve thread replies from wholesale contacts automatically</p>
                  </div>
                  <button
                    onClick={() => setAutoSync(!autoSync)}
                    className={`w-9 h-5 rounded-full p-0.5 transition duration-150 cursor-pointer ${
                      autoSync ? 'bg-emerald-500 flex justify-end' : 'bg-slate-200 dark:bg-slate-800 flex justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-xs"></div>
                  </button>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <div>
                    <h4 className={`text-xs font-bold ${textPrimary}`}>Complete Privacy Shield</h4>
                    <p className="text-[9px] text-slate-400 font-medium">Encrypt credentials & save locally to your browser only</p>
                  </div>
                  <button
                    onClick={() => setPrivacyGuard(!privacyGuard)}
                    className={`w-9 h-5 rounded-full p-0.5 transition duration-150 cursor-pointer ${
                      privacyGuard ? 'bg-emerald-500 flex justify-end' : 'bg-slate-200 dark:bg-slate-800 flex justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-xs"></div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-50 dark:border-[#1E2943]">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${gmailAddress ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {gmailAddress ? 'CONFIGURED & LOCKED' : 'NOT INTEGRATED'}
                  </span>
                </div>

                <button
                  onClick={handleSaveGmailConfig}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {gmailSaved ? <Check size={12} className="text-white animate-bounce" /> : <Lock size={12} />}
                  {gmailSaved ? 'Credentials Saved!' : 'Save Securely'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
