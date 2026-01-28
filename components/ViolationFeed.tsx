
import React from 'react';
import { TrafficViolation } from '../types';
import { AlertCircle, ShieldAlert, Car, MapPin, Clock } from 'lucide-react';

interface ViolationFeedProps {
  violations: TrafficViolation[];
}

const ViolationFeed: React.FC<ViolationFeedProps> = ({ violations }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 border-red-500/50 bg-red-500/10';
      case 'medium': return 'text-amber-400 border-amber-500/50 bg-amber-500/10';
      default: return 'text-blue-400 border-blue-500/50 bg-blue-500/10';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'speeding': return <ShieldAlert size={18} />;
      case 'crossing': return <AlertCircle size={18} />;
      case 'red_light': return <AlertCircle size={18} />;
      case 'invalid_plate': return <Car size={18} />;
      default: return <ShieldAlert size={18} />;
    }
  };

  return (
    <div className="flex flex-col gap-3 h-[400px] overflow-y-auto pr-2">
      {violations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
          <ShieldAlert size={32} />
          <p>No active violations detected.</p>
        </div>
      ) : (
        violations.map((v) => (
          <div key={v.id} className={`p-4 rounded-lg border flex flex-col gap-2 transition-all hover:scale-[1.02] ${getSeverityColor(v.severity)}`}>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider">
                {getIcon(v.type)}
                {v.type.replace('_', ' ')}
              </span>
              <span className="text-[10px] flex items-center gap-1 opacity-70">
                <Clock size={10} /> {v.timestamp}
              </span>
            </div>
            <p className="text-xs font-medium">{v.details}</p>
            <div className="flex items-center gap-1 text-[10px] opacity-70">
              <MapPin size={10} /> {v.location}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ViolationFeed;
