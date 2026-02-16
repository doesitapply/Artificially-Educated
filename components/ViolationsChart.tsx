import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import type { TimelineMonth } from '../types';

interface ViolationsChartProps {
  data: TimelineMonth[];
  isPrinting?: boolean;
}

const AMENDMENTS = [
  { key: 'First', name: '1st Am.', full: 'First Amendment', color: '#06b6d4' },
  { key: 'Fourth', name: '4th Am.', full: 'Fourth Amendment', color: '#3b82f6' },
  { key: 'Fifth', name: '5th Am.', full: 'Fifth Amendment', color: '#6366f1' },
  { key: 'Sixth', name: '6th Am.', full: 'Sixth Amendment', color: '#8b5cf6' },
  { key: 'Eighth', name: '8th Am.', full: 'Eighth Amendment', color: '#ec4899' },
  { key: 'Fourteenth', name: '14th Am.', full: 'Fourteenth Amendment', color: '#f43f5e' },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 shadow-2xl rounded-sm">
        <p className="text-[10px] font-hud text-gray-500 uppercase mb-1">{data.full}</p>
        <p className="text-xl font-bold font-mono text-white">
          {data.count} <span className="text-xs text-gray-400 font-normal">VIOLATIONS</span>
        </p>
      </div>
    );
  }
  return null;
};

const ViolationsChart: React.FC<ViolationsChartProps> = ({ data, isPrinting = false }) => {
  const chartData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    AMENDMENTS.forEach(a => counts[a.key] = 0);

    data.forEach(month => {
      month.events.forEach(event => {
        AMENDMENTS.forEach(a => {
          if (event.claim && event.claim.includes(a.key)) {
            counts[a.key]++;
          }
        });
      });
    });

    return AMENDMENTS
      .map(a => ({
        ...a,
        count: counts[a.key]
      }))
      .filter(item => item.count > 0);
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-600 font-mono italic">
        Insufficient data for violation profiling.
      </div>
    );
  }

  return (
    <div className={`w-full ${isPrinting ? 'h-80' : 'h-64'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold', fontFamily: 'JetBrains Mono' }}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ViolationsChart;