import React, { useMemo } from 'react';
import type { TimelineMonth } from '../types';

interface ViolationsChartProps {
  data: TimelineMonth[];
}

const amendmentTypes = [
  { key: 'First', name: 'First Amendment' },
  { key: 'Fourth', name: 'Fourth Amendment' },
  { key: 'Fifth', name: 'Fifth Amendment' },
  { key: 'Sixth', name: 'Sixth Amendment' },
  { key: 'Eighth', name: 'Eighth Amendment' },
  { key: 'Fourteenth', name: 'Fourteenth Amendment' },
];

const ViolationsChart: React.FC<ViolationsChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    amendmentTypes.forEach(amendment => counts[amendment.name] = 0);

    data.forEach(month => {
      month.events.forEach(event => {
        amendmentTypes.forEach(amendment => {
          if (event.claim.includes(amendment.key)) {
            counts[amendment.name]++;
          }
        });
      });
    });

    return amendmentTypes
      .map(amendment => ({
        name: amendment.name,
        count: counts[amendment.name]
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const maxCount = useMemo(() => {
    return Math.max(...chartData.map(item => item.count), 0);
  }, [chartData]);

  return (
    <div className="bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-700 shadow-lg">
      <h2 className="text-3xl font-bold font-serif text-gray-100 mb-2">Violations by Amendment</h2>
      <p className="text-gray-400 mb-8">Frequency of alleged constitutional violations cited in the timeline.</p>
      
      <div className="space-y-4">
        {chartData.map(item => (
          <div key={item.name} className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-center">
            <div className="text-sm font-medium text-gray-300 md:text-right">{item.name}</div>
            <div className="md:col-span-2 flex items-center">
              <div className="w-full bg-gray-700 rounded-full h-6 flex items-center">
                <div
                  className="bg-yellow-500 h-6 rounded-full flex items-center justify-end px-2"
                  style={{ width: maxCount > 0 ? `${(item.count / maxCount) * 100}%` : '0%' }}
                >
                </div>
              </div>
              <span className="ml-4 font-bold text-lg text-gray-100">{item.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViolationsChart;