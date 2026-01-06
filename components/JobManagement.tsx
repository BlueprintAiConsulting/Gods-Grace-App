
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
  ChevronDown, 
  Upload, 
  Save,
  PieChart as PieChartIcon
} from 'lucide-react';
import { Job } from '../types';
import { STATUS_COLORS } from '../constants';
import JobDetailsModal from './JobDetailsModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

interface JobManagementProps {
  jobs: Job[];
  onAddJob: (job: Job) => void;
  onUpdateJob: (job: Job) => void;
  onImportJobs?: (jobs: Job[]) => void;
}

type DateFilterType = 'All' | 'Overdue' | 'Today' | 'This Week' | 'Next Week';

interface WeatherData {
  temp: number;
  conditionCode: number;
  windSpeed: number;
  precip: number;
  humidity: number;
}

const JobManagement: React.FC<JobManagementProps> = ({ jobs, onAddJob, onUpdateJob, onImportJobs }) => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterJobType, setFilterJobType] = useState<string>('All');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: 'nextActionDate'; direction: 'asc' | 'desc' | null }>({
    key: 'nextActionDate',
    direction: null
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newJobData, setNewJobData] = useState<Partial<Job>>({
    clientName: '',
    address: '',
    cityArea: 'York',
    jobType: 'Mow',
    estRevenue: 0,
    scheduledDate: new Date().toISOString().split('T')[0]
  });

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<DateFilterType>('All');
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const dateFilterRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Calculate Job Type Distribution for Chart
  const jobTypeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    customerJobs.forEach(job => {
      const type = job.jobType || 'Other';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [customerJobs]);

  const CHART_COLORS = ['#143d2b', '#f4c430', '#4a3728', '#64748b', '#94a3b8'];
  
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
          startOfWeek.setDate(today.getDate() - today.getDay()); 
          const endOfWeek = new Date(today);
          endOfWeek.setDate(today.getDate() + (6 - today.getDay())); 
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
    return w.conditionCode >= 50 || w.precip > 0.1 || w.windSpeed > 20;
  };

  // CSV Import Logic with Enhanced Validation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      if (lines.length < 2) {
        alert("CSV file appears to be empty or missing headers.");
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const newJobs: Job[] = [];
      let skippedCount = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',');
        const getValue = (keyPart: string) => {
          const index = headers.findIndex(h => h.includes(keyPart));
          return index >= 0 ? values[index]?.trim() : '';
        };

        // 1. Validation: Required Client Name
        const clientName = getValue('name') || getValue('client');
        if (!clientName) {
            console.warn(`Row ${i + 1} skipped: Missing Client Name`);
            skippedCount++;
            continue;
        }

        // 2. Validation: Safe Number Parsing
        const estRevenue = parseFloat(getValue('revenue') || '0');
        const estCost = parseFloat(getValue('cost') || '0');

        // 3. Validation: Date Normalization (YYYY-MM-DD)
        const parseDate = (dateStr: string) => {
            if (!dateStr) return new Date().toISOString().split('T')[0];
            const timestamp = Date.parse(dateStr);
            return isNaN(timestamp) ? new Date().toISOString().split('T')[0] : new Date(timestamp).toISOString().split('T')[0];
        };

        const scheduledDate = parseDate(getValue('date') || getValue('scheduled'));

        const job: Job = {
          id: getValue('id') || `IMP-${Date.now()}-${i}`,
          clientName: clientName,
          phone: getValue('phone') || '',
          email: getValue('email') || '',
          address: getValue('address') || '',
          cityArea: getValue('city') || 'York',
          description: getValue('desc') || 'Imported Job',
          jobType: getValue('type') || 'General',
          status: (getValue('status') as any) || 'Scheduled',
          priority: (getValue('priority') as any) || 'Medium',
          leadSource: getValue('source') || 'CSV Import',
          scheduledDate: scheduledDate,
          estRevenue: isNaN(estRevenue) ? 0 : estRevenue,
          estCost: isNaN(estCost) ? 0 : estCost,
          estProfit: 0,
          estMargin: 0,
          paymentStatus: 'Unpaid',
          notes: '',
          followUpCount: 0,
          jobWalkthroughComplete: false,
          recurringServicePitched: false,
        };

        // Recalculate derived math
        job.estProfit = job.estRevenue - job.estCost;
        job.estMargin = job.estRevenue ? Math.round((job.estProfit / job.estRevenue) * 100) : 0;

        newJobs.push(job);
      }

      if (onImportJobs && newJobs.length > 0) {
        onImportJobs(newJobs);
        let msg = `Successfully imported ${newJobs.length} jobs.`;
        if (skippedCount > 0) {
            msg += ` ${skippedCount} rows were skipped due to missing Client Name.`;
        }
        alert(msg);
      } else if (newJobs.length === 0) {
        alert("No valid jobs found in CSV. Please ensure you have a 'Client Name' or 'Name' column.");
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleCreateJob = (e: React.FormEvent) => {
     e.preventDefault();
     const job: Job = {
       id: `JOB-${Date.now().toString().slice(-4)}`,
       clientName: newJobData.clientName || 'New Client',
       phone: '',
       email: '',
       address: newJobData.address || '',
       cityArea: newJobData.cityArea || 'York',
       description: 'Manual Service Entry',
       jobType: newJobData.jobType || 'Mow',
       status: 'Scheduled',
       priority: 'Medium',
       leadSource: 'Manual',
       scheduledDate: newJobData.scheduledDate,
       nextActionDate: newJobData.scheduledDate, // Set next action to schedule date
       nextAction: 'Perform Service',
       estRevenue: newJobData.estRevenue || 0,
       estCost: 0,
       estProfit: 0,
       estMargin: 0,
       paymentStatus: 'Unpaid',
       notes: '',
       followUpCount: 0,
       jobWalkthroughComplete: true,
       recurringServicePitched: false,
     };
     onAddJob(job);
     setIsModalOpen(false);
     setNewJobData({ clientName: '', address: '', cityArea: 'York', jobType: 'Mow', estRevenue: 0, scheduledDate: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Active Job Center</h2>
          <p className="text-slate-500">Managing operations and field fulfillment.</p>
        </div>
        
        {/* Actions Bar - Stacked on Mobile */}
        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
          <input 
            type="file" 
            ref={fileInputRef} 
            accept=".csv" 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 md:flex-none p-2 border border-slate-200 rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2 text-sm font-bold text-slate-600"
            title="Import CSV"
          >
            <Upload className="w-5 h-5" /> <span className="md:hidden">Import</span>
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none bg-[#143d2b] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#1a4f38] transition-all shadow-lg shadow-[#143d2b]/20"
          >
            <Plus className="w-5 h-5" />
            <span>New Job</span>
          </button>
        </div>
      </div>

      {/* Weather & Field Conditions Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full md:w-auto">
               <div className="bg-sky-50 p-3 rounded-2xl shrink-0">
                  {weather ? getWeatherIcon(weather.conditionCode) : <Cloud className="w-8 h-8 text-slate-300" />}
               </div>
               <div>
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 flex-wrap">
                    Current Conditions
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border border-slate-200 px-2 py-0.5 rounded-full whitespace-nowrap">York, PA</span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm text-slate-600 mt-1">
                     <span className="flex items-center gap-1"><Thermometer className="w-4 h-4 text-rose-400" /> {weather?.temp ?? '--'}°F</span>
                     <span className="flex items-center gap-1"><Droplets className="w-4 h-4 text-blue-400" /> {weather?.humidity ?? '--'}%</span>
                     <span className="flex items-center gap-1"><Wind className="w-4 h-4 text-slate-400" /> {weather?.windSpeed ?? '--'} mph</span>
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto bg-slate-50 p-3 rounded-xl border border-slate-100">
               <div className="flex-1 md:flex-none">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                  {weather ? (
                    <div className={`flex items-center gap-2 font-bold text-sm ${isBadWeather(weather) ? 'text-amber-600' : 'text-emerald-600'}`}>
                       {isBadWeather(weather) ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                       {isBadWeather(weather) ? 'Weather Delays' : 'Operational'}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm">Loading...</div>
                  )}
               </div>
               <div className="w-px h-8 bg-slate-200"></div>
               <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active</p>
                  <p className="text-lg font-black text-slate-900 leading-none">{customerJobs.filter(j => j.status === 'In Progress' || j.status === 'Scheduled').length}</p>
               </div>
            </div>
         </div>

         {/* Job Type Distribution Chart - Hidden on very small screens if needed, or stacked */}
         <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
               <PieChartIcon className="w-4 h-4 text-slate-400" /> Job Distribution
            </h3>
            <div className="flex-1 min-h-[160px]">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={jobTypeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {jobTypeDistribution.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                     </Pie>
                     <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                     />
                     <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right"
                        iconType="circle"
                        iconSize={6}
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                     />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-4 min-w-max">
            <div className="flex items-center gap-2">
              {['All', 'Scheduled', 'In Progress', 'Completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
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
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <select
                value={filterJobType}
                onChange={(e) => setFilterJobType(e.target.value)}
                className="bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg pl-9 pr-8 py-1.5 outline-none focus:border-[#143d2b] cursor-pointer shadow-sm appearance-none"
              >
                {uniqueJobTypes.map(type => (
                  <option key={type} value={type}>{type === 'All' ? 'All Types' : type}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Real Data Table - Scrollable on Mobile */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left min-w-[1000px]"> 
            <thead>
              <tr className="bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4 sticky left-0 bg-slate-50/95 z-10">Job Info</th>
                <th className="px-6 py-4">Field Data</th>
                
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
                        <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 z-50 p-1.5">
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

                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Crew</th>
                <th className="px-6 py-4 text-right">Revenue</th>
                <th className="px-6 py-4 text-right">Margin</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSorted.map((job) => (
                <tr 
                  key={job.id} 
                  onClick={() => setSelectedJob(job)}
                  className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                >
                  {/* Sticky First Column for better mobile context */}
                  <td className="px-6 py-5 sticky left-0 bg-white group-hover:bg-slate-50/50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#143d2b] mb-1">{job.id}</span>
                      <span className="font-black text-slate-900 text-sm group-hover:text-[#143d2b] transition-colors">{job.clientName}</span>
                      <span className="text-xs text-slate-500 mt-0.5 line-clamp-1 max-w-[150px]">{job.description}</span>
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
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center border-2 border-white shadow-sm overflow-hidden text-[#4a3728] font-black text-xs">
                        {job.crewLead?.substring(0,2) || '??'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="text-sm font-black text-slate-900">${(job.actualRevenue || job.estRevenue).toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{job.paymentStatus}</div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className={`text-xs font-black ${job.estMargin >= 40 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {job.estMargin}%
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedJob(job); }}
                        className="p-2 bg-[#143d2b] text-white rounded-xl shadow-lg shadow-[#143d2b]/20"
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
            <Search className="text-slate-300 w-12 h-12 mb-4" />
            <h3 className="font-bold text-slate-800">No active customer jobs</h3>
          </div>
        )}
      </div>

      {selectedJob && <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} />}

      {/* New Service Entry Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-xl font-black text-slate-900">New Service Entry</h3>
                   <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                      <X className="w-5 h-5 text-slate-500" />
                   </button>
                </div>
                <form onSubmit={handleCreateJob} className="space-y-4">
                   <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Client Name</label>
                       <input 
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#143d2b]"
                          value={newJobData.clientName}
                          onChange={e => setNewJobData({...newJobData, clientName: e.target.value})}
                          placeholder="Client Name"
                       />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Service Type</label>
                          <select 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#143d2b]"
                              value={newJobData.jobType}
                              onChange={e => setNewJobData({...newJobData, jobType: e.target.value})}
                          >
                              <option value="Mow">Mow</option>
                              <option value="Mulch">Mulch</option>
                              <option value="Clean Up">Clean Up</option>
                              <option value="Paver Patio">Paver Patio</option>
                              <option value="Other">Other</option>
                          </select>
                       </div>
                       <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Est. Revenue ($)</label>
                          <input 
                              type="number"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#143d2b]"
                              value={newJobData.estRevenue}
                              onChange={e => setNewJobData({...newJobData, estRevenue: parseFloat(e.target.value) || 0})}
                          />
                       </div>
                   </div>
                   <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Scheduled Date</label>
                       <input 
                          type="date"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#143d2b]"
                          value={newJobData.scheduledDate}
                          onChange={e => setNewJobData({...newJobData, scheduledDate: e.target.value})}
                       />
                   </div>
                    <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                       <input 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#143d2b]"
                          value={newJobData.address}
                          onChange={e => setNewJobData({...newJobData, address: e.target.value})}
                          placeholder="Street Address"
                       />
                   </div>
                   <button type="submit" className="w-full bg-[#143d2b] text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-[#143d2b]/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                       <Save className="w-4 h-4" /> Create Service Job
                   </button>
                </form>
             </div>
          </div>
      )}
    </div>
  );
};

export default JobManagement;
