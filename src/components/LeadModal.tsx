import React, { useState, useEffect } from 'react';
import { Lead, Note, CallRecord, Meeting, Reminder } from '../types';
import { dbService } from '../dbService';
import { X, Plus, Calendar, MessageSquare, Phone, MapPin, Share2, ClipboardList, AudioLines, FileText, ChevronRight, User, AlertCircle, Sparkles, Trash2, Pencil, Clock, TrendingUp, ExternalLink, Search } from 'lucide-react';
import AudioRecorder from './AudioRecorder';

interface LeadModalProps {
  lead: Lead | null; // null means create new
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES = ['Mobile Shop', 'Restaurant', 'Gym', 'Salon', 'Clinic', 'Clothing Store', 'Coaching Center', 'Real Estate Agent', 'Car Dealer', 'Local Retail Store', 'Other'];
const SOURCES = ['Cold Call', 'Field Visit', 'Walk-In', 'Referral', 'Social Media', 'Other'];
const PIPELINE_STAGES: Lead['currentStatus'][] = ['New Lead', 'Called', 'Interested', 'Meeting', 'Client', 'Rejected'];
const TAGS = ['Mobile Shop', 'Restaurant', 'Gym', 'Salon', 'Clinic', 'Hot Lead', 'VIP', 'Cold Lead'];

const QUICK_NOTES = [
  'Owner busy',
  'Asked price',
  'Call Monday',
  'Brother handles business',
  'Already using WATI',
  'Need demo',
  'Asked to send details on WhatsApp',
  'Interested in Broadcast',
  'Wants automated replies'
];

export default function LeadModal({ lead, onClose, onSaved }: LeadModalProps) {
  const isEdit = !!lead;
  
  // Lead basic state
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [category, setCategory] = useState('Mobile Shop');
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [fullAddress, setFullAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isLocLoading, setIsLocLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchingSuggestions, setSearchingSuggestions] = useState(false);
  const [source, setSource] = useState('Cold Call');
  const [currentStatus, setCurrentStatus] = useState<Lead['currentStatus']>('New Lead');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Subcollections lists
  const [notes, setNotes] = useState<Note[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  // Active view tab in modal
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'meetings' | 'reminders' | 'proposal' | 'timeline'>('details');

  // Interactive inline editing states
  const [expandedNotes, setExpandedNotes] = useState<{[key: string]: boolean}>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);
  const [editingReminderText, setEditingReminderText] = useState('');
  const [editingReminderDate, setEditingReminderDate] = useState('');

  // Input states for logging additions
  const [noteInput, setNoteInput] = useState('');
  const [callNotesInput, setCallNotesInput] = useState('');
  const [callAudioUrl, setCallAudioUrl] = useState<string>('');
  const [callAudioName, setCallAudioName] = useState<string>('');
  const [callAudioDuration, setCallAudioDuration] = useState<number>(0);
  const [callStatusInput, setCallStatusInput] = useState<Lead['currentStatus']>('Called');

  // Meeting form state
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingLoc, setMeetingLoc] = useState('');
  const [meetingResult, setMeetingResult] = useState('');
  const [meetingAction, setMeetingAction] = useState('');

  // Reminder form state
  const [reminderText, setReminderText] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderError, setReminderError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load existing lead details
  useEffect(() => {
    if (lead) {
      setBusinessName(lead.businessName);
      setOwnerName(lead.ownerName || '');
      setMobileNumber(lead.mobileNumber);
      setWhatsappNumber(lead.whatsappNumber || '');
      setCategory(lead.category);
      setLocation(lead.location || '');
      setLat(lead.lat !== undefined ? lead.lat : lead.latitude);
      setLng(lead.lng !== undefined ? lead.lng : lead.longitude);
      setSource(lead.source);
      setCurrentStatus(lead.currentStatus);
      setSelectedTags(lead.tags || []);
      setFullAddress(lead.fullAddress || '');
      setCity(lead.city || '');
      setStateName(lead.state || '');
      setCountry(lead.country || '');
      setPostalCode(lead.postalCode || '');

      // Fetch subcollections
      fetchSubcollections(lead.id);
    } else {
      // Reset
      setBusinessName('');
      setOwnerName('');
      setMobileNumber('');
      setWhatsappNumber('');
      setCategory('Mobile Shop');
      setLocation('');
      setLat(undefined);
      setLng(undefined);
      setFullAddress('');
      setCity('');
      setStateName('');
      setCountry('');
      setPostalCode('');
      setSource('Cold Call');
      setCurrentStatus('New Lead');
      setSelectedTags([]);
      setNotes([]);
      setCalls([]);
      setMeetings([]);
      setReminders([]);
    }
  }, [lead]);

  const fetchSubcollections = async (leadId: string) => {
    try {
      const fetchedNotes = await dbService.notes.getForLead(leadId);
      setNotes(fetchedNotes);

      const fetchedCalls = await dbService.calls.getForLead(leadId);
      setCalls(fetchedCalls);

      const fetchedMeetings = await dbService.meetings.getForLead(leadId);
      setMeetings(fetchedMeetings);

      const fetchedReminders = await dbService.reminders.getForLead(leadId);
      setReminders(fetchedReminders);
    } catch (err) {
      console.error("Error loading lead history:", err);
    }
  };

