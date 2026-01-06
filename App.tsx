
import React, { useState, useMemo, useEffect } from 'react';
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
  Receipt,
  Map,
  Key
} from 'lucide-react';
import { Job, ViewType, MowEstimate, SavedMulchEstimate, SavedLandscapeEstimate } from './types';
import { mockJobs, getStats, mockEstimates } from './services/dataService';
import Dashboard from './components/Dashboard';
import JobManagement from './components/JobManagement';
import LeadsManagement from './components/LeadsManagement';
import Estimators from './components/Estimators';
import ReceiptUploader from './components/ReceiptUploader';
import Financials from './components/Financials';
import Schedule from './components/Schedule';
import RouteOptimizer from './components/RouteOptimizer';
import Logo from './components/Logo';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType | 'optimizer'>('dashboard');
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Lifted State for Bid Center Persistence
  const [mowEstimates, setMowEstimates] = useState<MowEstimate[]>(mockEstimates);
  const [mulchEstimates, setMulchEstimates] = useState<SavedMulchEstimate[]>([]);
  const [landscapeEstimates, setLandscapeEstimates] = useState<SavedLandscapeEstimate[]>([]);

  const stats = useMemo(() => getStats(jobs), [jobs]);

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => 
      job.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [jobs, searchQuery]);

  // Core Logic: Add New Job/Lead
  const handleAddJob = (newJob: Job) => {
    setJobs(prev => [newJob, ...prev]);
  };

  const handleUpdateJob = (updatedJob: Job) => {
    setJobs(prevJobs => prevJobs.map(j => j.id === updatedJob.id ? updatedJob : j));
  };

  const handleImportJobs = (newJobs: Job[]) => {
    // Avoid duplicates by ID
    const existingIds = new Set(jobs.map(j => j.id));
    const uniqueNewJobs = newJobs.filter(j => !existingIds.has(j.id));
    setJobs(prev => [...prev, ...uniqueNewJobs]);
    alert(`Successfully imported ${uniqueNewJobs.length} new records.`);
  };

  // Bid Center Handlers
  const handleAddMowEstimate = (est: MowEstimate) => setMowEstimates(prev => [est, ...prev]);
  const handleAddMulchEstimate = (est: SavedMulchEstimate) => setMulchEstimates(prev => [est, ...prev]);
  const handleAddLandscapeEstimate = (est: SavedLandscapeEstimate) => setLandscapeEstimates(prev => [est, ...prev]);

  const handleOpenApiKeySettings = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
      await aistudio.openSelectKey();
    } else {
      console.warn("AI Studio environment not detected.");
    }
  };

  const handleNavClick = (view: ViewType | 'optimizer') => {
    setActiveView(view);
    if (isMobile) setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {/* Mobile Backdrop */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:relative z-30 h-full bg-[#143d2b] text-white shadow-xl transition-all duration-300 flex flex-col
          ${isMobile 
            ? (isSidebarOpen ? 'translate-x-0 w-[80%]' : '-translate-x-full w-[80%]') 
            : (isSidebarOpen ? 'w-64 translate-x-0' : 'w-20 translate-x-0')
          }
        `}
      >
        <div className="p-6 flex items-center justify-between">
          <Logo showText={isSidebarOpen || isMobile} />
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        <nav className="flex-1 mt-2 px-4 space-y-2 overflow-y-auto no-scrollbar">
          <SidebarItem 
            icon={<LayoutDashboard />} 
            label="Dashboard" 
            isActive={activeView === 'dashboard'} 
            isOpen={isSidebarOpen || isMobile} 
            onClick={() => handleNavClick('dashboard')}
          />
          <SidebarItem 
            icon={<UserPlus />} 
            label="Leads & Sales" 
            isActive={activeView === 'leads'} 
            isOpen={isSidebarOpen || isMobile} 
            onClick={() => handleNavClick('leads')}
          />
          <SidebarItem 
            icon={<Briefcase />} 
            label="Active Jobs" 
            isActive={activeView === 'jobs'} 
            isOpen={isSidebarOpen || isMobile} 
            onClick={() => handleNavClick('jobs')}
          />
          <SidebarItem 
            icon={<Receipt />} 
            label="Receipts" 
            isActive={activeView === 'receipts'} 
            isOpen={isSidebarOpen || isMobile} 
            onClick={() => handleNavClick('receipts')}
          />
          <SidebarItem 
            icon={<Calculator />} 
            label="Bid Center" 
            isActive={activeView === 'estimators'} 
            isOpen={isSidebarOpen || isMobile} 
            onClick={() => handleNavClick('estimators')}
          />
          <SidebarItem 
            icon={<Map />} 
            label="Route Optimizer" 
            isActive={activeView === 'optimizer'} 
            isOpen={isSidebarOpen || isMobile} 
            onClick={() => handleNavClick('optimizer')}
          />
          <SidebarItem 
            icon={<Calendar />} 
            label="Schedule" 
            isActive={activeView === 'schedule'} 
            isOpen={isSidebarOpen || isMobile} 
            onClick={() => handleNavClick('schedule')}
          />
          <SidebarItem 
            icon={<DollarSign />} 
            label="Financials" 
            isActive={activeView === 'financials'} 
            isOpen={isSidebarOpen || isMobile} 
            onClick={() => handleNavClick('financials')}
          />
        </nav>

        <div className="p-4 border-t border-white/10">
          <SidebarItem 
            icon={<Settings />} 
            label="API Key Settings" 
            isActive={false} 
            isOpen={isSidebarOpen || isMobile} 
            onClick={() => {
              handleOpenApiKeySettings();
              if (isMobile) setIsSidebarOpen(false);
            }}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header */}
        <header className="bg-white border-b h-16 flex items-center justify-between px-4 md:px-8 shrink-0 z-10">
          <div className="flex items-center gap-3 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative max-w-xs md:max-w-md w-full ml-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2 focus:ring-2 focus:ring-[#143d2b] transition-all font-medium text-sm text-slate-900 placeholder:text-slate-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 ml-2">
             <button 
              onClick={handleOpenApiKeySettings}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-100 hover:bg-amber-100 transition-colors"
            >
              <Key className="w-3.5 h-3.5" />
              API Key
            </button>
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-px h-8 bg-slate-200 mx-1 md:mx-2 hidden md:block"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-900 leading-none text-right tracking-tight">God's Grace</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 text-right">Admin</p>
              </div>
              <div className="w-9 h-9 md:w-10 md:h-10 bg-[#4a3728] rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
                GG
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          {activeView === 'dashboard' && <Dashboard stats={stats} jobs={jobs} />}
          {activeView === 'leads' && (
            <LeadsManagement 
              jobs={jobs} 
              onAddLead={handleAddJob} 
              onImportLeads={handleImportJobs}
            />
          )}
          {activeView === 'jobs' && (
            <JobManagement 
              jobs={filteredJobs} 
              onAddJob={handleAddJob} 
              onUpdateJob={handleUpdateJob}
              onImportJobs={handleImportJobs}
            />
          )}
          {activeView === 'receipts' && <ReceiptUploader />}
          {activeView === 'estimators' && (
            <Estimators 
              mowEstimates={mowEstimates}
              onAddMowEstimate={handleAddMowEstimate}
              mulchEstimates={mulchEstimates}
              onAddMulchEstimate={handleAddMulchEstimate}
              landscapeEstimates={landscapeEstimates}
              onAddLandscapeEstimate={handleAddLandscapeEstimate}
            />
          )}
          {activeView === 'optimizer' && <RouteOptimizer jobs={jobs} />}
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
    className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all active:scale-95 ${
      isActive 
        ? 'bg-[#f4c430] text-[#143d2b] shadow-lg shadow-[#f4c430]/20' 
        : 'hover:bg-white/10 text-white/70 hover:text-white'
    }`}
  >
    <span className="flex-shrink-0">{React.cloneElement(icon as React.ReactElement<any>, { size: 22 })}</span>
    {isOpen && <span className="font-bold text-xs uppercase tracking-widest whitespace-nowrap animate-in fade-in duration-200">{label}</span>}
  </button>
);

export default App;
