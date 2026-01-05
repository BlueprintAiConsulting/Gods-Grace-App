
import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  ArrowDown,
  Calendar,
  X,
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  CloudSun,
  Briefcase,
  ChevronDown
} from 'lucide-react';
import { Job } from '../types';
import { STATUS_COLORS } from '../constants';
import JobDetailsModal from './JobDetailsModal';

interface JobManagementProps {
  jobs: Job[];
  onAddJob: () => void;
  onUpdateJob: (job: Job) => void;
}

type DateFilterType = 'All' | 'Overdue' | 'Today' | 'This Week' | 'Next Week';

interface WeatherData {
  temp: number;
  conditionCode: number;
  windSpeed: number;
  precip: number;
  humidity: number;
}

const JobManagement: React.FC<JobManagementProps> = ({ jobs, onAddJob, onUpdateJob }) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterJobType, setFilterJobType] = useState<string>('All');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: 'nextActionDate'; direction: 'asc' | 'desc' | null }>({
    key: 'nextActionDate',
    direction: null
  });

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<DateFilterType>('All');
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const dateFilterRef = useRef<HTMLDivElement>(null);

  // Weather State
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target as Node)) {
        setIsDateFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Weather for York, PA (HQ)
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=39.9626&longitude=-76.7277&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America%2FNew_York');
        const data = await res.json();
        if (data.current) {
          setWeather({
            temp: data.current.temperature_2m,
            conditionCode: data.current.weather_code,
            windSpeed: data.current.wind_speed_10m,
            precip: data.current.precipitation,
            humidity: data.current.relative_humidity_2m
          });
        }
      } catch (e) {
        console.error("Weather fetch failed", e);
      }
    };
    fetchWeather();
  }, []);

  // Filter for active customer jobs (not raw leads)
  const customerJobs = jobs.filter(j => !['Lead', 'Quoted', 'Rejected'].includes(j.status));

  // Extract unique job types for filter
  const uniqueJobTypes = useMemo(() => {
    const types = new Set(customerJobs.map(j => j.jobType).filter(Boolean));
    return ['All', ...Array.from(types).sort()];
  }, [customerJobs]);
  
  const filteredAndSorted = useMemo(() => {
    let result = [...customerJobs];

    // 1. Filter by Status
    if (filterStatus !== 'All') {
      result = result.filter(j => j.status === filterStatus);
    }

    // 2. Filter by Job Type
    if (filterJobType !== 'All') {
      result = result.filter(j => j.jobType === filterJobType);
    }

    // 3. Filter by Date (Next Action Date)
    if (dateFilter !== 'All') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      result = result.filter(job => {
        if (!job.nextActionDate) return false;
        
        // Handle timezone offsets by just taking the date part string comparison or creating date with local time
        // Assuming YYYY-MM-DD string format from input
        const [year, month, day] = job.nextActionDate.split('-').map(Number);
        const actionDate = new Date(year, month - 1, day); 
        actionDate.setHours(0, 0, 0, 0);

        if (dateFilter === 'Overdue') {
          return actionDate < today;
        }
        
        if (dateFilter === 'Today') {
          return actionDate.getTime() === today.getTime();
        }

        if (dateFilter === 'This Week') {
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
          const endOfWeek = new Date(today);
          endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // Saturday
          return actionDate >= startOfWeek && actionDate <= endOfWeek;
        }

        if (dateFilter === 'Next Week') {
          const startOfNext = new Date(today);
          startOfNext.setDate(today.getDate() - today.getDay() + 7);
          const endOfNext = new Date(today);
          endOfNext.setDate(today.getDate() - today.getDay() + 13);
          return actionDate >= startOfNext && actionDate <= endOfNext;
        }

        return true;
      });
    }

    // 4. Sort
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
  }, [customerJobs, filterStatus, filterJobType, sortConfig, dateFilter]);

  const toggleSort = () => {
    setSortConfig(prev => ({
      key: 'nextActionDate',
      direction: prev.direction === 'asc' ? 'desc' : prev.direction === 'desc' ? null : 'asc'
    }));
  };

  const handleMarkComplete = (e: React.MouseEvent, job: Job) => {
    e.stopPropagation();
    onUpdateJob({ ...job, status: 'Completed' });
  };

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="w-8 h-8 text-[#f4c430]" />;
    if (code <= 3) return <CloudSun className="w-8 h-8 text-slate-400" />;
    if (code <= 48) return <Cloud className="w-8 h-8 text-slate-400" />;
    if (code <= 67) return <CloudRain className="w-8 h-8 text-blue-400" />;
    if (code <= 77) return <CloudSnow className="w-8 h-8 text-blue-200" />;
    if (code <= 82) return <CloudRain className="w-8 h-8 text-blue-500" />;
    return <CloudLightning className="w-8 h-8 text-purple-500" />;
  };

  const isBadWeather = (w: WeatherData) => {
    // Codes > 50 generally mean precipitation/fog
    return w.conditionCode >= 50 || w.precip > 0.1 || w.windSpeed > 20;
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

      {/* Weather & Field Conditions Widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="md:col-span-3 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="bg-sky-50 p-3 rounded-2xl">
                  {weather ? getWeatherIcon(weather.conditionCode) : <Cloud className="w-8 h-8 text-slate-300" />}
               </div>
               <div>
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    Current Field Conditions 
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-200 px-2 py-0.5 rounded-full">York, PA</span>
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                     <span className="flex items-center gap-1"><Thermometer className="w-4 h-4 text-rose-400" /> {weather?.temp ?? '--'}°F</span>
                     <span className="flex items-center gap-1"><Droplets className="w-4 h-4 text-blue-400" /> {weather?.humidity ?? '--'}%</span>
                     <span className="flex items-center gap-1"><Wind className="w-4 h-4 text-slate-400" /> {weather?.windSpeed ?? '--'} mph</span>
                     {weather && weather.precip > 0 && (
                       <span className="flex items-center gap-1 text-blue-600 font-bold"><CloudRain className="w-4 h-4" /> {weather.precip}" Rain</span>
                     )}
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto bg-slate-50 p-3 rounded-xl border border-slate-100">
               <div className="flex-1 md:flex-none">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Operational Status</p>
                  {weather ? (
                    <div className={`flex items-center gap-2 font-bold ${isBadWeather(weather) ? 'text-amber-600' : 'text-emerald-600'}`}>
                       {isBadWeather(weather) ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                       {isBadWeather(weather) ? 'Potential Delays (Weather)' : 'Good for Operations'}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm">Loading data...</div>
                  )}
               </div>
               <div className="hidden md:block w-px h-10 bg-slate-200"></div>
               <div className="hidden md:block text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Jobs</p>
                  <p className="text-xl font-black text-slate-900">{customerJobs.filter(j => j.status === 'In Progress' || j.status === 'Scheduled').length}</p>
               </div>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between overflow-x-auto gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
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

            <div className="w-px h-6 bg-slate-200 hidden sm:block"></div>

            <div className="relative group">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 group-hover:text-[#143d2b] transition-colors" />
              <select
                value={filterJobType}
                onChange={(e) => setFilterJobType(e.target.value)}
                className="bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg pl-9 pr-8 py-1.5 outline-none focus:border-[#143d2b] hover:border-slate-300 transition-colors cursor-pointer shadow-sm appearance-none"
              >
                {uniqueJobTypes.map(type => (
                  <option key={type} value={type}>{type === 'All' ? 'All Job Types' : type}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>
          </div>
          
          {/* Active Filters Display */}
          {dateFilter !== 'All' && (
            <div className="flex items-center gap-2 animate-in fade-in">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Filter:</span>
              <button 
                onClick={() => setDateFilter('All')}
                className="flex items-center gap-1 pl-3 pr-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors"
              >
                Date: {dateFilter} <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Real Data Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4">Job Info</th>
                <th className="px-6 py-4">Field Data</th>
                
                {/* Enhanced Next Action Header with Filter */}
                <th className="px-6 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:text-[#143d2b] transition-colors group" 
                      onClick={toggleSort}
                    >
                      Next Action
                      {sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-[#143d2b]" /> : 
                       sortConfig.direction === 'desc' ? <ArrowDown className="w-3 h-3 text-[#143d2b]" /> : 
                       <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
                    </div>
                    
                    {/* Date Filter Dropdown */}
                    <div className="relative" ref={dateFilterRef}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDateFilterOpen(!isDateFilterOpen);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          dateFilter !== 'All' 
                            ? 'bg-[#f4c430] text-[#143d2b]' 
                            : 'hover:bg-slate-200 text-slate-400'
                        }`}
                      >
                        <Filter className="w-3 h-3" />
                      </button>

                      {isDateFilterOpen && (
                        <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100">
                           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
                             Filter Date
                           </div>
                           {(['All', 'Overdue', 'Today', 'This Week', 'Next Week'] as DateFilterType[]).map((option) => (
                             <button
                                key={option}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDateFilter(option);
                                  setIsDateFilterOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between ${
                                  dateFilter === option 
                                    ? 'bg-[#143d2b] text-white' 
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                             >
                               {option}
                               {dateFilter === option && <CheckCircle2 className="w-3 h-3" />}
                             </button>
                           ))}
                        </div>
                      )}
                    </div>
                  </div>
                </th>

                <th className="px-6 py-4">Status & Health</th>
                <th className="px-6 py-4 text-center">Crew</th>
                <th className="px-6 py-4 text-right">Act. Hours</th>
                <th className="px-6 py-4 text-right">Labor Cost</th>
                <th className="px-6 py-4 text-right">Mat. Cost</th>
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
                      <span className="ml-4.5 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[9px] font-bold uppercase w-fit border border-slate-200">
                        {job.jobType}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">{job.nextAction || 'None'}</span>
                      <span className={`text-[10px] font-bold uppercase mt-0.5 flex items-center gap-1 ${
                         // Highlight Overdue dates
                         job.nextActionDate && new Date(job.nextActionDate) < new Date(new Date().setHours(0,0,0,0)) && job.status !== 'Completed'
                           ? 'text-rose-500' 
                           : 'text-slate-400'
                      }`}>
                        {job.nextActionDate && new Date(job.nextActionDate) < new Date(new Date().setHours(0,0,0,0)) && job.status !== 'Completed' && <AlertCircle className="w-3 h-3" />}
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
                    <span className="text-xs font-bold text-slate-700">
                      {job.actualLaborHours !== undefined ? job.actualLaborHours : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-xs font-bold text-slate-700">
                      {job.actualLaborCost !== undefined 
                        ? `$${job.actualLaborCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                        : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className="text-xs font-bold text-slate-700">
                      {job.actualMaterialCost !== undefined 
                        ? `$${job.actualMaterialCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                        : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <span className={`text-xs font-bold ${(job.jobCostingVariance || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {job.jobCostingVariance !== undefined 
                        ? `$${job.jobCostingVariance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                        : '-'}
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
                      {job.status !== 'Completed' && (
                        <button
                          onClick={(e) => handleMarkComplete(e, job)}
                          title="Mark as Completed"
                          className="p-2 bg-emerald-100 text-emerald-600 hover:bg-emerald-200 rounded-xl transition-all hover:scale-110"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
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
            <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">
              {filterJobType !== 'All' 
                ? `No active jobs found for type "${filterJobType}".` 
                : dateFilter !== 'All' 
                  ? `No jobs found matching "${dateFilter}" filter.` 
                  : "Check the Pipeline tab for new leads and pending quotes."}
            </p>
          </div>
        )}
      </div>

      {selectedJob && <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  );
};

export default JobManagement;
