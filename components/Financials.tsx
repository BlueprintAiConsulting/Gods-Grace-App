
import React, { useMemo } from 'react';
import { Job } from '../types';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieChartIcon, 
  BarChart3,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface FinancialsProps {
  jobs: Job[];
}

const Financials: React.FC<FinancialsProps> = ({ jobs }) => {
  // Filter for completed jobs or those with actual revenue logged
  const financialJobs = useMemo(() => {
    return jobs.filter(j => j.status === 'Completed' || (j.actualRevenue && j.actualRevenue > 0));
  }, [jobs]);

  // Calculate Aggregates
  const totals = useMemo(() => {
    return financialJobs.reduce((acc, job) => ({
      estRev: acc.estRev + job.estRevenue,
      actRev: acc.actRev + (job.actualRevenue || 0),
      estProf: acc.estProf + job.estProfit,
      actProf: acc.actProf + (job.actualProfit || 0),
      actLabor: acc.actLabor + (job.actualLaborCost || 0),
      actMat: acc.actMat + (job.actualMaterialCost || 0),
    }), { estRev: 0, actRev: 0, estProf: 0, actProf: 0, actLabor: 0, actMat: 0 });
  }, [financialJobs]);

  const revenueVariance = totals.actRev - totals.estRev;
  const profitVariance = totals.actProf - totals.estProf;
  const totalActualCost = totals.actLabor + totals.actMat;
  
  // Data for Bar Chart (Job Profitability)
  const performanceData = financialJobs.map(job => ({
    name: job.clientName.split(' ')[0], // First name for brevity
    Revenue: job.actualRevenue || 0,
    Cost: (job.actualLaborCost || 0) + (job.actualMaterialCost || 0),
    Profit: job.actualProfit || 0
  }));

  // Data for Pie Chart (Cost Breakdown)
  const costData = [
    { name: 'Labor', value: totals.actLabor },
    { name: 'Materials', value: totals.actMat }
  ].filter(item => item.value > 0);

  const PIE_COLORS = ['#143d2b', '#f4c430'];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Financial Intelligence</h2>
        <p className="text-slate-500">Real-time profitability tracking and cost analysis.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Total Revenue" 
          value={totals.actRev} 
          subValue={revenueVariance} 
          isCurrency 
          type="neutral"
          icon={<DollarSign className="w-5 h-5" />}
        />
        <KpiCard 
          title="Net Profit" 
          value={totals.actProf} 
          subValue={profitVariance} 
          isCurrency 
          type="positive"
          icon={<Wallet className="w-5 h-5" />}
        />
        <KpiCard 
          title="Total Costs" 
          value={totalActualCost} 
          subValue={null} 
          isCurrency 
          type="negative"
          icon={<PieChartIcon className="w-5 h-5" />}
        />
        <div className="bg-[#143d2b] p-6 rounded-2xl shadow-lg text-white relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Net Profit Margin</p>
            <h3 className="text-3xl font-black text-[#f4c430]">
              {totals.actRev > 0 ? ((totals.actProf / totals.actRev) * 100).toFixed(1) : 0}%
            </h3>
            <p className="text-xs text-white/40 mt-1 font-medium">Target: 40%</p>
          </div>
          <TrendingUp className="absolute bottom-4 right-4 w-16 h-16 text-white/5" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bar Chart: Revenue vs Cost per Job */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800">Job Profitability Analysis</h3>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11 }} 
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar name="Revenue" dataKey="Revenue" fill="#143d2b" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar name="Total Cost" dataKey="Cost" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar name="Net Profit" dataKey="Profit" fill="#f4c430" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Cost Breakdown */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800">Cost Distribution</h3>
          </div>
          <div className="flex-1 relative min-h-[200px]">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {costData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
             <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Spend</span>
                <span className="text-xl font-black text-slate-900">${totalActualCost.toLocaleString()}</span>
             </div>
          </div>
          <div className="mt-6 space-y-3">
             {costData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                   <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: PIE_COLORS[index] }}></div>
                      <span className="text-sm font-bold text-slate-600">{item.name}</span>
                   </div>
                   <div className="text-right leading-none">
                      <p className="text-sm font-black text-slate-900">${item.value.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">{((item.value / totalActualCost) * 100).toFixed(0)}%</p>
                   </div>
                </div>
             ))}
             {costData.length === 0 && (
               <div className="text-center py-4 text-slate-400 text-xs italic">No cost data available</div>
             )}
          </div>
        </div>
      </div>

      {/* Detailed Ledger */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#143d2b] p-2 rounded-lg text-white">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Job Ledger</h3>
                <p className="text-xs text-slate-400 font-medium">Line-item detail for completed work</p>
              </div>
            </div>
            <button className="text-xs font-bold text-[#143d2b] hover:underline flex items-center gap-1">
              Export Report <ArrowRight className="w-3 h-3" />
            </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Job / Client</th>
                <th className="px-6 py-4 text-right">Actual Revenue</th>
                <th className="px-6 py-4 text-right">Labor Cost</th>
                <th className="px-6 py-4 text-right">Mat. Cost</th>
                <th className="px-6 py-4 text-right">Net Profit</th>
                <th className="px-6 py-4 text-right">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {financialJobs.map((job) => {
                 const jobCost = (job.actualLaborCost || 0) + (job.actualMaterialCost || 0);
                 const profit = (job.actualRevenue || 0) - jobCost;
                 const margin = job.actualRevenue ? (profit / job.actualRevenue) * 100 : 0;
                 
                 return (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-[#143d2b] transition-colors">{job.clientName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400">{job.id}</span>
                          <span className="text-[10px] font-bold text-slate-300">•</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{job.jobType}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">${(job.actualRevenue || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-500">${(job.actualLaborCost || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-500">${(job.actualMaterialCost || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-black text-[#143d2b]">${profit.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                       <span className={`px-2 py-1 rounded-md text-xs font-bold border ${margin >= 40 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                        {margin.toFixed(1)}%
                       </span>
                    </td>
                  </tr>
                 );
              })}
              {financialJobs.length === 0 && (
                 <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                     No completed job data available for analysis.
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Helper Component for KPI Cards
const KpiCard = ({ title, value, subValue, isCurrency, type, icon }: any) => {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</p>
               <div className={`p-2 rounded-xl ${
                 type === 'positive' ? 'bg-emerald-50 text-emerald-600' : 
                 type === 'negative' ? 'bg-slate-100 text-slate-600' : 
                 'bg-[#f4c430]/10 text-[#f4c430]'
               }`}>
                  {icon}
               </div>
            </div>
            <h3 className="text-2xl font-black text-slate-900">
               {isCurrency ? '$' : ''}{value.toLocaleString()}
            </h3>
            {subValue !== null && (
               <div className="mt-2 flex items-center gap-1.5">
                   {subValue >= 0 ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-rose-500" />}
                   <span className={`text-xs font-bold ${subValue >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {subValue >= 0 ? '+' : ''}{isCurrency ? '$' : ''}{subValue.toLocaleString()} <span className="text-slate-400 font-medium ml-1">vs Est.</span>
                   </span>
               </div>
            )}
        </div>
    )
}

export default Financials;
