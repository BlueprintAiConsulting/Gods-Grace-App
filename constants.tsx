
export const COLORS = {
  primaryGreen: '#143d2b', // Deep green from logo
  secondaryYellow: '#f4c430', // Golden yellow from sun
  accentBrown: '#4a3728', // Brown from cross/subtext
  bgLight: '#f8fafc',
  white: '#ffffff',
};

export const STATUS_COLORS: Record<string, string> = {
  'Scheduled': 'bg-blue-100 text-blue-800 border-blue-200',
  'Follow-Up Needed': 'bg-amber-100 text-amber-800 border-amber-200',
  'Completed': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Lead': 'bg-slate-100 text-slate-800 border-slate-200',
  'In Progress': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Quoted': 'bg-purple-100 text-purple-800 border-purple-200',
  'Rejected': 'bg-rose-100 text-rose-800 border-rose-200',
};

export const PRIORITY_COLORS: Record<string, string> = {
  'High': 'text-rose-600 font-bold',
  'Medium': 'text-amber-600 font-semibold',
  'Low': 'text-slate-500',
};