  const updateLocationInDb = async (
    newLat: number,
    newLng: number,
    newFullAddr: string,
    newCity: string,
    newState: string,
    newCountry: string,
    newPostcode: string
  ) => {
    if (isEdit && lead) {
      try {
        await dbService.leads.update(lead.id, {
          lat: newLat,
          lng: newLng,
          latitude: newLat,
          longitude: newLng,
          location: newFullAddr || location,
          fullAddress: newFullAddr,
          city: newCity,
          state: newState,
          country: newCountry,
          postalCode: newPostcode,
          updatedAt: new Date().toISOString()
        });
        await dbService.notes.add(lead.id, `[System Log: Edited] Location updated to ${newFullAddr} (${newLat.toFixed(5)}, ${newLng.toFixed(5)})`);
        // Refresh notes list immediately
        const fetchedNotes = await dbService.notes.getForLead(lead.id);
        setNotes(fetchedNotes);
      } catch (err) {
        console.error("Error auto-updating location in DB:", err);
      }
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en'
          }
        }
      );
      if (!response.ok) throw new Error("Reverse geocoding request failed");
      const data = await response.json();
      
      const addr = data.address || {};
      const fullAddr = data.display_name || `${latitude}, ${longitude}`;
      const c = addr.city || addr.town || addr.village || addr.city_district || addr.county || '';
      const s = addr.state || addr.region || '';
      const co = addr.country || '';
      const pc = addr.postcode || '';

      setFullAddress(fullAddr);
      setLocation(fullAddr);
      setCity(c);
      setStateName(s);
      setCountry(co);
      setPostalCode(pc);

      await updateLocationInDb(latitude, longitude, fullAddr, c, s, co, pc);
      return { fullAddr, c, s, co, pc };
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      const fallbackAddr = `Latitude: ${latitude}, Longitude: ${longitude}`;
      setFullAddress(fallbackAddr);
      setLocation(fallbackAddr);
      await updateLocationInDb(latitude, longitude, fallbackAddr, '', '', '', '');
      throw err;
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocLoading(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLat(latitude);
        setLng(longitude);
        
        try {
          await reverseGeocode(latitude, longitude);
          // Post message to iframe map to update view
          const iframe = document.getElementById('leaflet-map-iframe') as HTMLIFrameElement;
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'UPDATE_COORDS', lat: latitude, lng: longitude }, '*');
          }
        } catch (err) {
          setErrorMsg("Failed to reverse geocode coordinates. Coordinates set manually.");
        } finally {
          setIsLocLoading(false);
        }
      },
      (error) => {
        setIsLocLoading(false);
        let errorString = "Failed to get current location.";
        if (error.code === error.PERMISSION_DENIED) {
          errorString = "GPS Permission denied by browser. Please enable location access or search manually.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorString = "Location information is unavailable.";
        } else if (error.code === error.TIMEOUT) {
          errorString = "Location request timed out. Please try again.";
        }
        setErrorMsg(errorString);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    if (val.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setSearchingSuggestions(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&addressdetails=1&limit=5`,
        {
          headers: {
            'Accept-Language': 'en'
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (e) {
      console.error("Autocomplete fetch error:", e);
    } finally {
      setSearchingSuggestions(false);
    }
  };

  const handleSelectSuggestion = async (item: any) => {
    const latitude = Number(item.lat);
    const longitude = Number(item.lon);
    setLat(latitude);
    setLng(longitude);
    setSearchQuery('');
    setSuggestions([]);

    const addr = item.address || {};
    const fullAddr = item.display_name || `${latitude}, ${longitude}`;
    const c = addr.city || addr.town || addr.village || addr.city_district || addr.county || '';
    const s = addr.state || addr.region || '';
    const co = addr.country || '';
    const pc = addr.postcode || '';

    setFullAddress(fullAddr);
    setLocation(fullAddr);
    setCity(c);
    setStateName(s);
    setCountry(co);
    setPostalCode(pc);

    await updateLocationInDb(latitude, longitude, fullAddr, c, s, co, pc);

    const iframe = document.getElementById('leaflet-map-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'UPDATE_COORDS', lat: latitude, lng: longitude }, '*');
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data && event.data.type === 'MAP_COORDS_CHANGED') {
        const { lat: newLat, lng: newLng } = event.data;
        setLat(newLat);
        setLng(newLng);
        try {
          await reverseGeocode(newLat, newLng);
        } catch (err) {
          console.error("Geocoding failed for chosen point on map");
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [lat, lng, isEdit, lead]);

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !mobileNumber) {
      setErrorMsg("Business Name and Mobile Number are required.");
      return;
    }
    setSaving(true);
    setErrorMsg(null);

    const dataPayload = {
      businessName,
      ownerName,
      mobileNumber,
      whatsappNumber: whatsappNumber || mobileNumber, // Default to mobile if empty
      category,
      location: fullAddress || location,
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      latitude: lat ? Number(lat) : undefined,
      longitude: lng ? Number(lng) : undefined,
      source,
      currentStatus,
      tags: selectedTags,
      updatedAt: new Date().toISOString(),
      fullAddress: fullAddress || undefined,
      city: city || undefined,
      state: stateName || undefined,
      country: country || undefined,
      postalCode: postalCode || undefined
    };

    try {
      if (isEdit && lead) {
        const isStatusChanged = lead.currentStatus !== currentStatus;
        const isProfileChanged = lead.businessName !== businessName ||
          (lead.ownerName || '') !== ownerName ||
          lead.mobileNumber !== mobileNumber ||
          lead.category !== category ||
          (lead.location || '') !== location;

        await dbService.leads.update(lead.id, dataPayload);

        if (isStatusChanged) {
          await dbService.notes.add(lead.id, `[System Log: Status] Status changed from ${lead.currentStatus} to ${currentStatus}`);
        }
        if (isProfileChanged) {
          await dbService.notes.add(lead.id, `[System Log: Edited] Business details updated`);
        }
      } else {
        const addedLeadId = await dbService.leads.add({
          ...dataPayload,
          dateAdded: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
        await dbService.notes.add(addedLeadId, `[System Log: Created] Lead business profile registered`);
      }
      setSaving(false);
      onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to save lead. Please check configuration and try again.");
      setSaving(false);
    }
  };

  // Subcollection Loggers
  const addNote = async () => {
    if (!noteInput.trim() || !lead) return;
    try {
      const newNote = await dbService.notes.add(lead.id, noteInput);
      setNotes([newNote, ...notes]);
      setNoteInput('');
    } catch (err) {
      console.error("Error adding note:", err);
    }
  };

  const handleEditNote = async (noteId: string, text: string) => {
    try {
      await dbService.notes.update(noteId, text);
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, text } : n));
      setEditingNoteId(null);
    } catch (err) {
      console.error("Error editing note:", err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      try {
        await dbService.notes.delete(noteId);
        setNotes(prev => prev.filter(n => n.id !== noteId));
      } catch (err) {
        console.error("Error deleting note:", err);
      }
    }
  };

  const addCallRecord = async () => {
    if (!lead) return;
    try {
      const payload = {
        date: new Date().toLocaleDateString('en-US'),
        status: callStatusInput,
        duration: callAudioDuration || 0,
        notes: callNotesInput,
        audioUrl: callAudioUrl || '',
        audioName: callAudioName || '',
      };
      
      const newCall = await dbService.calls.add(lead.id, payload);
      setCalls([newCall, ...calls]);
      
      // Update lead status synchronously
      await dbService.leads.update(lead.id, {
        currentStatus: callStatusInput,
        updatedAt: new Date().toISOString()
      });
      setCurrentStatus(callStatusInput);

      // Reset inputs
      setCallNotesInput('');
      setCallAudioUrl('');
      setCallAudioName('');
      setCallAudioDuration(0);
      
      // Reload parent state
      onSaved();
    } catch (err) {
      console.error("Error saving call record:", err);
    }
  };

  const addMeeting = async () => {
    if (!meetingDate || !lead) return;
    try {
      const payload = {
        meetingDate,
        location: meetingLoc,
        result: meetingResult,
        nextAction: meetingAction,
      };
      const newMeeting = await dbService.meetings.add(lead.id, payload);
      setMeetings([newMeeting, ...meetings]);
      
      // Sync Status
      await dbService.leads.update(lead.id, {
        currentStatus: 'Meeting',
        updatedAt: new Date().toISOString()
      });
      setCurrentStatus('Meeting');

      // Reset
      setMeetingDate('');
      setMeetingLoc('');
      setMeetingResult('');
      setMeetingAction('');
      onSaved();
    } catch (err) {
      console.error("Error logging meeting:", err);
    }
  };

  const addReminder = async () => {
    if (!lead) {
      setReminderError("Lead details not found. Please try again.");
      return;
    }
    if (!reminderText.trim()) {
      setReminderError("Please enter a reminder instruction.");
      return;
    }
    if (!reminderDate) {
      setReminderError("Please select a date and time for the reminder.");
      return;
    }
    try {
      setReminderError(null);
      const payload = {
        text: reminderText,
        datetime: reminderDate,
        completed: false,
      };
      const newReminder = await dbService.reminders.add(lead.id, payload);
      setReminders([newReminder, ...reminders]);

      setReminderText('');
      setReminderDate('');
      onSaved();
    } catch (err) {
      console.error("Error saving reminder:", err);
      setReminderError("Failed to save the reminder in the database.");
    }
  };

  const handleEditReminder = async (remId: string, text: string, datetime: string, completed: boolean) => {
    try {
      await dbService.reminders.updateDetails(remId, text, datetime, completed);
      setReminders(prev => prev.map(r => r.id === remId ? { ...r, text, datetime, completed } : r));
      setEditingReminderId(null);
      onSaved();
    } catch (err) {
      console.error("Error editing reminder:", err);
    }
  };

  const handleDeleteReminder = async (remId: string) => {
    if (window.confirm("Are you sure you want to delete this reminder?")) {
      try {
        await dbService.reminders.delete(remId);
        setReminders(prev => prev.filter(r => r.id !== remId));
        onSaved();
      } catch (err) {
        console.error("Error deleting reminder:", err);
      }
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleQuickNoteTap = (noteText: string) => {
    setNoteInput((prev) => (prev ? `${prev}, ${noteText}` : noteText));
  };

  const handleQuickNoteCallTap = (noteText: string) => {
    setCallNotesInput((prev) => (prev ? `${prev}, ${noteText}` : noteText));
  };

  // WhatsApp Proposal generator
  const getProposalMessage = () => {
    return `Hi! 🚀\n\nIt was great speaking with you today regarding *${businessName}*. We help local businesses completely turn WhatsApp into an automated sales and customer management platform!\n\nHere's what ChatGro provides to boost your business:\n💬 *Unified Inbox* - All messages in one hub\n🤖 *Smart Automations* - Welcome, Away & Auto-Replies\n📢 *Broadcast Campaigns* - Unlimited customer blasts\n🏷️ *Lead Tracker & Mini CRM* - Organize contacts, notes & labels\n\nWould you like a quick 5-minute live demo this week to see how ChatGro can save you hours of work every single day?\n\nBest Regards,\nChatGro CRM Team`;
  };

  const shareProposalWhatsApp = () => {
    const encodedText = encodeURIComponent(getProposalMessage());
    const phoneNum = whatsappNumber || mobileNumber;
    // Clean phone number (remove spacing, symbols)
    const cleanPhone = phoneNum.replace(/[^0-9]/g, '');
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`, '_blank');
  };

  const getTimelineEvents = () => {
    const events: {
      id: string;
      type: string;
      title: string;
      subtitle: string;
      date: string;
      icon: string;
      bg: string;
      text: string;
    }[] = [];

    if (lead) {
      // 1. Creation event
      events.push({
        id: 'create-' + lead.id,
        type: 'Created',
        title: 'Business Profile Registered',
        subtitle: `Registered niche: ${lead.category} | Source: ${lead.source}`,
        date: lead.createdAt || lead.dateAdded || new Date().toISOString(),
        icon: 'Plus',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        text: 'text-emerald-800'
      });
    }

    // 2. Notes (both User Notes and System Logs)
    notes.forEach(note => {
      if (note.text.startsWith('[System Log: Created]')) {
        // Skip duplicate profile creation logs
        return;
      }
      if (note.text.startsWith('[System Log: Status]')) {
        const details = note.text.replace('[System Log: Status]', '').trim();
        events.push({
          id: note.id,
          type: 'Status Changed',
          title: 'Pipeline Stage Updated',
          subtitle: details,
          date: note.createdAt,
          icon: 'TrendingUp',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
          text: 'text-indigo-800'
        });
      } else if (note.text.startsWith('[System Log: Edited]')) {
        events.push({
          id: note.id,
          type: 'Edited',
          title: 'Business Profile Edited',
          subtitle: 'Profile details updated',
          date: note.createdAt,
          icon: 'Edit2',
          bg: 'bg-amber-50 text-amber-700 border-amber-100',
          text: 'text-amber-800'
        });
      } else {
        events.push({
          id: note.id,
          type: 'Note Added',
          title: 'Logged Profile Note',
          subtitle: note.text,
          date: note.createdAt,
          icon: 'BookOpen',
          bg: 'bg-slate-50 text-slate-700 border-slate-100',
          text: 'text-slate-800'
        });
      }
    });

    // 3. Calls
    calls.forEach(call => {
      events.push({
        id: call.id,
        type: 'Call Logged',
        title: `Cold Call Logged: ${call.status}`,
        subtitle: `${call.duration > 0 ? `Duration: ${call.duration}s | ` : ''}${call.notes || 'No call notes'}`,
        date: call.createdAt,
        icon: 'PhoneCall',
        bg: 'bg-sky-50 text-sky-700 border-sky-100',
        text: 'text-sky-800'
      });
    });

    // 4. Reminders
    reminders.forEach(rem => {
      events.push({
        id: rem.id,
        type: 'Follow-up Changed',
        title: `Reminder Scheduled`,
        subtitle: `${rem.text} (Target: ${new Date(rem.datetime).toLocaleString()})${rem.completed ? ' [COMPLETED]' : ' [PENDING]'}`,
        date: rem.createdAt,
        icon: 'Calendar',
        bg: rem.completed ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-rose-50 text-rose-700 border-rose-100',
        text: rem.completed ? 'text-slate-400' : 'text-rose-800'
      });
    });

    // 5. Meetings
    meetings.forEach(meet => {
      events.push({
        id: meet.id,
        type: 'Meeting Logged',
        title: `Meeting Logged: ${meet.result || 'No outcome'}`,
        subtitle: `Location: ${meet.location || 'N/A'} | Next Action: ${meet.nextAction || 'N/A'}`,
        date: meet.meetingDate || meet.createdAt,
        icon: 'Award',
        bg: 'bg-purple-50 text-purple-700 border-purple-100',
        text: 'text-purple-800'
      });
    });

    // Sort Newest first
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const TimelineIcon = ({ name, size }: { name: string; size: number }) => {
    if (name === 'Plus') return <Plus size={size} />;
    if (name === 'TrendingUp') return <TrendingUp size={size} />;
    if (name === 'Edit2') return <Pencil size={size} />;
    if (name === 'BookOpen') return <FileText size={size} />;
    if (name === 'PhoneCall') return <Phone size={size} />;
    if (name === 'Calendar') return <Calendar size={size} />;
    if (name === 'Award') return <Sparkles size={size} />;
    return <FileText size={size} />;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <ClipboardList size={18} />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {isEdit ? `Edit Lead Details: ${businessName}` : 'Register New Lead'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">CRM Lead & Call Tracking System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs (Only available when editing an existing lead) */}
        {isEdit && (
          <div className="flex border-b border-slate-100 bg-slate-50 shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
                activeTab === 'details'
                  ? 'border-emerald-600 text-emerald-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <User size={14} />
              Lead Profile
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
                activeTab === 'history'
                  ? 'border-emerald-600 text-emerald-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <AudioLines size={14} />
              Call History & Voice Records
            </button>
            <button
              onClick={() => setActiveTab('meetings')}
              className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
                activeTab === 'meetings'
                  ? 'border-emerald-600 text-emerald-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Calendar size={14} />
              Meeting Tracker
            </button>
            <button
              onClick={() => setActiveTab('reminders')}
              className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
                activeTab === 'reminders'
                  ? 'border-emerald-600 text-emerald-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <MessageSquare size={14} />
              Follow-ups & Reminders
            </button>
            <button
              onClick={() => setActiveTab('proposal')}
              className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
                activeTab === 'proposal'
                  ? 'border-emerald-600 text-emerald-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText size={14} />
              WhatsApp Proposal Share
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 shrink-0 ${
                activeTab === 'timeline'
                  ? 'border-emerald-600 text-emerald-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Clock size={14} />
              Timeline History
            </button>
          </div>
        )}

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-6">
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: Profile Details Form */}
          {activeTab === 'details' && (
            <form onSubmit={handleSaveLead} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Store Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Business/Store Name *</label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. IT Hub, Bright Mobiles"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-2xs"
                  />
                </div>

                {/* Owner Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Owner Name</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-2xs"
                  />
                </div>

                {/* Mobile Number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-2xs"
                  />
                </div>

                {/* WhatsApp Number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">WhatsApp/Business Number</label>
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-2xs"
                  />
                </div>

                {/* Category/Niche */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Niche / Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white shadow-2xs"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Current Status */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Current Pipeline Stage</label>
                  <select
                    value={currentStatus}
                    onChange={(e) => setCurrentStatus(e.target.value as Lead['currentStatus'])}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white shadow-2xs"
                  >
                    {PIPELINE_STAGES.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </div>

                {/* Source */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Lead Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white shadow-2xs"
                  >
                    {SOURCES.map(src => (
                      <option key={src} value={src}>{src}</option>
                    ))}
                  </select>
                </div>

                {/* Geolocation, Address Autocomplete & Interactive Leaflet Map Preview */}
                <div className="col-span-1 md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/60 pb-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <MapPin className="text-emerald-600" size={16} />
                        Interactive Store Location System
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium">Verify coordinates, search addresses, and view interactive Map Preview</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleGetCurrentLocation}
                        disabled={isLocLoading}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                      >
                        {isLocLoading ? (
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <MapPin size={14} />
                        )}
                        {isLocLoading ? "Fetching GPS..." : "Get Current Location"}
                      </button>

                      {lat && lng && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                        >
                          <ExternalLink size={14} />
                          Open in Google Maps
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Manual Search & Autocomplete suggestions */}
                  <div className="relative space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Search size={12} className="text-slate-400" />
                      Search Address or Market (Choose on Map / Manual Search)
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Type 3+ characters to search, e.g. Gandhi Bazar Malleshwaram..."
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-2xs"
                    />
                    {searchingSuggestions && (
                      <div className="absolute right-3.5 top-8.5">
                        <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin" />
                      </div>
                    )}
                    {suggestions.length > 0 && (
                      <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-xl shadow-lg mt-1 overflow-hidden divide-y divide-slate-100">
                        {suggestions.map((item) => (
                          <button
                            key={item.place_id}
                            type="button"
                            onClick={() => handleSelectSuggestion(item)}
                            className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 transition block overflow-hidden text-ellipsis whitespace-nowrap"
                          >
                            📍 {item.display_name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Lat/Lng Input Row & Address details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Map Iframe Column */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden h-[260px] bg-slate-100 relative">
                      <iframe
                        id="leaflet-map-iframe"
                        title="Interactive Leaflet Map Preview"
                        className="w-full h-full border-0"
                        srcDoc={`
                          <!DOCTYPE html>
                          <html>
                          <head>
                            <meta charset="utf-8" />
                            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                            <style>
                              html, body, #map {
                                height: 100%;
                                margin: 0;
                                padding: 0;
                                background: #f1f5f9;
                              }
                            </style>
                          </head>
                          <body>
                            <div id="map"></div>
                            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                            <script>
                              var initialLat = ${lat || 12.971598};
                              var initialLng = ${lng || 77.594562};
                              var hasValidCoords = ${lat !== undefined && lng !== undefined};

                              var map = L.map('map').setView([initialLat, initialLng], hasValidCoords ? 15 : 12);

                              L.tileLayer('https://{s}.tile.openstreetmap.org/{s}.png', {
                                attribution: '&copy; OpenStreetMap'
                              }).addTo(map);

                              var marker;
                              if (hasValidCoords) {
                                marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
                                setupMarkerEvents(marker);
                              }

                              function setupMarkerEvents(m) {
                                m.on('dragend', function (e) {
                                  var position = m.getLatLng();
                                  window.parent.postMessage({ type: 'MAP_COORDS_CHANGED', lat: position.lat, lng: position.lng }, '*');
                                });
                              }

                              map.on('click', function (e) {
                                var lat = e.latlng.lat;
                                var lng = e.latlng.lng;
                                if (marker) {
                                  marker.setLatLng(e.latlng);
                                } else {
                                  marker = L.marker(e.latlng, { draggable: true }).addTo(map);
                                  setupMarkerEvents(marker);
                                }
                                window.parent.postMessage({ type: 'MAP_COORDS_CHANGED', lat: lat, lng: lng }, '*');
                              });

                              window.addEventListener('message', function (event) {
                                if (event.data && event.data.type === 'UPDATE_COORDS') {
                                  var newLat = event.data.lat;
                                  var newLng = event.data.lng;
                                  map.setView([newLat, newLng], 15);
                                  if (marker) {
                                    marker.setLatLng([newLat, newLng]);
                                  } else {
                                    marker = L.marker([newLat, newLng], { draggable: true }).addTo(map);
                                    setupMarkerEvents(marker);
                                  }
                                }
                              });
                            </script>
                          </body>
                          </html>
                        `}
                        sandbox="allow-scripts allow-same-origin"
                      />
                      {(!lat || !lng) && (
                        <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-center p-4 z-10 pointer-events-none">
                          <MapPin size={32} className="text-white/60 mb-2 animate-bounce" />
                          <p className="text-xs font-bold text-white">No Coordinates Set</p>
                          <p className="text-[10px] text-white/70 max-w-xs mt-1">
                            Click anywhere on the map above, use "Get Current Location", or search for a market to set location coordinates.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Metadata & Coordinate Fields */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Latitude</label>
                          <input
                            type="number"
                            step="0.000001"
                            value={lat || ''}
                            onChange={(e) => {
                              const newLat = e.target.value ? Number(e.target.value) : undefined;
                              setLat(newLat);
                              if (newLat && lng) {
                                reverseGeocode(newLat, lng);
                                const iframe = document.getElementById('leaflet-map-iframe') as HTMLIFrameElement;
                                if (iframe && iframe.contentWindow) {
                                  iframe.contentWindow.postMessage({ type: 'UPDATE_COORDS', lat: newLat, lng: lng }, '*');
                                }
                              }
                            }}
                            placeholder="e.g. 12.971598"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Longitude</label>
                          <input
                            type="number"
                            step="0.000001"
                            value={lng || ''}
                            onChange={(e) => {
                              const newLng = e.target.value ? Number(e.target.value) : undefined;
                              setLng(newLng);
                              if (lat && newLng) {
                                reverseGeocode(lat, newLng);
                                const iframe = document.getElementById('leaflet-map-iframe') as HTMLIFrameElement;
                                if (iframe && iframe.contentWindow) {
                                  iframe.contentWindow.postMessage({ type: 'UPDATE_COORDS', lat: lat, lng: newLng }, '*');
                                }
                              }
                            }}
                            placeholder="e.g. 77.594562"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 bg-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Reverse-Geocoded Address</label>
                        <textarea
                          rows={2}
                          value={fullAddress || location}
                          onChange={(e) => {
                            setFullAddress(e.target.value);
                            setLocation(e.target.value);
                          }}
                          placeholder="No physical address resolved yet"
                          className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">City</label>
                          <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="e.g. Bengaluru"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">State</label>
                          <input
                            type="text"
                            value={stateName}
                            onChange={(e) => setStateName(e.target.value)}
                            placeholder="e.g. Karnataka"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Country</label>
                          <input
                            type="text"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            placeholder="e.g. India"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Postal Code</label>
                          <input
                            type="text"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            placeholder="e.g. 560001"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Tags Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Apply Tags / Categories</label>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map(tag => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Notes for CRM profile */}
              {isEdit && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quick Text Log Notes</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_NOTES.map(qn => (
                      <button
                        type="button"
                        key={qn}
                        onClick={() => handleQuickNoteTap(qn)}
                        className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 text-[10px] font-bold rounded-lg transition"
                      >
                        + {qn}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Add customized store updates or quick notes here..."
                      className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={addNote}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
                    >
                      <Plus size={14} />
                      Log Note
                    </button>
                  </div>

                  {/* Render Logged Notes */}
                  {notes.filter(n => !n.text.startsWith('[System Log:')).length > 0 && (
                    <div className="space-y-3 bg-slate-50 border border-slate-100 p-4 rounded-xl max-h-72 overflow-y-auto">
                      {notes.filter(n => !n.text.startsWith('[System Log:')).map(note => {
                        const isExpanded = !!expandedNotes[note.id];
                        const isLong = note.text.length > 120;
                        const displayedText = isLong && !isExpanded ? `${note.text.slice(0, 110)}...` : note.text;
                        const isEditing = editingNoteId === note.id;

                        return (
                          <div key={note.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0 space-y-2">
                            {isEditing ? (
                              <div className="space-y-2">
                                <textarea
                                  value={editingNoteText}
                                  onChange={(e) => setEditingNoteText(e.target.value)}
                                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500"
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEditNote(note.id, editingNoteText)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-md text-[10px] font-bold"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingNoteId(null)}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-1 rounded-md text-[10px] font-bold"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-700 text-xs whitespace-pre-wrap">{displayedText}</p>
                                    {isLong && (
                                      <button
                                        type="button"
                                        onClick={() => setExpandedNotes(prev => ({ ...prev, [note.id]: !isExpanded }))}
                                        className="text-[10px] text-emerald-600 font-bold hover:underline mt-0.5 block"
                                      >
                                        {isExpanded ? 'Show Less' : 'Show More'}
                                      </button>
                                    )}
                                  </div>
                                  
                                  {/* Actions */}
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingNoteId(note.id);
                                        setEditingNoteText(note.text);
                                      }}
                                      title="Edit Note"
                                      className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition"
                                    >
                                      <Pencil size={11} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteNote(note.id)}
                                      title="Delete Note"
                                      className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-red-600 transition"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>
                                <span className="text-[9px] font-mono font-bold text-slate-400 block mt-1">
                                  {new Date(note.createdAt).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Action Bar */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                >
                  {saving ? 'Saving...' : isEdit ? 'Update Profile' : 'Register Profile'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Call Records and Audio Upload */}
          {activeTab === 'history' && lead && (
            <div className="space-y-6">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={16} className="text-emerald-600" />
                  <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Log a New Cold Call</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pipeline Stage on Call */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Resulting Lead Status</label>
                    <select
                      value={callStatusInput}
                      onChange={(e) => setCallStatusInput(e.target.value as Lead['currentStatus'])}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                    >
                      {PIPELINE_STAGES.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                  </div>

                  {/* Audio Recorder Component */}
                  <AudioRecorder
                    onAudioSaved={(base64, name, dur) => {
                      setCallAudioUrl(base64);
                      setCallAudioName(name);
                      setCallAudioDuration(dur);
                    }}
                    savedAudioUrl={callAudioUrl}
                    savedAudioName={callAudioName}
                    onClearAudio={() => {
                      setCallAudioUrl('');
                      setCallAudioName('');
                      setCallAudioDuration(0);
                    }}
                  />
                </div>

                {/* Quick note buttons for call record notes */}
                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-bold text-slate-600">Quick Tap Notes</label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_NOTES.map(qn => (
                      <button
                        type="button"
                        key={`call-qn-${qn}`}
                        onClick={() => handleQuickNoteCallTap(qn)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 text-[10px] font-bold rounded-lg transition"
                      >
                        + {qn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Call Conversation Notes Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600">Call Summary & Notes</label>
                  <textarea
                    rows={2}
                    value={callNotesInput}
                    onChange={(e) => setCallNotesInput(e.target.value)}
                    placeholder="Enter what did they say (e.g. interested but requested followup pricing)..."
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <button
                  type="button"
                  onClick={addCallRecord}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Plus size={15} />
                  Log Call details & Voice Recording
                </button>
              </div>

              {/* Call Records history log */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Historical Voice call records</h3>
                
                {calls.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                    <p className="text-xs font-medium text-slate-400">No calls registered under this profile</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {calls.map((call) => (
                      <div key={call.id} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-3xs space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
                              Status: {call.status}
                            </span>
                            {call.duration > 0 && (
                              <span className="text-[10px] font-mono text-slate-500 font-bold">
                                Duration: {call.duration}s
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">
                            {new Date(call.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-slate-700">{call.notes}</p>

                        {call.audioUrl && (
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-600 truncate max-w-xs flex items-center gap-1.5">
                              <AudioLines size={14} className="text-emerald-600 animate-pulse" />
                              {call.audioName || 'Voice_Note.webm'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const player = new Audio(call.audioUrl);
                                player.play().catch(e => console.error("Error playing historical audio:", e));
                              }}
                              className="text-xs bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold px-3 py-1 rounded-lg transition"
                            >
                              Play recording
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Meetings */}
          {activeTab === 'meetings' && lead && (
            <div className="space-y-6">
              <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-1.5">
                  <Calendar size={16} className="text-purple-600" />
                  <h3 className="text-xs font-bold text-purple-800 uppercase tracking-wider">Schedule a New Meeting</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Meeting Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Location / Platform</label>
                    <input
                      type="text"
                      value={meetingLoc}
                      onChange={(e) => setMeetingLoc(e.target.value)}
                      placeholder="e.g. Gandhi Bazar outlet, Zoom"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Result / Current Status</label>
                    <input
                      type="text"
                      value={meetingResult}
                      onChange={(e) => setMeetingResult(e.target.value)}
                      placeholder="e.g. Price pitch done, Demo completed"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Next Action Item</label>
                    <input
                      type="text"
                      value={meetingAction}
                      onChange={(e) => setMeetingAction(e.target.value)}
                      placeholder="e.g. Share quotation, follow up Wed"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addMeeting}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Plus size={15} />
                  Confirm and Log Meeting Tracker
                </button>
              </div>

              {/* Logged Meetings */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Scheduled Meetings Log</h3>
                
                {meetings.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                    <p className="text-xs font-medium text-slate-400">No scheduled meetings logged</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {meetings.map((meet) => (
                      <div key={meet.id} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-3xs space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-wrap gap-1">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <Calendar size={13} className="text-purple-600" />
                            {new Date(meet.meetingDate).toLocaleString()}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            Logged: {new Date(meet.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Location:</span>
                            <p className="font-semibold text-slate-700">{meet.location || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Result:</span>
                            <p className="font-semibold text-slate-700">{meet.result || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Next Action:</span>
                            <p className="font-semibold text-slate-700">{meet.nextAction || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Reminders */}
          {activeTab === 'reminders' && lead && (
            <div className="space-y-6">
              <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-1.5">
                  <Plus size={16} className="text-rose-600" />
                  <h3 className="text-xs font-bold text-rose-800 uppercase tracking-wider">Create a Followup Reminder</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Reminder Instruction *</label>
                    <input
                      type="text"
                      value={reminderText}
                      onChange={(e) => setReminderText(e.target.value)}
                      placeholder="e.g. Call Bright Mobiles at 4 PM"
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Reminder Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                    />
                  </div>
                </div>

                {reminderError && (
                  <div className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 p-2.5 rounded-xl flex items-center gap-1.5">
                    <AlertCircle size={13} />
                    {reminderError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={addReminder}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Plus size={15} />
                  Add Smart Reminder
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Scheduled Follow-ups</h3>
                
                {reminders.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                    <p className="text-xs font-medium text-slate-400">No followups scheduled</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reminders.map((rem) => {
                      const isEditing = editingReminderId === rem.id;
                      return (
                        <div
                          key={rem.id}
                          className={`p-3.5 border rounded-2xl flex flex-col gap-3 ${
                            rem.completed 
                              ? 'bg-slate-50 border-slate-100 text-slate-400 line-through' 
                              : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
                          }`}
                        >
                          {isEditing ? (
                            <div className="space-y-3 w-full">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  value={editingReminderText}
                                  onChange={(e) => setEditingReminderText(e.target.value)}
                                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                                />
                                <input
                                  type="datetime-local"
                                  value={editingReminderDate}
                                  onChange={(e) => setEditingReminderDate(e.target.value)}
                                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold bg-white"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditReminder(rem.id, editingReminderText, editingReminderDate, rem.completed)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                                >
                                  Save Change
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingReminderId(null)}
                                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-3 w-full">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold">{rem.text}</p>
                                <span className="text-[10px] font-mono font-bold text-rose-500 mt-1 block">
                                  Target Date: {new Date(rem.datetime).toLocaleString()}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await dbService.reminders.update(lead.id, rem.id, !rem.completed);
                                    fetchSubcollections(lead.id);
                                    onSaved();
                                  }}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-[10px] font-bold rounded-lg transition"
                                >
                                  {rem.completed ? 'Re-open' : 'Mark Done'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingReminderId(rem.id);
                                    setEditingReminderText(rem.text);
                                    setEditingReminderDate(rem.datetime);
                                  }}
                                  title="Edit Reminder"
                                  className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteReminder(rem.id)}
                                  title="Delete Reminder"
                                  className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-red-600 transition"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Proposal Generator */}
          {activeTab === 'proposal' && lead && (
            <div className="space-y-5">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-800">ChatGro Personalized Pitch Generator</h3>
                <p className="text-xs text-slate-500 font-medium">Instantly format custom sales pitch to dispatch directly via WhatsApp</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-inner relative">
                <div className="absolute right-3 top-3 bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full">
                  WhatsApp Friendly
                </div>
                
                <pre className="text-xs font-semibold text-slate-800 whitespace-pre-wrap font-sans bg-white border border-slate-200 rounded-xl p-4 max-h-72 overflow-y-auto leading-relaxed shadow-3xs">
                  {getProposalMessage()}
                </pre>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(getProposalMessage());
                    alert('Proposal copied to clipboard!');
                  }}
                  className="flex-1 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Copy Plain Text
                </button>
                <button
                  type="button"
                  onClick={shareProposalWhatsApp}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm animate-pulse"
                >
                  <Share2 size={14} />
                  Share on WhatsApp
                </button>
              </div>
            </div>
          )}

          {/* TAB 6: Chronological Timeline History */}
          {activeTab === 'timeline' && lead && (
            <div className="space-y-6">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock size={16} className="text-emerald-600" />
                  Chronological Store Audit Timeline
                </h3>
                <p className="text-xs text-slate-500 font-medium">Automatic system trails combined with logs, reminders, meetings and calls</p>
              </div>

              {getTimelineEvents().length === 0 ? (
                <div className="p-12 text-center border border-dashed border-slate-200 rounded-3xl bg-slate-50">
                  <p className="text-xs font-semibold text-slate-400">No events logged yet for this store.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-100 ml-3 pl-6 space-y-6 py-1">
                  {getTimelineEvents().map((event) => (
                    <div key={event.id} className="relative">
                      {/* Left Dot Icon */}
                      <span className={`absolute -left-[37px] top-0.5 w-7 h-7 rounded-full flex items-center justify-center border text-[11px] shadow-xs ${event.bg}`}>
                        <TimelineIcon name={event.icon} size={11} />
                      </span>
                      
                      {/* Event Content */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-800">{event.title}</h4>
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            {new Date(event.date).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-slate-500 max-w-2xl leading-relaxed">{event.subtitle}</p>
                        <span className="inline-flex text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                          {event.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
