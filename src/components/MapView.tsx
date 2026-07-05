import React, { useState } from 'react';
import { Lead } from '../types';
import { MapPin, Navigation, Info, Layers, Compass } from 'lucide-react';

interface MapViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

export default function MapView({ leads, onSelectLead }: MapViewProps) {
  const [selectedPin, setSelectedPin] = useState<Lead | null>(null);

  // Filter leads that have latitude and longitude
  const leadsWithCoords = leads.filter((l) => l.lat !== undefined && l.lng !== undefined);

  // Find boundaries to scale coordinates to our visual canvas
  let minLat = 12.9;
  let maxLat = 13.1;
  let minLng = 77.5;
  let maxLng = 77.7;

  if (leadsWithCoords.length > 0) {
    const lats = leadsWithCoords.map((l) => l.lat!);
    const lngs = leadsWithCoords.map((l) => l.lng!);
    minLat = Math.min(...lats) - 0.01;
    maxLat = Math.max(...lats) + 0.01;
    minLng = Math.min(...lngs) - 0.01;
    maxLng = Math.max(...lngs) + 0.01;
  }

  // Fallback defaults if difference is too small
  if (maxLat - minLat < 0.005) {
    minLat -= 0.01;
    maxLat += 0.01;
  }
  if (maxLng - minLng < 0.005) {
    minLng -= 0.01;
    maxLng += 0.01;
  }

  // Calculate percentage positions on a 100% grid
  const getPercentPos = (lat: number, lng: number) => {
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = 100 - ((lat - minLat) / (maxLat - minLat)) * 100; // Invert Y for screen coordinates
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Compass size={16} className="text-emerald-600" />
            Market Walking Route Planner
          </h3>
          <p className="text-xs text-slate-500 font-medium">Visualizing coordinates for offline field sales visits</p>
        </div>
        <div className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-1 rounded-full self-start flex items-center gap-1">
          <Layers size={10} />
          {leadsWithCoords.length} plotted of {leads.length} leads
        </div>
      </div>

      {leadsWithCoords.length === 0 ? (
        <div className="h-64 border border-dashed border-slate-200 bg-slate-50 rounded-xl flex flex-col items-center justify-center p-6 text-center">
          <MapPin size={28} className="text-slate-400 mb-2" />
          <h4 className="text-xs font-bold text-slate-700">No Location Coordinates Registered</h4>
          <p className="text-[11px] text-slate-400 max-w-sm mt-1">
            Edit a lead profile to enter their Market Latitude & Longitude coordinates to trace optimal walking routes.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Visual Map Canvas */}
          <div className="lg:col-span-2 relative h-80 bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-800">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"></div>
            
            {/* Map Accents */}
            <div className="absolute left-4 top-4 z-10 bg-slate-800/80 backdrop-blur-xs border border-slate-700 px-2 py-1 rounded-md text-[9px] text-slate-300 font-mono">
              Market Coordinates Grid
            </div>

            {/* Render Walking Route Line */}
            {leadsWithCoords.length > 1 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {leadsWithCoords.map((lead, index) => {
                  if (index === 0) return null;
                  const prev = leadsWithCoords[index - 1];
                  const p1 = getPercentPos(prev.lat!, prev.lng!);
                  const p2 = getPercentPos(lead.lat!, lead.lng!);
                  return (
                    <line
                      key={`route-${index}`}
                      x1={`${p1.x}%`}
                      y1={`${p1.y}%`}
                      x2={`${p2.x}%`}
                      y2={`${p2.y}%`}
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      className="animate-pulse"
                    />
                  );
                })}
              </svg>
            )}

            {/* Pins */}
            {leadsWithCoords.map((lead) => {
              const { x, y } = getPercentPos(lead.lat!, lead.lng!);
              const isSelected = selectedPin?.id === lead.id;

              return (
                <button
                  key={lead.id}
                  onClick={() => setSelectedPin(lead)}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group"
                >
                  <div className="relative flex flex-col items-center">
                    {/* Tooltip Label */}
                    <div className="absolute bottom-full mb-1.5 hidden group-hover:block bg-slate-950 text-white text-[9px] font-bold px-2 py-1 rounded-sm whitespace-nowrap shadow-md border border-slate-800">
                      {lead.businessName}
                    </div>

                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isSelected 
                        ? 'bg-emerald-500 text-white scale-110 shadow-lg ring-4 ring-emerald-300' 
                        : 'bg-slate-800 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/50'
                    }`}>
                      <MapPin size={15} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Location Sidebar Panel */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Optimal Walking Route Queue
            </h4>
            
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {leadsWithCoords.map((lead, index) => (
                <div
                  key={lead.id}
                  onClick={() => setSelectedPin(lead)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                    selectedPin?.id === lead.id
                      ? 'border-emerald-500 bg-emerald-50/50'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-[10px] font-bold font-mono text-slate-600 flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-slate-800 truncate">{lead.businessName}</h5>
                      <p className="text-[10px] text-slate-500 font-medium truncate">{lead.location}</p>
                      <p className="text-[9px] font-mono text-slate-400 mt-1">
                        Lat: {lead.lat?.toFixed(5)}, Lng: {lead.lng?.toFixed(5)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedPin && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex items-start gap-1.5 text-slate-800">
                  <Info size={14} className="text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold">{selectedPin.businessName}</h5>
                    <p className="text-[11px] text-slate-500 font-medium">Owner: {selectedPin.ownerName || 'N/A'}</p>
                    <p className="text-[11px] text-slate-500 font-medium">Phone: {selectedPin.mobileNumber}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-1 border-t border-slate-200">
                  <button
                    onClick={() => onSelectLead(selectedPin)}
                    className="flex-1 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-2 rounded-lg text-center flex items-center justify-center gap-1 transition"
                  >
                    <Navigation size={11} />
                    View Details
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
