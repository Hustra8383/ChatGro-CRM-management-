import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { DailyStat } from '../types';

interface AnalyticsChartProps {
  data: DailyStat[];
}

export default function AnalyticsChart({ data }: AnalyticsChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-slate-50">
        <p className="text-sm font-medium text-slate-400">No call data logged yet</p>
        <p className="text-xs text-slate-400">Start logging cold calls to see your daily progress</p>
      </div>
    );
  }

  // Sort by date to ensure proper ordering
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-800">Daily Cold Calling Progress</h3>
        <p className="text-xs text-slate-500 font-medium">Daily summary of calls, interest responses, and rejections</p>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(str) => {
                try {
                  const dateObj = new Date(str);
                  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                } catch {
                  return str;
                }
              }}
            />
            <YAxis 
              stroke="#94a3b8" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff' }}
              labelStyle={{ fontWeight: 'bold', fontSize: '11px', color: '#38bdf8' }}
              itemStyle={{ fontSize: '11px' }}
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle" 
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', fontWeight: 500 }}
            />
            <Bar dataKey="totalCalls" name="Total Calls" fill="#475569" radius={[4, 4, 0, 0]} barSize={16} />
            <Bar dataKey="interested" name="Interested" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
            <Bar dataKey="rejected" name="Rejected" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={16} />
            <Bar dataKey="meetings" name="Meetings" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
