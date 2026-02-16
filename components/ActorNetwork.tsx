import React, { useMemo } from 'react';
import type { TimelineMonth, ActorProfile } from '../types';

interface ActorNetworkProps {
  timelineData: TimelineMonth[];
}

const ActorNetwork: React.FC<ActorNetworkProps> = ({ timelineData }) => {
  
  const actors = useMemo(() => {
    const allEvents = timelineData.flatMap(m => m.events);
    const actorMap = new Map<string, { role: string, events: any[], violations: Set<string> }>();

    // 1. Dynamic Extraction
    allEvents.forEach(ev => {
        if (!ev.actor) return;
        
        // Normalize name
        const name = ev.actor.trim();
        
        if (!actorMap.has(name)) {
            // Attempt to infer role from name context
            let role = 'Official';
            const lowerName = name.toLowerCase();
            if (lowerName.includes('judge') || lowerName.includes('court') || lowerName.includes('justice')) role = 'Judge';
            else if (lowerName.includes('da') || lowerName.includes('prosecut') || lowerName.includes('state')) role = 'Prosecutor';
            else if (lowerName.includes('pd') || lowerName.includes('defender') || lowerName.includes('counsel') || lowerName.includes('attorney')) role = 'Defense Counsel';
            else if (lowerName.includes('clerk')) role = 'Clerk';
            else if (lowerName.includes('sheriff') || lowerName.includes('police') || lowerName.includes('officer')) role = 'Law Enforcement';

            actorMap.set(name, { role, events: [], violations: new Set() });
        }

        const entry = actorMap.get(name)!;
        entry.events.push(ev);
        if (ev.claim) entry.violations.add(ev.claim);
    });

    // 2. Score Calculation
    const profiles: ActorProfile[] = Array.from(actorMap.entries()).map(([name, data]) => {
        let score = 0;
        
        data.events.forEach(ev => {
            let eventScore = 10;
            const text = `${ev.title} ${ev.cause} ${ev.effect}`.toLowerCase();
            
            // Adverse Action Weights
            if (text.includes('retaliation') || text.includes('strike') || text.includes('stricken')) eventScore += 20;
            if (text.includes('warrant') || text.includes('contempt') || text.includes('sanction')) eventScore += 25;
            if (text.includes('competency') || text.includes('evaluation')) eventScore += 30;
            if (text.includes('denied') || text.includes('revoked')) eventScore += 15;
            
            score += eventScore;
        });

        // Normalize score 0-100
        const heatScore = Math.min(100, Math.round(score / (data.events.length || 1) * (Math.log(data.events.length + 1) * 2)));

        return {
            name: name,
            role: data.role as any,
            eventCount: data.events.length,
            heatScore: heatScore || 0,
            associatedViolations: Array.from(data.violations),
            lastActive: data.events.length > 0 ? data.events[data.events.length - 1].date : 'N/A'
        };
    });

    return profiles.sort((a, b) => b.heatScore - a.heatScore);
  }, [timelineData]);

  const getHeatColor = (score: number) => {
      if (score > 80) return 'text-red-500 border-red-500 bg-red-900/20';
      if (score > 50) return 'text-orange-400 border-orange-400 bg-orange-900/20';
      return 'text-yellow-400 border-yellow-400 bg-yellow-900/20';
  };

  if (actors.length === 0) {
      return (
        <div className="bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-700 shadow-lg animate-fade-in min-h-[calc(100vh-140px)] flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-3xl font-bold font-serif text-gray-500 mb-2">Actor Network Empty</h2>
                <p className="text-gray-400">Add timeline events with "Actor" fields to populate the network graph.</p>
            </div>
        </div>
      );
  }

  return (
    <div className="bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-700 shadow-lg animate-fade-in min-h-[calc(100vh-140px)]">
      <div className="mb-8 border-b border-gray-600 pb-4">
        <h2 className="text-3xl font-bold font-serif text-gray-100">Actor Heat Index</h2>
        <p className="text-gray-400 mt-2">Entity graph tracking involvement, procedural frequency, and misconduct correlation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {actors.map(actor => (
            <div key={actor.name} className={`p-6 rounded-lg border-2 relative overflow-hidden ${getHeatColor(actor.heatScore).split(' ')[1]}`}>
                <div className={`absolute top-0 right-0 p-4 text-4xl font-bold opacity-10 ${getHeatColor(actor.heatScore).split(' ')[0]}`}>
                    {actor.heatScore}
                </div>
                
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-white truncate max-w-[200px]" title={actor.name}>{actor.name}</h3>
                        <span className="text-xs font-mono uppercase text-gray-400">{actor.role}</span>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className={`h-2 rounded-full ${actor.heatScore > 80 ? 'bg-red-500' : actor.heatScore > 50 ? 'bg-orange-500' : 'bg-yellow-500'}`} style={{ width: `${actor.heatScore}%` }}></div>
                    </div>
                    <div className="flex justify-between text-xs mt-1 text-gray-500">
                        <span>Reliability</span>
                        <span>Risk Level: {actor.heatScore > 80 ? 'CRITICAL' : actor.heatScore > 50 ? 'HIGH' : 'MODERATE'}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm border-b border-gray-700 pb-1">
                        <span className="text-gray-400">Timeline Events</span>
                        <span className="text-white font-mono">{actor.eventCount}</span>
                    </div>
                    <div className="flex justify-between text-sm border-b border-gray-700 pb-1">
                        <span className="text-gray-400">Last Active</span>
                        <span className="text-white font-mono">{actor.lastActive}</span>
                    </div>
                </div>

                <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-1">Associated Violation Types:</p>
                    <div className="flex flex-wrap gap-1">
                        {actor.associatedViolations.slice(0, 3).map((v, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-900 rounded text-[10px] text-gray-300 border border-gray-700 truncate max-w-full">
                                {v ? v.split('(')[0] : 'Unknown'}
                            </span>
                        ))}
                        {actor.associatedViolations.length > 3 && (
                            <span className="px-2 py-0.5 bg-gray-900 rounded text-[10px] text-gray-500 border border-gray-700">
                                +{actor.associatedViolations.length - 3} more
                            </span>
                        )}
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default ActorNetwork;