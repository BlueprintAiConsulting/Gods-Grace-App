
import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  Download, 
  Plus, 
  MoreVertical, 
  ExternalLink, 
  Mail, 
  PhoneCall, 
  MapPin,
  Clock,
  ChevronRight,
  User,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Job } from '../types';
import { STATUS_COLORS } from '../constants';
import JobDetailsModal from './JobDetailsModal';

interface JobManagementProps {
  jobs: Job[];
  onAddJob: () => void;
}

const JobManagement: React.FC<JobManagementProps> = ({ jobs, onAddJob }) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: 'nextActionDate'; direction: 'asc' | 'desc' | null }>({
    key: 'nextActionDate',
    direction: null
  });

  // Filter for active customer jobs (not raw leads)
  const customerJobs = jobs.filter(j => !['Lead', 'Quoted', 'Rejected'].includes(j.status));
  
  const filteredAndSorted = useMemo(() => {
    let result = filterStatus === 'All' ? [...customerJobs] : customerJobs.filter(j => j.status === filterStatus);

    if (sortConfig.direction) {
      result.sort((a, b) => {
        const dateA = a.nextActionDate ? new Date(a.nextActionDate).getTime() : 0;
        const dateB = b.nextActionDate ? new Date(b.nextActionDate).getTime() : 0;

        if (dateA < dateB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (dateA > dateB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [customerJobs, filterStatus, sortConfig]);

  const toggleSort = () => {
    setSortConfig(prev => ({
      key: 'nextActionDate',
      direction: prev.direction === 'asc' ? 'desc' : prev.direction === 'desc' ? null : 'asc'
    }));
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Active Job Center</h2>
          <p className="text-slate-500">Managing operations and field fulfillment for God's Grace.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 border border-slate-200 rounded-xl hover:bg-white transition-colors">
            <Download className="w-5 h-5 text-slate-500" />
          </button>
          <button 
            onClick={onAddJob}
            className="bg-[#143d2b] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-[#1a4f38] transition-all shadow-lg shadow-[#143d2b]/20"
          >
            <Plus className="w-5 h-5" />
            New Service Entry
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-4 overflow-x-auto">
          {['All', 'Scheduled', 'In Progress', 'Completed', 'Follow-Up Needed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                filterStatus === status 
                  ? 'bg-[#143d2b] text-white shadow-md' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-[#143d2b]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Real Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Job Info</th>
                <th className="px-6 py-4">Field Data</th>
                <th className="px-6 py-4 cursor-pointer hover:text-[#143d2b] transition-colors group" onClick={toggleSort}>
                  <div className="flex items-center gap-2">
                    Next Action
                    {sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-[#143d2b]" /> : 
                     sortConfig.direction === 'desc' ? <ArrowDown className="w-3 h-3 text-[#143d2b]" /> : 
                     <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
                  </div>
                </th>
                <th className="px-6 py-4">Status & Health</th>
                <th className="px-6 py-4 text-center">Crew</th>
                <th className="px-6 py-4 text-right">Act. Hrs</th>
                <th className="px-6 py-4 text-right">Act. Labor $</th>
                <th className="px-6 py-4 text-right">Act. Mat $</th>
                <th className="px-6 py-4 text-right">Variance</th>
                <th className="px-6 py-4 text-right">Revenue</th>
                <th className="px-6 py-4 text-right">Margin</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSorted.map((job) => (
                <tr key={job.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#143d2b] mb-1">{job.id}</span>
                      <span className="font-black text-slate-900 text-sm group-hover:text-[#143d2b] transition-colors">{job.clientName}</span>
                      <span className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-[200px]">{job.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col text-xs text-slate-600 gap-1">
                      <span className="flex items-center gap-1.5 font-bold"><MapPin className="w-3 h-3 text-[#f4c430]" /> {job.address}</span>
                      <span className="text-slate-400 ml-4.5 font-medium">{job.cityArea}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">{job.nextAction || 'None'}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                        {job.nextActionDate ? new Date(job.nextActionDate).toLocaleDateString() : 'No date set'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase w-fit tracking-wider ${STATUS_COLORS[job.status] || 'bg-slate-100 text-slate-800'}`}>
                        {job.status}
                      </span>
                      <div className="flex items-center gap-2">
                         {job.jobWalkthroughComplete ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertCircle className="w-3 h-3 text-amber-500" />}
                         <span className="text-[9px] font-black text-slate-400 uppercase">Walkthrough</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center border-2 border-white shadow-sm overflow-hidden text-[#4a3728] font-black text-xs">
                        {job.crewLead?.substring(0,2) || '??'}
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 mt-1">{job.crewLead || 'TBD'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-xs font-bold text-slate-700">{job.actualLaborHours || '-'}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-xs font-bold text-slate-700">${(job.actualLaborCost || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-xs font-bold text-slate-700">${(job.actualMaterialCost || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className={`text-xs font-bold ${(job.jobCostingVariance || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ${(job.jobCostingVariance || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="text-sm font-black text-slate-900">${(job.actualRevenue || job.estRevenue).toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{job.paymentStatus}</div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className={`text-xs font-black ${job.estMargin >= 40 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {job.estMargin}%
                    </div>
                    <div className="w-16 h-1 bg-slate-100 rounded-full mt-1.5 ml-auto overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${job.estMargin >= 40 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                        style={{ width: `${job.estMargin}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setSelectedJob(job)}
                        title="View Detailed Master Sheet" 
                        className="p-2 bg-[#143d2b] text-white rounded-xl shadow-lg shadow-[#143d2b]/20 transition-all hover:scale-110"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAndSorted.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Search className="text-slate-300 w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-800">No active customer jobs</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">Check the Pipeline tab for new leads and pending quotes.</p>
          </div>
        )}
      </div>

      {selectedJob && <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  );
};

export default JobManagement;
