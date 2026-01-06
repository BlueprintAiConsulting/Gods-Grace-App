
import React, { useState } from 'react';
import { EstimatorSubView, MowEstimate, SavedMulchEstimate, SavedLandscapeEstimate } from '../types';
import LawnEstimator from './LawnEstimator';
import MulchEstimator from './MulchEstimator';
import LandscapingEstimator from './LandscapingEstimator';
import { Scissors, Layers, TreePine } from 'lucide-react';

interface EstimatorsProps {
  mowEstimates: MowEstimate[];
  onAddMowEstimate: (est: MowEstimate) => void;
  mulchEstimates: SavedMulchEstimate[];
  onAddMulchEstimate: (est: SavedMulchEstimate) => void;
  landscapeEstimates: SavedLandscapeEstimate[];
  onAddLandscapeEstimate: (est: SavedLandscapeEstimate) => void;
}

const Estimators: React.FC<EstimatorsProps> = ({ 
  mowEstimates, 
  onAddMowEstimate, 
  mulchEstimates, 
  onAddMulchEstimate, 
  landscapeEstimates, 
  onAddLandscapeEstimate 
}) => {
  const [activeTab, setActiveTab] = useState<EstimatorSubView>('mow');

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bid Center</h1>
          <p className="text-slate-500 font-medium">Precision quoting tools for God's Grace field operations.</p>
        </div>
        
        {/* Sub Navigation Toggles */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center shadow-inner">
          <button 
            onClick={() => setActiveTab('mow')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'mow' 
                ? 'bg-white text-[#143d2b] shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Scissors className="w-4 h-4" /> Lawn Mow
          </button>
          <button 
            onClick={() => setActiveTab('mulch')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'mulch' 
                ? 'bg-white text-[#143d2b] shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Layers className="w-4 h-4" /> Mulch Install
          </button>
          <button 
            onClick={() => setActiveTab('landscape')}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'landscape' 
                ? 'bg-white text-[#143d2b] shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <TreePine className="w-4 h-4" /> Landscaping
          </button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'mow' && (
          <LawnEstimator 
            estimates={mowEstimates} 
            onSave={onAddMowEstimate} 
          />
        )}
        {activeTab === 'mulch' && (
          <MulchEstimator 
            history={mulchEstimates} 
            onSave={onAddMulchEstimate} 
          />
        )}
        {activeTab === 'landscape' && (
          <LandscapingEstimator 
            history={landscapeEstimates} 
            onSave={onAddLandscapeEstimate} 
          />
        )}
      </div>
    </div>
  );
};

export default Estimators;
