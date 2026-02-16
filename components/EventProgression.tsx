import React, { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import type { TimelineMonth } from '../types';

interface EventProgressionProps {
  data: TimelineMonth[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 shadow-2xl rounded-sm">
        <p className="text-[10px] font-hud text-cyan-500 uppercase mb-1">{payload[0].payload.month}</p>
        <p className="text-xl font-bold font-mono text-white">
          {payload[0].value} <span className="text-xs text-gray-400 font-normal">EVENTS</span>
        </p>
      </div>
    );
  }
  return null;
};

const EventProgression: React.FC<EventProgressionProps> = ({ data }) => {
  const chartData = useMemo(() => {
    return data.map(m => ({
      month: m.month,
      count: m.events.length,
      // For axis display, shorten month names
      shortMonth: m.month.split(' ')[0].substring(0, 3) + ' ' + m.month.split(' ')[1].substring(2)
    }));
  }, [data]);

  if (chartData.length === 0) return null;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
          <XAxis 
            dataKey="shortMonth" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }} 
            dy={10}
          />
          <YAxis 
            hide 
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="count" 
            stroke="#06b6d4" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorCount)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EventProgression;