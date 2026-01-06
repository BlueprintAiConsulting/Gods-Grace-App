
import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Phone, 
  Mail, 
  Calendar, 
  ArrowRight, 
  MessageSquare, 
  Filter,
  MoreVertical,
  Clock,
  UserPlus,
  Search,
  X,
  Save,
  Upload
} from 'lucide-react';
import { Job } from '../types';
import { STATUS_COLORS } from '../constants';

interface LeadsManagementProps {
  jobs: Job[];
  onAddLead: (lead: Job) => void;
  onImportLeads?: (leads: Job[]) => void;
}

const LeadsManagement: React.FC<LeadsManagementProps> = ({ jobs, onAddLead, onImportLeads }) => {
  const [filter, setFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Lead State
  const [newLead, setNewLead] = useState<Partial<Job>>({
    clientName: '',
    phone: '',
    email: '',
    leadSource: 'Call',
    description: '',
    notes: ''
  });
  
  // Filter for items that are not yet "Active Jobs" (Scheduled/In Progress/Completed)
  const leads = jobs.filter(j => ['Lead', 'Quoted', 'Follow-Up Needed', 'Rejected'].includes(j.status));
  const filteredLeads = filter === 'All' ? leads : leads.filter(l => l.status === filter);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lead: Job = {
        id: `LEAD-${Date.now()}`,
        clientName: newLead.clientName || 'New Lead',
        phone: newLead.phone || '',
        email: newLead.email || '',
        address: '', // Address often unknown at lead stage
        cityArea: 'York',
        description: newLead.description || 'New Inquiry',
        jobType: 'General',
        status: 'Lead',
        priority: 'Medium',
        leadSource: newLead.leadSource || 'Manual Entry',
        lastContactDate: new Date().toISOString().split('T')[0],
        nextAction: 'Initial Contact',
        nextActionDate: new Date().toISOString().split('T')[0],
        estRevenue: 0,
        estCost: 0,
        estProfit: 0,
        estMargin: 0,
        paymentStatus: 'Unpaid',
        notes: newLead.notes || '',
        followUpCount: 0,
        jobWalkthroughComplete: false,
        recurringServicePitched: false,
    };
    onAddLead(lead);
    setIsModalOpen(false);
    setNewLead({ clientName: '', phone: '', email: '', leadSource: 'Call', description: '', notes: '' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const lines = text.split('\n');
      const newJobs: Job[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = line.split(',');
        // Basic CSV mapping
        const job: Job = {
          id: `IMP-${Date.now()}-${i}`,
          clientName: values[0] || 'Unknown',
          phone: values[1] || '',
          email: values[2] || '',
          address: '',
          cityArea: 'York',
          description: 'Imported Lead',
          jobType: 'General',
          status: 'Lead',
          priority: 'Medium',
          leadSource: 'CSV Import',
          estRevenue: 0, estCost: 0, estProfit: 0, estMargin: 0,
          paymentStatus: 'Unpaid', notes: '', followUpCount: 0,
          jobWalkthroughComplete: false, recurringServicePitched: false
        };
        newJobs.push(job);
      }
      if (onImportLeads) onImportLeads(newJobs);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Lead Pipeline</h1>
          <p className="text-slate-500 font-medium italic">"Every seed planted with grace becomes a harvest."</p>
        </div>
        <div className="flex items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
            >
                <Upload className="w-5 h-5" /> Import CSV
            </button>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-[#f4c430] text-[#143d2b] px-6 py-3 rounded-2xl font-black shadow-lg shadow-[#f4c430]/20 flex items-center gap-2 hover:scale-[1.02] transition-all"
            >
            <UserPlus className="w-5 h-5" />
            Capture New Lead
            </button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {['All', 'Lead', 'Quoted', 'Follow-Up Needed'].map((s) => (
          <button 
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border-2 ${
              filter === s ? 'bg-[#143d2b] text-white border-[#143d2b]' : 'bg-white text-slate-400 border-slate-100 hover:border-[#f4c430]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filteredLeads.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredLeads.map((lead) => (
            <div key={lead.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl transition-all duration-300">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-slate-100 group-hover:bg-[#f4c430]/10 group-hover:border-[#f4c430]/30 transition-colors">
                      <UserPlus className="w-7 h-7 text-[#143d2b]" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-lg group-hover:text-[#143d2b] transition-colors">{lead.clientName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-widest ${STATUS_COLORS[lead.status]}`}>
                          {lead.status}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lead.leadSource}</span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                    <MoreVertical className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 my-6">
                  <div className="p-4 bg-slate-50/50 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Next Action</p>
                    <p className="text-sm font-bold text-[#143d2b] leading-tight">{lead.nextAction || 'No action set'}</p>
                  </div>
                  <div className="p-4 bg-slate-50/50 rounded-2xl flex flex-col justify-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Follow-ups</p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`w-3 h-1.5 rounded-full ${i < lead.followUpCount ? 'bg-[#f4c430]' : 'bg-slate-200'}`} />
                      ))}
                      <span className="text-xs font-bold text-slate-600 ml-1">{lead.followUpCount}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-500 font-medium bg-slate-50/50 p-3 rounded-2xl group-hover:bg-white transition-colors border border-transparent group-hover:border-slate-100">
                    <Clock className="w-4 h-4 text-[#4a3728]" />
                    <span>Next Date: {lead.nextActionDate || 'TBD'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href={`tel:${lead.phone}`}
                      className="flex-1 bg-slate-900 text-white py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                    >
                      <Phone className="w-4 h-4" /> Call Lead
                    </a>
                    <button className="flex-1 border-2 border-slate-100 text-slate-600 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                      <Calendar className="w-4 h-4" /> Log Contact
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50/80 px-6 py-4 flex items-center justify-between border-t border-slate-100">
                 <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${lead.jobWalkthroughComplete ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                   <span className="text-[10px] font-bold text-slate-500 uppercase">Walkthrough</span>
                 </div>
                 <button className="text-[10px] font-bold text-[#143d2b] uppercase tracking-widest hover:underline flex items-center gap-1">
                   View Full Details <ArrowRight className="w-3 h-3" />
                 </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center flex flex-col items-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Search className="text-slate-300 w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">No leads found</h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">
            There are no leads matching the "{filter}" status currently in the pipeline.
          </p>
        </div>
      )}

      {/* Capture Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-slate-900">Capture New Lead</h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Client Name</label>
                        <input 
                           required
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-[#143d2b]"
                           value={newLead.clientName}
                           onChange={e => setNewLead({...newLead, clientName: e.target.value})}
                           placeholder="e.g. John Doe"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                             <input 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#143d2b]"
                                value={newLead.phone}
                                onChange={e => setNewLead({...newLead, phone: e.target.value})}
                                placeholder="(555) 555-5555"
                             />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lead Source</label>
                             <select 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#143d2b]"
                                value={newLead.leadSource}
                                onChange={e => setNewLead({...newLead, leadSource: e.target.value})}
                             >
                                 <option value="Call">Phone Call</option>
                                 <option value="Facebook">Facebook</option>
                                 <option value="Google">Google Search</option>
                                 <option value="Referral">Referral</option>
                             </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Interest Description</label>
                        <textarea 
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#143d2b]"
                           value={newLead.description}
                           onChange={e => setNewLead({...newLead, description: e.target.value})}
                           placeholder="What service are they interested in?"
                           rows={3}
                        />
                    </div>
                    <button type="submit" className="w-full bg-[#143d2b] text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-[#143d2b]/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                        <Save className="w-4 h-4" /> Save Lead
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default LeadsManagement;
