
import React from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Clipboard, 
  Truck, 
  DollarSign, 
  Briefcase,
  AlertCircle,
  Clock,
  CheckCircle2,
  Users
} from 'lucide-react';
import { Job } from '../types';
import { STATUS_COLORS } from '../constants';

interface JobDetailsModalProps {
  job: Job;
  onClose: () => void;
}

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ job, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-[#143d2b] p-8 text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-[#f4c430] text-[#143d2b] px-3 py-1 rounded-full font-black text-[10px] tracking-widest uppercase">
                  {job.id}
                </span>
                <span className={`px-3 py-1 rounded-full border-2 text-[10px] font-black tracking-widest uppercase ${STATUS_COLORS[job.status]}`}>
                  {job.status}
                </span>
              </div>
              <h2 className="text-4xl font-black tracking-tighter mb-1">{job.clientName}</h2>
              <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm font-medium">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#f4c430]" /> {job.address}, {job.cityArea}</span>
                <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-[#f4c430]" /> {job.phone}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Est. Revenue</p>
              <p className="text-3xl font-black text-[#f4c430]">${job.estRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Left Column: Job Intelligence */}
            <div className="md:col-span-2 space-y-8">
              {/* Description & Notes */}
              <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <Clipboard className="w-5 h-5 text-[#143d2b]" />
                  <h3 className="font-bold text-slate-800">Scope of Work</h3>
                </div>
                <p className="text-slate-600 font-medium mb-4">{job.description}</p>
                {job.notes && (
                   <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 italic text-slate-500 text-sm">
                     " {job.notes} "
                   </div>
                )}
              </section>

              {/* Load Sheet / Field Prep */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <Truck className="w-5 h-5 text-[#143d2b]" />
                    <h3 className="font-bold text-slate-800">Materials & Load</h3>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl min-h-[80px]">
                    <p className="text-xs font-bold text-slate-700 leading-relaxed">{job.materialsList || 'No list provided'}</p>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Equipment Needed</h4>
                    <p className="text-xs font-semibold text-slate-600">{job.equipmentNeeded || 'Standard crew gear'}</p>
                  </div>
                </section>

                <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="w-5 h-5 text-[#143d2b]" />
                    <h3 className="font-bold text-slate-800">Crew Info</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-500 uppercase">Crew Lead</span>
                      <span className="text-sm font-bold text-slate-900">{job.crewLead || 'Pending'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-500 uppercase">Crew Size</span>
                      <span className="text-sm font-bold text-slate-900">{job.crewSize || '0'} People</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-500 uppercase">Est. Hours</span>
                      <span className="text-sm font-bold text-slate-900">{job.estHours || '0'} hrs</span>
                    </div>
                  </div>
                </section>
              </div>

              {/* Costing & Financials Actuals */}
              <section className="bg-white p-8 rounded-[2rem] border-2 border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-6 h-6 text-[#143d2b]" />
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Job Costing & Profitability</h3>
                  </div>
                  <div className="bg-slate-100 px-4 py-1 rounded-full text-[10px] font-black uppercase text-slate-500">
                    Auto-calculated
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Actual Rev</p>
                    <p className="text-xl font-black text-slate-900">${job.actualRevenue || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Actual Profit</p>
                    <p className="text-xl font-black text-emerald-600">${job.actualProfit || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Margin %</p>
                    <p className="text-xl font-black text-blue-600">{job.estMargin}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Cost Variance</p>
                    <p className="text-xl font-black text-rose-500">-${job.jobCostingVariance || 0}</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: CRM & Pipeline */}
            <div className="space-y-6">
              <section className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-900/20">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#f4c430]" /> Pipeline Status
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50 uppercase font-bold">Lead Source</span>
                    <span className="font-bold">{job.leadSource}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50 uppercase font-bold">Follow-ups</span>
                    <span className="bg-[#f4c430] text-[#143d2b] px-2 py-0.5 rounded-full font-black">{job.followUpCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/50 uppercase font-bold">Last Contact</span>
                    <span className="font-bold">{job.lastContactDate || 'Unknown'}</span>
                  </div>
                  <div className="h-px bg-white/10 my-4"></div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                       {job.jobWalkthroughComplete ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <AlertCircle className="w-3 h-3 text-white/20" />}
                       <span className={job.jobWalkthroughComplete ? 'text-emerald-400' : 'text-white/40'}>WALKTHROUGH COMPLETE</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                       {job.recurringServicePitched ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <AlertCircle className="w-3 h-3 text-white/20" />}
                       <span className={job.recurringServicePitched ? 'text-emerald-400' : 'text-white/40'}>RECURRING PITCHED</span>
                    </div>
                  </div>
                </div>
              </section>

              <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Site Access
                </h4>
                <p className="text-xs font-medium text-amber-800 leading-relaxed italic">
                  "{job.siteAccessNotes || 'Standard driveway access.'}"
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button className="w-full bg-[#143d2b] text-white py-4 rounded-2xl font-black text-sm hover:scale-[1.02] transition-transform shadow-lg shadow-[#143d2b]/10">
                  Update Next Action
                </button>
                <button className="w-full bg-white border-2 border-slate-100 text-slate-900 py-4 rounded-2xl font-black text-sm hover:bg-slate-50 transition-colors">
                  Log Site Photos
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsModal;
