import React, { useMemo } from 'react';
import type { TimelineMonth } from '../types';

interface ViolationsChartProps {
  data: TimelineMonth[];
  isPrinting?: boolean;
}

const amendmentTypes = [
  { key: 'First', name: 'First Amendment' },
  { key: 'Fourth', name: 'Fourth Amendment' },
  { key: 'Fifth', name: 'Fifth Amendment' },
  { key: 'Sixth', name: 'Sixth Amendment' },
  { key: 'Eighth', name: 'Eighth Amendment' },
  { key: 'Fourteenth', name: 'Fourteenth Amendment' },
];

const ViolationsChart: React.FC<ViolationsChartProps> = ({ data, isPrinting = false }) => {
  const chartData = useMemo(() => {
    const counts: { [key:string]: number } = {};
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
    <div className={isPrinting ? "p-6 md:p-8 border border-gray-400" : "bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-700 shadow-lg"}>
      <h2 className={`text-3xl font-bold font-serif mb-2 ${isPrinting ? "text-black" : "text-gray-100"}`}>Violations by Amendment</h2>
      <p className={`mb-8 ${isPrinting ? "text-gray-700" : "text-gray-400"}`}>Frequency of alleged constitutional violations cited in the timeline.</p>
      
      <div className="space-y-4">
        {chartData.map(item => (
          <div key={item.name} className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4 items-center">
            <div className={`text-sm font-medium md:text-right ${isPrinting ? "text-gray-800" : "text-gray-300"}`}>{item.name}</div>
            <div className="md:col-span-2 flex items-center">
              <div className={`w-full rounded-full h-6 flex items-center ${isPrinting ? "bg-gray-300" : "bg-gray-700"}`}>
                <div
                  className={`h-6 rounded-full flex items-center justify-end px-2 ${isPrinting ? "bg-gray-600 text-white" : "bg-yellow-500"}`}
                  style={{ width: maxCount > 0 ? `${(item.count / maxCount) * 100}%` : '0%' }}
                >
                </div>
              </div>
              <span className={`ml-4 font-bold text-lg ${isPrinting ? "text-black" : "text-gray-100"}`}>{item.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViolationsChart;