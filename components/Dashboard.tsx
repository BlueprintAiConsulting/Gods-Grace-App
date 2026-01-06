
import React, { useMemo, useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  ClipboardCheck, 
  ArrowUpRight, 
  ArrowRight, 
  MapPin, 
  Calendar as CalendarIcon,
  Sparkles,
  Loader2,
  X
} from 'lucide-react';
import { Job, DashboardStats } from '../types';
import { STATUS_COLORS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { GoogleGenAI } from "@google/genai";

interface DashboardProps {
  stats: DashboardStats;
  jobs: Job[];
}

const Dashboard: React.FC<DashboardProps> = ({ stats, jobs }) => {
  const [aiBriefing, setAiBriefing] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Dynamic Data Calculation for Charts
  const jobTypeData = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    jobs.forEach(job => {
      const type = job.jobType || 'Other';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  }, [jobs]);

  // Mock weekly data based on "Scheduled Date" for demonstration
  // In a real app with more history, this would aggregate actual dates
  const chartData = [
    { name: 'Mon', revenue: 4500 },
    { name: 'Tue', revenue: 3200 },
    { name: 'Wed', revenue: 5800 },
    { name: 'Thu', revenue: 2900 },
    { name: 'Fri', revenue: 7200 },
  ];

  const COLORS_LIST = ['#143d2b', '#f4c430', '#4a3728', '#22c55e', '#64748b'];

  const handleGenerateBriefing = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      const hasKey = await aistudio.hasSelectedApiKey();
      if (!hasKey) await aistudio.openSelectKey();
    }

    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `You are the Operations Manager for God's Grace Lawn & Landscape. 
      Analyze today's dashboard stats:
      - Total Estimated Revenue: $${stats.totalRevenue}
      - Active Jobs: ${stats.activeJobs}
      - Average Margin: ${stats.avgMargin.toFixed(1)}%
      - Pending Follow-ups: ${stats.pendingFollowUps}
      
      Provide a concise 2-sentence "Daily Focus" briefing for the owner. Identify the most critical number to watch and suggest one immediate action.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setAiBriefing(response.text);
    } catch (e) {
      console.error("Briefing generation failed", e);
      setAiBriefing("Unable to generate briefing. Please check your connection and API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operations Command Center</h1>
          <p className="text-slate-500">Welcome back! Here's what's happening today at God's Grace.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={handleGenerateBriefing}
             disabled={isGenerating}
             className="px-4 py-2 bg-[#f4c430] text-[#143d2b] border border-[#f4c430] rounded-xl text-sm font-bold shadow-sm hover:bg-[#eac040] transition-colors flex items-center gap-2 disabled:opacity-50"
           >
             {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
             Smart Briefing
           </button>
           <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 hidden md:flex">
             <CalendarIcon className="w-4 h-4" />
             View Full Schedule
           </button>
        </div>
      </div>

      {aiBriefing && (
        <div className="bg-gradient-to-r from-[#143d2b] to-[#1a4f38] p-6 rounded-2xl shadow-lg relative overflow-hidden animate-in slide-in-from-top-4">
          <div className="relative z-10">
             <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 mb-2">
                   <Sparkles className="w-5 h-5 text-[#f4c430]" />
                   <h3 className="font-bold text-white text-sm uppercase tracking-widest">AI Daily Focus</h3>
                </div>
                <button onClick={() => setAiBriefing(null)} className="text-white/60 hover:text-white transition-colors">
                   <X className="w-5 h-5" />
                </button>
             </div>
             <p className="text-white font-medium text-lg leading-relaxed max-w-3xl">
                {aiBriefing}
             </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          label="Total Est. Revenue" 
          value={`$${stats.totalRevenue.toLocaleString()}`} 
          trend="+12% from last month"
          icon={<DollarSign className="text-emerald-600" />}
          color="bg-emerald-50"
        />
        <KpiCard 
          label="Active Projects" 
          value={stats.activeJobs.toString()} 
          trend="2 finishing this week"
          icon={<Clock className="text-blue-600" />}
          color="bg-blue-50"
        />
        <KpiCard 
          label="Average Margin" 
          value={`${stats.avgMargin.toFixed(1)}%`} 
          trend="Target: 45%"
          icon={<TrendingUp className="text-purple-600" />}
          color="bg-purple-50"
        />
        <KpiCard 
          label="Pending Follow-ups" 
          value={stats.pendingFollowUps.toString()} 
          trend="Action required"
          icon={<ClipboardCheck className="text-amber-600" />}
          color="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800">Weekly Revenue Flow</h3>
            <select className="bg-slate-50 border-none text-xs font-bold text-slate-500 rounded-lg px-3 py-1.5 focus:ring-0">
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#143d2b" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6">Service Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={jobTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {jobTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_LIST[index % COLORS_LIST.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {jobTypeData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS_LIST[idx % COLORS_LIST.length] }}></div>
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold text-slate-800">
                  {((item.value / jobs.length) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity / Jobs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">Recent Priority Actions</h3>
          <button className="text-[#143d2b] text-sm font-semibold flex items-center gap-1 hover:underline">
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="divide-y divide-slate-50">
          {jobs.slice(0, 5).map((job) => (
            <div key={job.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold ${STATUS_COLORS[job.status] || 'bg-slate-100 text-slate-800'}`}>
                  <span>{job.scheduledDate?.split('-')[1]}</span>
                  <span className="text-base">{job.scheduledDate?.split('-')[2]}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 group-hover:text-[#143d2b] transition-colors">{job.clientName}</h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.cityArea}</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${job.estRevenue}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="hidden md:block text-right">
                  <p className="text-xs text-slate-400 font-medium">NEXT ACTION</p>
                  <p className="text-sm font-semibold text-slate-700">{job.nextAction || 'None set'}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${STATUS_COLORS[job.status] || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                  {job.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ label: string, value: string, trend: string, icon: React.ReactNode, color: string }> = ({ label, value, trend, icon, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
    <div className={`absolute top-0 right-0 p-4 rounded-bl-3xl ${color} opacity-40 transition-transform group-hover:scale-110`}>
      {React.cloneElement(icon as React.ReactElement<any>, { size: 24 })}
    </div>
    <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
    <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
    <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-full uppercase tracking-tighter">
      <ArrowUpRight className="w-3 h-3" />
      {trend}
    </div>
  </div>
);

export default Dashboard;
