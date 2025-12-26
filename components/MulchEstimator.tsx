
import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Settings2, 
  Truck, 
  Clock, 
  DollarSign, 
  Info,
  ChevronDown
} from 'lucide-react';
// Fix: Removed non-existent and unused import MulchEstimate
import { MulchBed } from '../types';

const MulchEstimator: React.FC = () => {
  const [beds, setBeds] = useState<MulchBed[]>([
    { id: '1', name: 'Front Bed', sqft: 200, depth: 4 }
  ]);
  const [config, setConfig] = useState({
    hourlyRate: 40,
    materialCostPerYard: 30,
    hoursPerYard: 0.5,
    deliveryFee: 50,
    clientName: '',
    address: ''
  });

  const addBed = () => {
    setBeds([...beds, { id: Date.now().toString(), name: `Area ${beds.length + 1}`, sqft: 0, depth: 4 }]);
  };

  const removeBed = (id: string) => {
    if (beds.length > 1) setBeds(beds.filter(b => b.id !== id));
  };

  const updateBed = (id: string, field: keyof MulchBed, value: any) => {
    setBeds(beds.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const totals = useMemo(() => {
    const totalYards = beds.reduce((acc, bed) => {
      // (sqft * depth / 12) / 27
      return acc + (bed.sqft * (bed.depth / 12) / 27);
    }, 0);

    const materialCost = totalYards * config.materialCostPerYard;
    const laborHours = totalYards * config.hoursPerYard;
    const laborCost = laborHours * config.hourlyRate;
    const grandTotal = materialCost + laborCost + config.deliveryFee;

    return {
      yards: Number(totalYards.toFixed(2)),
      material: Number(materialCost.toFixed(2)),
      hours: Number(laborHours.toFixed(2)),
      labor: Number(laborCost.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2))
    };
  }, [beds, config]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        {/* Beds Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#4a3728] p-2 rounded-lg text-white">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Area Calculations</h3>
                <p className="text-xs text-slate-400 font-medium">Define all mulch beds for this project</p>
              </div>
            </div>
            <button 
              onClick={addBed}
              className="px-4 py-2 bg-[#143d2b] text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#1a4f38] transition-all"
            >
              <Plus className="w-4 h-4" /> Add Bed
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Bed / Area Name</th>
                  <th className="px-6 py-4">Sq. Ft.</th>
                  <th className="px-6 py-4">Depth (in)</th>
                  <th className="px-6 py-4 text-right">Cubic Yards</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {beds.map((bed) => (
                  <tr key={bed.id} className="group hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <input 
                        className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 w-full"
                        value={bed.name}
                        onChange={e => updateBed(bed.id, 'name', e.target.value)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="number"
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-[#143d2b] w-24 outline-none"
                        value={bed.sqft}
                        onChange={e => updateBed(bed.id, 'sqft', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-[#143d2b] w-20 outline-none"
                        value={bed.depth}
                        onChange={e => updateBed(bed.id, 'depth', parseInt(e.target.value))}
                      >
                        {[1, 2, 3, 4, 5, 6].map(d => <option key={d} value={d}>{d}"</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-bold text-[#143d2b]">
                        {(bed.sqft * (bed.depth / 12) / 27).toFixed(2)} yd³
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => removeBed(bed.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
              <Settings2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800">Job Configuration</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Hourly Rate</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <input 
                  type="number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#143d2b]"
                  value={config.hourlyRate}
                  onChange={e => setConfig({...config, hourlyRate: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Cost / Yard</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <input 
                  type="number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#143d2b]"
                  value={config.materialCostPerYard}
                  onChange={e => setConfig({...config, materialCostPerYard: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Delivery Fee</label>
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <input 
                  type="number"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#143d2b]"
                  value={config.deliveryFee}
                  onChange={e => setConfig({...config, deliveryFee: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Hours / Yard</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                <input 
                  type="number"
                  step="0.1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#143d2b]"
                  value={config.hoursPerYard}
                  onChange={e => setConfig({...config, hoursPerYard: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Sidebar */}
      <div className="space-y-6">
        <div className="bg-[#143d2b] text-white p-8 rounded-3xl shadow-xl shadow-[#143d2b]/20 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-6">Estimate Summary</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-sm">Total Material</span>
                <span className="font-bold">${totals.material.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-white/70 text-sm">Labor Cost</span>
                  <span className="text-[10px] text-white/40">{totals.hours} estimated hours</span>
                </div>
                <span className="font-bold">${totals.labor.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-6">
                <span className="text-lg font-bold">Total Job Price</span>
                <span className="text-3xl font-black text-[#f4c430]">${totals.grandTotal.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <p className="text-[9px] font-bold text-white/40 uppercase">Total Yards</p>
                <p className="text-lg font-black text-[#f4c430]">{totals.yards}</p>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <p className="text-[9px] font-bold text-white/40 uppercase">Est. Labor</p>
                <p className="text-lg font-black text-[#f4c430]">{totals.hours}h</p>
              </div>
            </div>
            <button className="w-full mt-8 bg-[#f4c430] text-[#143d2b] py-4 rounded-2xl font-black shadow-lg hover:scale-[1.02] transition-transform active:scale-95 uppercase tracking-wider text-sm">
              Generate Quote PDF
            </button>
          </div>
          {/* Decorative Elements */}
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#f4c430]/10 rounded-full blur-2xl"></div>
        </div>

        <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl flex items-start gap-4">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 leading-relaxed">
            <p className="font-bold mb-1">Standard Estimating Factors</p>
            <p>Calculations based on $40/hour labor and average 0.5 hours per cubic yard installation time.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MulchEstimator;
