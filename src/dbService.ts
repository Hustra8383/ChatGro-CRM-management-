import { createClient } from '@supabase/supabase-js';
import { Lead, Note, CallRecord, Meeting, Reminder } from './types';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper to convert camelCase to snake_case
function camelToSnake(obj: any): any {
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      acc[snakeKey] = camelToSnake(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
}

// Helper to convert snake_case to camelCase
function snakeToCamel(obj: any): any {
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = snakeToCamel(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
}

// Generate random UUIDs for LocalStorage items
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// --- LOCAL STORAGE SIMULATOR ENGINE ---
const LOCAL_STORAGE_KEYS = {
  LEADS: 'chatgro_crm_leads',
  NOTES: 'chatgro_crm_notes',
  CALLS: 'chatgro_crm_calls',
  MEETINGS: 'chatgro_crm_meetings',
  REMINDERS: 'chatgro_crm_reminders',
  USER: 'chatgro_crm_user',
};

// Initialize localStorage with empty array or clean up sample data
function initLocalData() {
  const storedLeads = localStorage.getItem(LOCAL_STORAGE_KEYS.LEADS);
  if (storedLeads) {
    try {
      const leads = JSON.parse(storedLeads) as Lead[];
      // Filter out original readymade sample leads
      const cleanedLeads = leads.filter(l => l.id !== 'sample-lead-1' && l.id !== 'sample-lead-2');
      if (cleanedLeads.length !== leads.length) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.LEADS, JSON.stringify(cleanedLeads));
        
        // Also cascade clean notes/calls/meetings/reminders for sample leads
        const notes = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.NOTES) || '[]') as Note[];
        localStorage.setItem(LOCAL_STORAGE_KEYS.NOTES, JSON.stringify(notes.filter(n => n.leadId !== 'sample-lead-1' && n.leadId !== 'sample-lead-2')));

        const calls = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.CALLS) || '[]') as CallRecord[];
        localStorage.setItem(LOCAL_STORAGE_KEYS.CALLS, JSON.stringify(calls.filter(c => c.leadId !== 'sample-lead-1' && c.leadId !== 'sample-lead-2')));

        const meetings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.MEETINGS) || '[]') as Meeting[];
        localStorage.setItem(LOCAL_STORAGE_KEYS.MEETINGS, JSON.stringify(meetings.filter(m => m.leadId !== 'sample-lead-1' && m.leadId !== 'sample-lead-2')));

        const reminders = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.REMINDERS) || '[]') as Reminder[];
        localStorage.setItem(LOCAL_STORAGE_KEYS.REMINDERS, JSON.stringify(reminders.filter(r => r.leadId !== 'sample-lead-1' && r.leadId !== 'sample-lead-2')));
      }
    } catch (e) {
      console.error("Error cleaning sample data:", e);
    }
  } else {
    localStorage.setItem(LOCAL_STORAGE_KEYS.LEADS, JSON.stringify([]));
  }

  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.NOTES)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.NOTES, JSON.stringify([]));
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.CALLS)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.CALLS, JSON.stringify([]));
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.MEETINGS)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.MEETINGS, JSON.stringify([]));
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.REMINDERS)) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.REMINDERS, JSON.stringify([]));
  }
}

initLocalData();

