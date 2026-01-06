
import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  History, 
  Trash2, 
  Save, 
  Plus, 
  MapPin, 
  Maximize, 
  Clock, 
  DollarSign, 
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { MowEstimate } from '../types';

interface LawnEstimatorProps {
  estimates: MowEstimate[];
  onSave: (est: MowEstimate) => void;
}

const LawnEstimator: React.FC<LawnEstimatorProps> = ({ estimates, onSave }) => {
  // New Estimate Form State
  const [formData, setFormData] = useState({
    clientName: '',
    address: '',
    zip: '',
    acreage: 0,
    pricePerAcre: 75, // Default base
    minutesPerAcre: 60 // Default base
  });

  const calculation = useMemo(() => {
    const estMins = Math.round(formData.acreage * formData.minutesPerAcre);
    const totalHours = Number((estMins / 60).toFixed(2));
    const price = Number((formData.acreage * formData.pricePerAcre).toFixed(2));
    return { estMins, totalHours, price };
  }, [formData]);

  // Calculate dynamic average
  const averageRevenue = useMemo(() => {
    if (estimates.length === 0) return 0;
    const total = estimates.reduce((acc, curr) => acc + curr.price, 0);
    return total / estimates.length;
  }, [estimates]);

  const handleSave = () => {
    if (!formData.clientName || !formData.address) return;
    
    const newEst: MowEstimate = {
      id: `EST-${Math.floor(Math.random() * 9000) + 1000}`,
      clientName: formData.clientName,
      address: formData.address,
      zip: formData.zip,
      acreage: formData.acreage,
      estMins: calculation.estMins,
      totalHours: calculation.totalHours,
      price: calculation.price,
      date: new Date().toISOString().split('T')[0],
      estimator: 'Admin'
    };

    onSave(newEst);
    setFormData({ clientName: '', address: '', zip: '', acreage: 0, pricePerAcre: 75, minutesPerAcre: 60 });
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Lawn Mow Estimator</h2>
          <p className="text-slate-500">Calculate accurate pricing based on acreage and complexity.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Estimation Tool */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#143d2b] p-2 rounded-lg text-white">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800">Quick Estimate</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Client Name</label>
                <input 
                  type="text" 
                  value={formData.clientName}
                  onChange={e => setFormData({...formData, clientName: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#143d2b] outline-none"
                  placeholder="e.g. Markus Biddle"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Property Address</label>
                <input 
                  type="text" 
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#143d2b] outline-none"
                  placeholder="Street Address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Acreage</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={formData.acreage || ''}
                      onChange={e => setFormData({...formData, acreage: parseFloat(e.target.value) || 0})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-[#143d2b] outline-none"
                      placeholder="0.0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">AC</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Base $/Acre</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                    <input 
                      type="number" 
                      value={formData.pricePerAcre}
                      onChange={e => setFormData({...formData, pricePerAcre: parseFloat(e.target.value) || 0})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 py-2.5 text-sm focus:ring-2 focus:ring-[#143d2b] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-slate-500">Price Estimate</span>
                  <span className="text-xl font-bold text-[#143d2b]">${calculation.price.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-medium text-slate-500">Estimated Effort</span>
                  <span className="text-sm font-bold text-slate-800">{calculation.totalHours} hrs <span className="text-xs font-normal text-slate-400">({calculation.estMins} mins)</span></span>
                </div>

                <button 
                  onClick={handleSave}
                  className="w-full bg-[#f4c430] text-[#143d2b] py-3 rounded-xl font-bold shadow-lg shadow-[#f4c430]/20 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save to History
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* History / Recent Estimates */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-[#4a3728] p-2 rounded-lg text-white">
                  <History className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800">Estimation History</h3>
              </div>
              <button className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider">Export CSV</button>
            </div>
            
            <div className="divide-y divide-slate-50">
              {estimates.map((est) => (
                <div key={est.id} className="p-5 hover:bg-slate-50/80 transition-colors group relative">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#143d2b] group-hover:bg-[#143d2b] group-hover:text-white transition-colors">
                        <Maximize className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900">{est.clientName}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 uppercase">{est.id}</span>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {est.address} {est.zip && `, ${est.zip}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 pr-10">
                      <div className="text-center md:text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Acreage</p>
                        <p className="text-sm font-bold text-slate-700">{est.acreage} AC</p>
                      </div>
                      <div className="text-center md:text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Hours</p>
                        <p className="text-sm font-bold text-slate-700">{est.totalHours} hrs</p>
                      </div>
                      <div className="text-center md:text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
                        <p className="text-sm font-bold text-[#143d2b]">${est.price.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 hover:bg-rose-50 hover:text-rose-500 rounded-lg transition-all text-slate-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50/50 flex items-center justify-center">
              <button className="text-xs font-bold text-[#143d2b] hover:underline flex items-center gap-1">
                Load More Estimates <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Quick Summary Card */}
          <div className="bg-[#143d2b] p-6 rounded-2xl shadow-xl relative overflow-hidden text-white">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="font-bold text-lg mb-1">Average Quoted Revenue</h4>
                <p className="text-white/60 text-sm">Based on {estimates.length} active estimations.</p>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-[#f4c430]">${averageRevenue.toFixed(2)}</span>
                <span className="text-sm font-medium text-white/50 mb-1">/ mow avg</span>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawnEstimator;
