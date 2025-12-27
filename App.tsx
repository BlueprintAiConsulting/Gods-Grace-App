import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  Calendar, 
  DollarSign, 
  Search, 
  Bell, 
  Settings,
  Menu,
  X,
  UserPlus,
  Calculator,
  Receipt
} from 'lucide-react';
import { Job, ViewType } from './types';
import { mockJobs, getStats } from './services/dataService';
import Dashboard from './components/Dashboard';
import JobManagement from './components/JobManagement';
import LeadsManagement from './components/LeadsManagement';
import Estimators from './components/Estimators';
import ReceiptUploader from './components/ReceiptUploader';
import Financials from './components/Financials';
import Schedule from './components/Schedule';
import Logo from './components/Logo';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const stats = useMemo(() => getStats(jobs), [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => 
      job.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [jobs, searchQuery]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`bg-[#143d2b] text-white transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'} flex flex-col shadow-xl z-20`}>
        <div className="p-6">
          <Logo showText={isSidebarOpen} />
        </div>

        <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto">
          <SidebarItem 
            icon={<LayoutDashboard />} 
            label="Dashboard" 
            isActive={activeView === 'dashboard'} 
            isOpen={isSidebarOpen} 
            onClick={() => setActiveView('dashboard')}
          />
          <SidebarItem 
            icon={<UserPlus />} 
            label="Leads & Sales" 
            isActive={activeView === 'leads'} 
            isOpen={isSidebarOpen} 
            onClick={() => setActiveView('leads')}
          />
          <SidebarItem 
            icon={<Briefcase />} 
            label="Active Jobs" 
            isActive={activeView === 'jobs'} 
            isOpen={isSidebarOpen} 
            onClick={() => setActiveView('jobs')}
          />
          <SidebarItem 
            icon={<Receipt />} 
            label="Receipts" 
            isActive={activeView === 'receipts'} 
            isOpen={isSidebarOpen} 
            onClick={() => setActiveView('receipts')}
          />
          <SidebarItem 
            icon={<Calculator />} 
            label="Bid Center" 
            isActive={activeView === 'estimators'} 
            isOpen={isSidebarOpen} 
            onClick={() => setActiveView('estimators')}
          />
          <SidebarItem 
            icon={<Calendar />} 
            label="Schedule" 
            isActive={activeView === 'schedule'} 
            isOpen={isSidebarOpen} 
            onClick={() => setActiveView('schedule')}
          />
          <SidebarItem 
            icon={<DollarSign />} 
            label="Financials" 
            isActive={activeView === 'financials'} 
            isOpen={isSidebarOpen} 
            onClick={() => setActiveView('financials')}
          />
        </nav>

        <div className="p-4 border-t border-white/10">
          <SidebarItem 
            icon={<Settings />} 
            label="Settings" 
            isActive={false} 
            isOpen={isSidebarOpen} 
            onClick={() => {}}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#f8fafc]">
        {/* Header */}
        <header className="bg-white border-b h-16 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isSidebarOpen ? <X className="w-5 h-5 text-slate-500" /> : <Menu className="w-5 h-5 text-slate-500" />}
            </button>
            <div className="relative max-w-md w-full ml-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search master records..." 
                className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2 focus:ring-2 focus:ring-[#143d2b] transition-all font-medium text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-px h-8 bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-900 leading-none text-right tracking-tight">God's Grace Admin</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 text-right">Owner Portal</p>
              </div>
              <div className="w-10 h-10 bg-[#4a3728] rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md">
                GG
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeView === 'dashboard' && <Dashboard stats={stats} jobs={jobs} />}
          {activeView === 'leads' && <LeadsManagement jobs={jobs} />}
          {activeView === 'jobs' && (
            <JobManagement 
              jobs={filteredJobs} 
              onAddJob={() => alert('New Job Entry Logic Coming Soon!')} 
            />
          )}
          {activeView === 'receipts' && <ReceiptUploader />}
          {activeView === 'estimators' && <Estimators />}
          {activeView === 'schedule' && <Schedule jobs={filteredJobs} />}
          {activeView === 'financials' && <Financials jobs={filteredJobs} />}
        </div>
      </main>
    </div>
  );
};

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isOpen: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, isActive, isOpen, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all ${
      isActive 
        ? 'bg-[#f4c430] text-[#143d2b] shadow-lg shadow-[#f4c430]/20' 
        : 'hover:bg-white/10 text-white/70 hover:text-white'
    }`}
  >
    <span className="flex-shrink-0">{React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}</span>
    {isOpen && <span className="font-bold text-xs uppercase tracking-widest whitespace-nowrap">{label}</span>}
  </button>
);

export default App;