export const dbService = {
  // Authentication services
  auth: {
    async signIn(email: string, password: string): Promise<{ user: any; error: any }> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        return { user: data.user, error };
      } else {
        // LocalStorage fallback mock login
        const mockUser = { id: 'local-user', email, role: 'authenticated' };
        localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(mockUser));
        window.dispatchEvent(new Event('local-auth-change'));
        return { user: mockUser, error: null };
      }
    },

    async signOut(): Promise<{ error: any }> {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signOut();
        return { error };
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
        window.dispatchEvent(new Event('local-auth-change'));
        return { error: null };
      }
    },

    onAuthStateChange(callback: (user: any) => void): () => void {
      if (isSupabaseConfigured && supabase) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          callback(session?.user || null);
        });
        return () => subscription.unsubscribe();
      } else {
        const checkLocalUser = () => {
          const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
          callback(stored ? JSON.parse(stored) : null);
        };
        checkLocalUser();
        window.addEventListener('local-auth-change', checkLocalUser);
        return () => window.removeEventListener('local-auth-change', checkLocalUser);
      }
    }
  },

  // Leads services
  leads: {
    async getAll(): Promise<Lead[]> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('updated_at', { ascending: false });
        if (error) {
          console.error('Supabase Error loading leads:', error);
          throw error;
        }
        return snakeToCamel(data || []) as Lead[];
      } else {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.LEADS);
        return stored ? JSON.parse(stored) : [];
      }
    },

    async add(lead: Omit<Lead, 'id'>): Promise<string> {
      const id = uuidv4();
      const newLead: Lead = { ...lead, id };

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('leads')
          .insert(camelToSnake(newLead));
        if (error) {
          console.error('Supabase Error adding lead:', error);
          throw error;
        }
      } else {
        const current = await this.getAll();
        current.unshift(newLead);
        localStorage.setItem(LOCAL_STORAGE_KEYS.LEADS, JSON.stringify(current));
        window.dispatchEvent(new Event('local-db-change'));
      }
      return id;
    },

    async update(leadId: string, leadData: Partial<Lead>): Promise<void> {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('leads')
          .update(camelToSnake(leadData))
          .eq('id', leadId);
        if (error) {
          console.error('Supabase Error updating lead:', error);
          throw error;
        }
      } else {
        const current = await this.getAll();
        const index = current.findIndex(l => l.id === leadId);
        if (index !== -1) {
          current[index] = { ...current[index], ...leadData, id: leadId };
          localStorage.setItem(LOCAL_STORAGE_KEYS.LEADS, JSON.stringify(current));
          window.dispatchEvent(new Event('local-db-change'));
        }
      }
    },

    async delete(leadId: string): Promise<void> {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('leads')
          .delete()
          .eq('id', leadId);
        if (error) {
          console.error('Supabase Error deleting lead:', error);
          throw error;
        }
      } else {
        const current = await this.getAll();
        const filtered = current.filter(l => l.id !== leadId);
        localStorage.setItem(LOCAL_STORAGE_KEYS.LEADS, JSON.stringify(filtered));

        // Delete cascade local subcollections
        const notes = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.NOTES) || '[]') as Note[];
        localStorage.setItem(LOCAL_STORAGE_KEYS.NOTES, JSON.stringify(notes.filter(n => n.leadId !== leadId)));

        const calls = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.CALLS) || '[]') as CallRecord[];
        localStorage.setItem(LOCAL_STORAGE_KEYS.CALLS, JSON.stringify(calls.filter(c => c.leadId !== leadId)));

        const meetings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.MEETINGS) || '[]') as Meeting[];
        localStorage.setItem(LOCAL_STORAGE_KEYS.MEETINGS, JSON.stringify(meetings.filter(m => m.leadId !== leadId)));

        const reminders = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.REMINDERS) || '[]') as Reminder[];
        localStorage.setItem(LOCAL_STORAGE_KEYS.REMINDERS, JSON.stringify(reminders.filter(r => r.leadId !== leadId)));

        window.dispatchEvent(new Event('local-db-change'));
      }
    },

    // Subscribes to lead changes (for real-time dashboard)
    subscribe(onUpdate: () => void): () => void {
      if (isSupabaseConfigured && supabase) {
        const channel = supabase
          .channel('public:leads')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
            onUpdate();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders' }, () => {
            onUpdate();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'calls' }, () => {
            onUpdate();
          })
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } else {
        window.addEventListener('local-db-change', onUpdate);
        return () => window.removeEventListener('local-db-change', onUpdate);
      }
    }
  },

  // Notes subcollection services
  notes: {
    async getAll(): Promise<Note[]> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return snakeToCamel(data || []) as Note[];
      } else {
        return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.NOTES) || '[]') as Note[];
      }
    },

    async getForLead(leadId: string): Promise<Note[]> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return snakeToCamel(data || []) as Note[];
      } else {
        const all = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.NOTES) || '[]') as Note[];
        return all.filter(n => n.leadId === leadId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
    },

    async add(leadId: string, text: string): Promise<Note> {
      const newNote: Note = {
        id: uuidv4(),
        leadId,
        text,
        createdAt: new Date().toISOString(),
      };

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('notes')
          .insert(camelToSnake(newNote));
        if (error) throw error;
      } else {
        const all = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.NOTES) || '[]') as Note[];
        all.unshift(newNote);
        localStorage.setItem(LOCAL_STORAGE_KEYS.NOTES, JSON.stringify(all));
        window.dispatchEvent(new Event('local-db-change'));
      }
      return newNote;
    },

    async update(noteId: string, text: string): Promise<void> {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('notes')
          .update({ text })
          .eq('id', noteId);
        if (error) throw error;
      } else {
        const all = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.NOTES) || '[]') as Note[];
        const idx = all.findIndex(n => n.id === noteId);
        if (idx !== -1) {
          all[idx].text = text;
          localStorage.setItem(LOCAL_STORAGE_KEYS.NOTES, JSON.stringify(all));
          window.dispatchEvent(new Event('local-db-change'));
        }
      }
    },

    async delete(noteId: string): Promise<void> {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('notes')
          .delete()
          .eq('id', noteId);
        if (error) throw error;
      } else {
        const all = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.NOTES) || '[]') as Note[];
        const filtered = all.filter(n => n.id !== noteId);
        localStorage.setItem(LOCAL_STORAGE_KEYS.NOTES, JSON.stringify(filtered));
        window.dispatchEvent(new Event('local-db-change'));
      }
    }
  },

  // Call Records subcollection services
  calls: {
    async getAll(): Promise<CallRecord[]> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('calls')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return snakeToCamel(data || []) as CallRecord[];
      } else {
        return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.CALLS) || '[]') as CallRecord[];
      }
    },

    async getForLead(leadId: string): Promise<CallRecord[]> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('calls')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return snakeToCamel(data || []) as CallRecord[];
      } else {
        const all = await this.getAll();
        return all.filter(c => c.leadId === leadId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
    },

    async add(leadId: string, record: Omit<CallRecord, 'id' | 'leadId' | 'createdAt'>): Promise<CallRecord> {
      const newRecord: CallRecord = {
        ...record,
        id: uuidv4(),
        leadId,
        createdAt: new Date().toISOString(),
      };

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('calls')
          .insert(camelToSnake(newRecord));
        if (error) throw error;
      } else {
        const all = await this.getAll();
        all.unshift(newRecord);
        localStorage.setItem(LOCAL_STORAGE_KEYS.CALLS, JSON.stringify(all));
        window.dispatchEvent(new Event('local-db-change'));
      }
      return newRecord;
    },

    async update(callId: string, record: Partial<CallRecord>): Promise<void> {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('calls')
          .update(camelToSnake(record))
          .eq('id', callId);
        if (error) throw error;
      } else {
        const all = await this.getAll();
        const idx = all.findIndex(c => c.id === callId);
        if (idx !== -1) {
          all[idx] = { ...all[idx], ...record };
          localStorage.setItem(LOCAL_STORAGE_KEYS.CALLS, JSON.stringify(all));
          window.dispatchEvent(new Event('local-db-change'));
        }
      }
    },

    async delete(callId: string): Promise<void> {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('calls')
          .delete()
          .eq('id', callId);
        if (error) throw error;
      } else {
        const all = await this.getAll();
        const filtered = all.filter(c => c.id !== callId);
        localStorage.setItem(LOCAL_STORAGE_KEYS.CALLS, JSON.stringify(filtered));
        window.dispatchEvent(new Event('local-db-change'));
      }
    }
  },

  // Meetings subcollection services
  meetings: {
    async getForLead(leadId: string): Promise<Meeting[]> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('meetings')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return snakeToCamel(data || []) as Meeting[];
      } else {
        const all = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.MEETINGS) || '[]') as Meeting[];
        return all.filter(m => m.leadId === leadId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
    },

    async add(leadId: string, meeting: Omit<Meeting, 'id' | 'leadId' | 'createdAt'>): Promise<Meeting> {
      const newMeeting: Meeting = {
        ...meeting,
        id: uuidv4(),
        leadId,
        createdAt: new Date().toISOString(),
      };

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('meetings')
          .insert(camelToSnake(newMeeting));
        if (error) throw error;
      } else {
        const all = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.MEETINGS) || '[]') as Meeting[];
        all.unshift(newMeeting);
        localStorage.setItem(LOCAL_STORAGE_KEYS.MEETINGS, JSON.stringify(all));
        window.dispatchEvent(new Event('local-db-change'));
      }
      return newMeeting;
    },

    async update(meetingId: string, meeting: Partial<Meeting>): Promise<void> {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('meetings')
          .update(camelToSnake(meeting))
          .eq('id', meetingId);
        if (error) throw error;
      } else {
        const all = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.MEETINGS) || '[]') as Meeting[];
        const idx = all.findIndex(m => m.id === meetingId);
        if (idx !== -1) {
          all[idx] = { ...all[idx], ...meeting };
          localStorage.setItem(LOCAL_STORAGE_KEYS.MEETINGS, JSON.stringify(all));
          window.dispatchEvent(new Event('local-db-change'));
        }
      }
    },

    async delete(meetingId: string): Promise<void> {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('meetings')
          .delete()
          .eq('id', meetingId);
        if (error) throw error;
      } else {
        const all = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.MEETINGS) || '[]') as Meeting[];
        const filtered = all.filter(m => m.id !== meetingId);
        localStorage.setItem(LOCAL_STORAGE_KEYS.MEETINGS, JSON.stringify(filtered));
        window.dispatchEvent(new Event('local-db-change'));
      }
    }
  },

  // Reminders subcollection services
  reminders: {
    async getAll(): Promise<Reminder[]> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('reminders')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return snakeToCamel(data || []) as Reminder[];
      } else {
        return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEYS.REMINDERS) || '[]') as Reminder[];
      }
    },

    async getForLead(leadId: string): Promise<Reminder[]> {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('reminders')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return snakeToCamel(data || []) as Reminder[];
      } else {
        const all = await this.getAll();
        return all.filter(r => r.leadId === leadId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
    },

    async add(leadId: string, reminder: Omit<Reminder, 'id' | 'leadId' | 'createdAt'>): Promise<Reminder> {
      const newReminder: Reminder = {
        ...reminder,
        id: uuidv4(),
        leadId,
        createdAt: new Date().toISOString(),
      };

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('reminders')
          .insert(camelToSnake(newReminder));
        if (error) throw error;
      } else {
        const all = await this.getAll();
        all.unshift(newReminder);
        localStorage.setItem(LOCAL_STORAGE_KEYS.REMINDERS, JSON.stringify(all));
        window.dispatchEvent(new Event('local-db-change'));
      }
      return newReminder;
    },

    async update(leadId: string, reminderId: string, completed: boolean): Promise<void> {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('reminders')
          .update({ completed })
          .eq('id', reminderId);
        if (error) throw error;
      } else {
        const all = await this.getAll();
        const index = all.findIndex(r => r.id === reminderId);
        if (index !== -1) {
          all[index].completed = completed;
          localStorage.setItem(LOCAL_STORAGE_KEYS.REMINDERS, JSON.stringify(all));
          window.dispatchEvent(new Event('local-db-change'));
        }
      }
    },

    async updateDetails(reminderId: string, text: string, datetime: string, completed: boolean): Promise<void> {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('reminders')
          .update({ text, datetime, completed })
          .eq('id', reminderId);
        if (error) throw error;
      } else {
        const all = await this.getAll();
        const index = all.findIndex(r => r.id === reminderId);
        if (index !== -1) {
          all[index].text = text;
          all[index].datetime = datetime;
          all[index].completed = completed;
          localStorage.setItem(LOCAL_STORAGE_KEYS.REMINDERS, JSON.stringify(all));
          window.dispatchEvent(new Event('local-db-change'));
        }
      }
    },

    async delete(reminderId: string): Promise<void> {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('reminders')
          .delete()
          .eq('id', reminderId);
        if (error) throw error;
      } else {
        const all = await this.getAll();
        const filtered = all.filter(r => r.id !== reminderId);
        localStorage.setItem(LOCAL_STORAGE_KEYS.REMINDERS, JSON.stringify(filtered));
        window.dispatchEvent(new Event('local-db-change'));
      }
    }
  }
};
