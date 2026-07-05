export interface Note {
  id: string;
  leadId: string;
  text: string;
  createdAt: string;
}

export interface CallRecord {
  id: string;
  leadId: string;
  date: string;
  status: string;
  duration: number; // in seconds
  notes: string;
  summary?: string;
  audioUrl?: string; // base64 data URL or simulated reference
  audioName?: string;
  createdAt: string;
}

export interface Meeting {
  id: string;
  leadId: string;
  meetingDate: string;
  location: string;
  result: string;
  nextAction: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  leadId: string;
  text: string;
  datetime: string;
  completed: boolean;
  createdAt: string;
}

export interface Lead {
  id: string;
  businessName: string;
  ownerName: string;
  mobileNumber: string;
  whatsappNumber: string;
  category: string; // Niche: Mobile Shop, Restaurant, Gym, etc.
  location: string; // Text address
  lat?: number; // Coordinates for custom map view
  lng?: number; // Coordinates for custom map view
  latitude?: number;
  longitude?: number;
  source: string;
  dateAdded: string;
  currentStatus: 'New Lead' | 'Called' | 'Interested' | 'Meeting' | 'Client' | 'Rejected';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  fullAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface DailyStat {
  date: string; // YYYY-MM-DD
  totalCalls: number;
  interested: number;
  rejected: number;
  followups: number;
  meetings: number;
}
