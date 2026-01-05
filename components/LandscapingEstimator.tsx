
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Users, 
  Package, 
  DollarSign, 
  Save, 
  ArrowRight, 
  Calculator, 
  Briefcase, 
  History, 
  CheckCircle2 
} from 'lucide-react';
import { LaborTask, MaterialItem } from '../types';

interface SavedLandscapeEstimate {
  id: string;
  date: string;
  totalCost: number;
  itemCount: number;
  totalHours: number;
}

const LandscapingEstimator: React.FC = () => {
  const [laborTasks, setLaborTasks] = useState<LaborTask[]>([
    { id: '1', task: 'weeding and mulching', crewSize: 2, hoursPerPerson: 8, hourlyRate: 40 }
  ]);
  const [materialItems, setMaterialItems] = useState<MaterialItem[]>([
    { id: '1', item: 'Mulch', qty: 5, unit: 'bags', unitCost: 4 },
    { id: '2', item: 'Landscape Fabric', qty: 20, unit: 'sq ft', unitCost: 2 },
    { id: '3', item: 'Sand', qty: 10, unit: 'bags', unitCost: 5 },
    { id: '4', item: 'Decorative Stone', qty: 5, unit: 'bags', unitCost: 4 }
  ]);
  const [history, setHistory] = useState<SavedLandscapeEstimate[]>([]);

  const addLaborTask = () => {
    setLaborTasks([...laborTasks, { 
      id: Date.now().toString(), 
      task: '', 
      crewSize: 1, 
      hoursPerPerson: 0, 
      hourlyRate: 40 
    }]);
  };

  const addMaterialItem = () => {
    setMaterialItems([...materialItems, { 
      id: Date.now().toString(), 
      item: '', 
      qty: 0, 
      unit: 'each', 
      unitCost: 0 
    }]);
  };

  const updateLabor = (id: string, field: keyof LaborTask, value: any) => {
    setLaborTasks(laborTasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const updateMaterial = (id: string, field: keyof MaterialItem, value: any) => {
    setMaterialItems(materialItems.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const removeLabor = (id: string) => setLaborTasks(laborTasks.filter(t => t.id !== id));
  const removeMaterial = (id: string) => setMaterialItems(materialItems.filter(m => m.id !== id));

  const totals = useMemo(() => {
    const laborCost = laborTasks.reduce((acc, t) => acc + (t.crewSize * t.hoursPerPerson * t.hourlyRate), 0);
    const materialCost = materialItems.reduce((acc, m) => acc + (m.qty * m.unitCost), 0);
    const totalHours = laborTasks.reduce((acc, t) => acc + (t.crewSize * t.hoursPerPerson), 0);
    
    return {
      laborCost,
      materialCost,
      totalHours,
      grandTotal: laborCost + materialCost
    };
  }, [laborTasks, materialItems]);

  const handleSave = () => {
    const newEstimate: SavedLandscapeEstimate = {
      id: `LND-${Date.now().toString().slice(-4)}`,
      date: new Date().toLocaleDateString(),
      totalCost: totals.grandTotal,
      itemCount: laborTasks.length + materialItems.length,
      totalHours: totals.totalHours
    };
    setHistory([newEstimate, ...history]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
      <div className="lg:col-span-2 space-y-8">
        {/* Labor Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#4a3728] p-2 rounded-lg text-white">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Landscaping Labor</h3>
                <p className="text-xs text-slate-400 font-medium tracking-tight">Manage crew size and estimated time</p>
              </div>
            </div>
            <button onClick={addLaborTask} className="px-4 py-2 bg-[#143d2b] text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#1a4f38] transition-all">
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Task Description</th>
                  <th className="px-6 py-4">Crew</th>
                  <th className="px-6 py-4">Hrs/Person</th>
                  <th className="px-6 py-4 text-right">Labor Cost</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {laborTasks.map((task) => (
                  <tr key={task.id} className="group hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <input 
                        className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 w-full"
                        placeholder="e.g. Clearing brush"
                        value={task.task}
                        onChange={e => updateLabor(task.id, 'task', e.target.value)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="number"
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-16 outline-none"
                        value={task.crewSize}
                        onChange={e => updateLabor(task.id, 'crewSize', parseInt(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="number"
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-20 outline-none"
                        value={task.hoursPerPerson}
                        onChange={e => updateLabor(task.id, 'hoursPerPerson', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-bold text-slate-900">
                        ${(task.crewSize * task.hoursPerPerson * task.hourlyRate).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => removeLabor(task.id)} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Materials Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#f4c430] p-2 rounded-lg text-[#143d2b]">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Materials & Supplies</h3>
                <p className="text-xs text-slate-400 font-medium tracking-tight">Hardscape, plants, and loose materials</p>
              </div>
            </div>
            <button onClick={addMaterialItem} className="px-4 py-2 bg-slate-100 text-[#143d2b] rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-200 transition-all">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4">Qty</th>
                  <th className="px-6 py-4">Unit Cost</th>
                  <th className="px-6 py-4 text-right">Total Cost</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materialItems.map((item) => (
                  <tr key={item.id} className="group hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <input 
                        className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 w-full"
                        placeholder="Item name"
                        value={item.item}
                        onChange={e => updateMaterial(item.id, 'item', e.target.value)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs w-20 outline-none"
                          value={item.qty}
                          onChange={e => updateMaterial(item.id, 'qty', parseFloat(e.target.value) || 0)}
                        />
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{item.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                        <input 
                          type="number"
                          className="bg-slate-50 border border-slate-200 rounded-lg pl-6 pr-3 py-1.5 text-xs w-24 outline-none"
                          value={item.unitCost}
                          onChange={e => updateMaterial(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-sm font-black text-[#143d2b]">
                          ${(item.qty * item.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold tracking-tight">
                           {item.qty} {item.unit} × ${item.unitCost}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => removeMaterial(item.id)} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* History Section */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center gap-3">
              <History className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-800">Saved Estimates</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {history.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-50 text-[#143d2b] flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{item.id}</h4>
                      <p className="text-xs text-slate-500">{item.itemCount} Items • {item.totalHours} hrs</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-[#143d2b]">${item.totalCost.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-slate-400">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Totals Sidebar */}
      <div className="space-y-6">
        <div className="bg-[#143d2b] text-white p-8 rounded-3xl shadow-xl shadow-[#143d2b]/20 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-white/60 text-xs font-bold uppercase tracking-widest">Project Summary</h3>
              <div className="p-2 bg-white/10 rounded-lg">
                <Calculator className="w-5 h-5 text-[#f4c430]" />
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="flex items-center justify-between group">
                <span className="text-white/70 text-sm group-hover:text-white transition-colors">Total Labor</span>
                <span className="font-bold tracking-tight">${totals.laborCost.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between group">
                <span className="text-white/70 text-sm group-hover:text-white transition-colors">Total Materials</span>
                <span className="font-bold tracking-tight">${totals.materialCost.toLocaleString()}</span>
              </div>
              <div className="h-px bg-white/10 my-2"></div>
              <div className="flex items-center justify-between border-t border-white/5 pt-5">
                <span className="text-lg font-bold">Quoted Price</span>
                <span className="text-4xl font-black text-[#f4c430] tracking-tighter">${totals.grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Total Man Hours</p>
                <p className="text-2xl font-black text-[#f4c430]">{totals.totalHours}<span className="text-xs ml-1 opacity-50 font-medium">hrs</span></p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Line Items</p>
                <p className="text-2xl font-black text-[#f4c430]">{laborTasks.length + materialItems.length}</p>
              </div>
            </div>

            <button 
              onClick={handleSave}
              className="w-full mt-8 bg-[#f4c430] text-[#143d2b] py-4 rounded-2xl font-black shadow-lg hover:bg-yellow-400 hover:scale-[1.02] transition-all active:scale-95 uppercase tracking-wider text-sm flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> Save Estimate
            </button>
            <button className="w-full mt-3 bg-white/10 text-white py-4 rounded-2xl font-bold border border-white/10 hover:bg-white/20 transition-all text-sm flex items-center justify-center gap-2">
              <Briefcase className="w-4 h-4" /> Convert to Active Job
            </button>
          </div>
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px]"></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h4 className="font-bold text-slate-800 text-sm mb-4">Quick Breakdown</h4>
          <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 mb-4">
            <div 
              className="bg-[#143d2b]" 
              style={{ width: `${(totals.laborCost / Math.max(1, totals.grandTotal)) * 100}%` }}
              title="Labor"
            />
            <div 
              className="bg-[#f4c430]" 
              style={{ width: `${(totals.materialCost / Math.max(1, totals.grandTotal)) * 100}%` }}
              title="Materials"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#143d2b]"></div>
                <span className="text-slate-500 uppercase">Labor %</span>
              </div>
              <span className="text-slate-800">{((totals.laborCost / Math.max(1, totals.grandTotal)) * 100).toFixed(0)}%</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#f4c430]"></div>
                <span className="text-slate-500 uppercase">Materials %</span>
              </div>
              <span className="text-slate-800">{((totals.materialCost / Math.max(1, totals.grandTotal)) * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandscapingEstimator;
