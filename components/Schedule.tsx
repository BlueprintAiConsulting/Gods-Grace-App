
import React, { useMemo } from 'react';
import { Job } from '../types';
import { Calendar as CalendarIcon, MapPin, Clock, User, ChevronRight } from 'lucide-react';
import { STATUS_COLORS } from '../constants';

interface ScheduleProps {
  jobs: Job[];
}

const Schedule: React.FC<ScheduleProps> = ({ jobs }) => {
  const groupedJobs = useMemo(() => {
    const groups: Record<string, Job[]> = {};
    
    // Sort by date
    const sorted = [...jobs]
      .filter(j => j.scheduledDate)
      .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime());

    sorted.forEach(job => {
      const date = job.scheduledDate!;
      if (!groups[date]) groups[date] = [];
      groups[date].push(job);
    });

    return groups;
  }, [jobs]);

  const dates = Object.keys(groupedJobs);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
       <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Field Schedule</h2>
        <p className="text-slate-500">Upcoming production timeline</p>
      </div>

      <div className="space-y-8">
        {dates.length > 0 ? dates.map(date => (
          <div key={date} className="relative pl-8 border-l-2 border-slate-200">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#143d2b] border-4 border-slate-50"></div>
            
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
              {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedJobs[date].map(job => (
                <div key={job.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${STATUS_COLORS[job.status]}`}>
                      {job.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">{job.id}</span>
                  </div>
                  
                  <h4 className="font-bold text-slate-900 mb-1 group-hover:text-[#143d2b] transition-colors">{job.clientName}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">{job.description}</p>
                  
                  <div className="space-y-2 border-t border-slate-50 pt-3">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Clock className="w-3 h-3 text-[#f4c430]" />
                      <span>{job.timeWindow || 'All Day'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <MapPin className="w-3 h-3 text-[#f4c430]" />
                      <span className="truncate">{job.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <User className="w-3 h-3 text-[#f4c430]" />
                      <span>Crew Lead: <span className="font-bold">{job.crewLead || 'TBD'}</span></span>
                    </div>
                  </div>

                  <button className="w-full mt-4 py-2 bg-slate-50 text-[#143d2b] rounded-xl text-xs font-bold hover:bg-[#143d2b] hover:text-white transition-colors flex items-center justify-center gap-1">
                    View Details <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )) : (
           <div className="py-20 text-center flex flex-col items-center bg-white rounded-3xl border border-dashed border-slate-200">
            <CalendarIcon className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="font-bold text-slate-800">No scheduled jobs found</h3>
            <p className="text-slate-500 text-sm max-w-xs mt-1">
              Jobs with a 'Scheduled Date' will appear here chronologically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule;
