
export interface Job {
  id: string;
  clientName: string;
  phone: string;
  email: string;
  address: string;
  cityArea: string;
  description: string;
  jobType: string;
  status: 'Lead' | 'Quoted' | 'Scheduled' | 'In Progress' | 'Completed' | 'Follow-Up Needed' | 'Rejected';
  priority: 'High' | 'Medium' | 'Low';
  leadSource: string;
  lastContactDate?: string;
  nextAction?: string;
  nextActionDate?: string;
  scheduledDate?: string;
  timeWindow?: string;
  crewLead?: string;
  crewSize?: number;
  estHours?: number;
  estRevenue: number;
  estCost: number;
  estProfit: number;
  estMargin: number;
  actualCompletionDate?: string;
  actualRevenue?: number;
  paymentStatus: 'Unpaid' | 'Paid' | 'Partial';
  notes: string;
  actualLaborHours?: number;
  actualLaborCost?: number;
  actualMaterialCost?: number;
  actualProfit?: number;
  jobCostingVariance?: number;
  materialsList?: string;
  equipmentNeeded?: string;
  siteAccessNotes?: string;
  rejectionReason?: string;
  followUpCount: number;
  jobWalkthroughComplete: boolean;
  recurringServicePitched: boolean;
}

export interface MowEstimate {
  id: string;
  clientName: string;
  address: string;
  zip: string;
  acreage: number;
  estMins: number;
  totalHours: number;
  price: number;
  date: string;
  estimator: string;
}

export interface MulchBed {
  id: string;
  name: string;
  sqft: number;
  depth: number; // inches
}

export interface LaborTask {
  id: string;
  task: string;
  crewSize: number;
  hoursPerPerson: number;
  hourlyRate: number;
}

export interface MaterialItem {
  id: string;
  item: string;
  qty: number;
  unit: string;
  unitCost: number;
}

export type ViewType = 'dashboard' | 'leads' | 'jobs' | 'schedule' | 'financials' | 'estimators';
export type EstimatorSubView = 'mow' | 'mulch' | 'landscape';

export interface DashboardStats {
  totalRevenue: number;
  activeJobs: number;
  avgMargin: number;
  pendingFollowUps: number;
}
