
import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Camera, 
  FileText, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Calendar, 
  Store,
  Key
} from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { Expense } from '../types';

const ReceiptUploader: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedExpenses, setScannedExpenses] = useState<Expense[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [requiresKey, setRequiresKey] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to access the globally injected aistudio object safely
  const getAiStudio = () => (window as any).aistudio;

  const checkApiKey = async () => {
    // Access aistudio directly as it's assumed to be pre-configured and globally available.
    const aistudio = getAiStudio();
    const hasKey = await aistudio?.hasSelectedApiKey();
    if (!hasKey) {
      setRequiresKey(true);
      return false;
    }
    setRequiresKey(false);
    return true;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check for supported MIME types for Gemini API
    const supportedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];
    if (!supportedTypes.includes(file.type)) {
      setError(`Unsupported file format: ${file.type}. Please use PNG, JPEG, WEBP, or HEIC.`);
      return;
    }

    const hasKey = await checkApiKey();
    const aistudio = getAiStudio();
    if (!hasKey) {
      // Trigger API key selection dialog
      await aistudio?.openSelectKey();
      // Proceeding after triggering openSelectKey as per race condition instructions: 
      // Assume the key selection was successful after triggering openSelectKey.
    }

    setIsScanning(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        // Create a new GoogleGenAI instance right before making an API call
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        try {
          // Use gemini-2.5-flash for faster multimodal analysis
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
              parts: [
                {
                  inlineData: {
                    data: base64Data,
                    mimeType: file.type
                  }
                },
                {
                  text: `Analyze this receipt for a landscaping business expense. 
                  Extract: Store Name, Date (YYYY-MM-DD), Total Amount (number only), Category (e.g., Fuel, Materials, Equipment, Maintenance), and a list of primary items.
                  Return the result in JSON format.`
                }
              ]
            },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  store: { type: Type.STRING },
                  date: { type: Type.STRING },
                  total: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                  items: { 
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["store", "date", "total", "category", "items"]
              }
            }
          });

          // response.text returns the extracted string output directly
          const data = JSON.parse(response.text || '{}');
          const newExpense: Expense = {
            id: `EXP-${Date.now()}`,
            store: data.store || 'Unknown Store',
            date: data.date || new Date().toISOString().split('T')[0],
            total: data.total || 0,
            category: data.category || 'Uncategorized',
            items: data.items || [],
            imageUrl: reader.result as string
          };

          setScannedExpenses(prev => [newExpense, ...prev]);
        } catch (apiErr: any) {
          // If the request fails with a missing project error, prompt for key again
          if (apiErr.message?.includes("Requested entity was not found") || apiErr.message?.includes("API key")) {
            setRequiresKey(true);
            setError("API Key verification failed. Please select a valid key from a paid project.");
            await getAiStudio()?.openSelectKey();
          } else if (apiErr.message?.includes("Unsupported MIME type")) {
             setError("The image format is not supported by the AI model. Please convert to JPEG or PNG.");
          } else {
            setError("Failed to analyze receipt. Please try again.");
          }
          console.error(apiErr);
        } finally {
          setIsScanning(false);
        }
      };
    } catch (err) {
      setError("An error occurred during file processing.");
      setIsScanning(false);
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Expense Tracker</h1>
          <p className="text-slate-500 font-medium italic">"Managing God's resources with diligence and grace."</p>
        </div>
        
        <div className="flex items-center gap-3">
          {requiresKey && (
            <button 
              onClick={() => getAiStudio()?.openSelectKey()}
              className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-xs font-bold flex items-center gap-2 border border-amber-200"
            >
              <Key className="w-4 h-4" /> Setup API Key
            </button>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/png, image/jpeg, image/webp, image/heic, image/heif" 
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="bg-[#143d2b] text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-[#143d2b]/20 flex items-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
            {isScanning ? 'Scanning...' : 'Scan Receipt'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-bold animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Scan / Upload Area */}
        <div className="lg:col-span-1 space-y-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-4 border-dashed rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer group ${
              isScanning ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 hover:border-[#f4c430] hover:bg-[#f4c430]/5'
            }`}
          >
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${
              isScanning ? 'bg-slate-200 text-slate-400' : 'bg-slate-50 text-[#143d2b]'
            }`}>
              {isScanning ? <Loader2 className="w-10 h-10 animate-spin" /> : <Upload className="w-10 h-10" />}
            </div>
            <h3 className="font-black text-slate-900 text-xl mb-2">
              {isScanning ? 'AI is analyzing...' : 'Upload Receipt Photo'}
            </h3>
            <p className="text-slate-400 text-sm font-medium max-w-[200px]">
              {isScanning ? 'Extracting amounts, dates, and items using Gemini.' : 'Drag and drop or click to capture a fuel or material receipt (PNG, JPG).'}
            </p>
          </div>

          <div className="bg-[#143d2b] text-white p-8 rounded-3xl shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-5 h-5 text-[#f4c430]" />
              <h3 className="font-bold">AI Intelligence</h3>
            </div>
            <p className="text-sm text-white/70 leading-relaxed mb-6">
              Scan receipts to automatically categorize expenses and track job materials. This tool uses high-fidelity vision models to extract line-item detail.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs font-bold text-white/50">
                <CheckCircle2 className="w-4 h-4 text-[#f4c430]" />
                <span>Auto-categorization</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-white/50">
                <CheckCircle2 className="w-4 h-4 text-[#f4c430]" />
                <span>Job Material Linking</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-white/50">
                <CheckCircle2 className="w-4 h-4 text-[#f4c430]" />
                <span>Tax-ready Export</span>
              </div>
            </div>
          </div>
        </div>

        {/* History / Scanned List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-[#4a3728] p-2 rounded-lg text-white">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800">Recent Scans</h3>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {scannedExpenses.length} Total Records
              </span>
            </div>

            <div className="divide-y divide-slate-50">
              {scannedExpenses.map((expense) => (
                <div key={expense.id} className="p-6 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex-shrink-0">
                    {expense.imageUrl ? (
                      <img src={expense.imageUrl} alt="Receipt thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <FileText className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-black text-slate-900">{expense.store}</h4>
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase border border-emerald-100">
                        {expense.category}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-tight">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {expense.date}</span>
                      <span className="flex items-center gap-1.5"><Store className="w-3 h-3" /> {expense.items.length} Items</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {expense.items.slice(0, 3).join(', ')}{expense.items.length > 3 ? '...' : ''}
                    </p>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <p className="text-2xl font-black text-[#143d2b] tracking-tighter">
                      ${expense.total.toFixed(2)}
                    </p>
                    <button className="text-[10px] font-black text-[#f4c430] uppercase hover:underline mt-1">
                      Edit Record
                    </button>
                  </div>
                </div>
              ))}

              {scannedExpenses.length === 0 && !isScanning && (
                <div className="py-20 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <FileText className="text-slate-200 w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-slate-800">No receipts scanned yet</h3>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto mt-1">
                    Upload your first receipt to see the AI magic and track your expenses.
                  </p>
                </div>
              )}

              {isScanning && scannedExpenses.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center">
                  <Loader2 className="w-10 h-10 animate-spin text-[#f4c430] mb-4" />
                  <h3 className="font-bold text-slate-800 tracking-tight">Analyzing your document...</h3>
                  <p className="text-slate-500 text-sm mt-1">Reading store data, amounts, and tax details.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptUploader;
