
import React, { useMemo } from 'react';
import { Job } from '../types';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface FinancialsProps {
  jobs: Job[];
}

const Financials: React.FC<FinancialsProps> = ({ jobs }) => {
  // Only consider jobs that have actual revenue data (completed or in progress with billing)
  const financialJobs = useMemo(() => {
    return jobs.filter(j => j.status === 'Completed' || (j.actualRevenue && j.actualRevenue > 0));
  }, [jobs]);

  const totals = useMemo(() => {
    return financialJobs.reduce((acc, job) => ({
      estRev: acc.estRev + job.estRevenue,
      actRev: acc.actRev + (job.actualRevenue || 0),
      estProf: acc.estProf + job.estProfit,
      actProf: acc.actProf + (job.actualProfit || 0),
    }), { estRev: 0, actRev: 0, estProf: 0, actProf: 0 });
  }, [financialJobs]);

  const revenueVariance = totals.actRev - totals.estRev;
  const profitVariance = totals.actProf - totals.estProf;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-900">Financial Performance</h2>
        <p className="text-slate-500">Actual vs. Estimated Profitability Analysis</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Actual Revenue</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-black text-slate-900">${totals.actRev.toLocaleString()}</h3>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${revenueVariance >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {revenueVariance >= 0 ? '+' : ''}{((revenueVariance / totals.estRev) * 100).toFixed(1)}% vs Est
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Realized Profit</p>
          <div className="flex items-end gap-3">
            <h3 className="text-3xl font-black text-[#143d2b]">${totals.actProf.toLocaleString()}</h3>
             <span className={`text-xs font-bold px-2 py-1 rounded-full ${profitVariance >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {profitVariance >= 0 ? '+' : ''}{((profitVariance / totals.estProf) * 100).toFixed(1)}% vs Est
            </span>
          </div>
        </div>

        <div className="bg-[#143d2b] p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
          <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Net Profit Margin</p>
          <h3 className="text-3xl font-black text-[#f4c430]">
            {totals.actRev > 0 ? ((totals.actProf / totals.actRev) * 100).toFixed(1) : 0}%
          </h3>
          <p className="text-xs text-white/40 mt-1">Target: 40%</p>
          <DollarSign className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5" />
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center gap-3">
          <h3 className="font-bold text-slate-800">Job Costing Details</h3>
          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs font-bold">{financialJobs.length} Jobs</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Job / Client</th>
                <th className="px-6 py-4 text-right">Est. Revenue</th>
                <th className="px-6 py-4 text-right">Actual Revenue</th>
                <th className="px-6 py-4 text-right">Variance</th>
                <th className="px-6 py-4 text-right">Actual Profit</th>
                <th className="px-6 py-4 text-right">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {financialJobs.map((job) => {
                const varAmount = (job.actualRevenue || 0) - job.estRevenue;
                const isPositive = varAmount >= 0;
                
                return (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{job.clientName}</p>
                        <p className="text-xs text-slate-500">{job.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-500">
                      ${job.estRevenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      ${(job.actualRevenue || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {isPositive ? '+' : ''}${varAmount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[#143d2b]">
                      ${(job.actualProfit || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                        <span className="text-xs font-bold">{job.estMargin}%</span>
                        {job.estMargin < 30 && <AlertCircle className="w-3 h-3 text-amber-500" />}
                       </div>
                    </td>
                  </tr>
                );
              })}
              
              {financialJobs.length === 0 && (
                 <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                     No completed jobs with financial data available yet.
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

export default Financials;
