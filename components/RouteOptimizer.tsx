
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Map as MapIcon, 
  Plus, 
  Trash2, 
  Navigation, 
  MapPin, 
  Save, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Briefcase,
  Sparkles,
  List,
  ArrowRight,
  Clock,
  Car,
  GripVertical
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { Job } from '../types';

// Expanded Central PA Town List
const CENTRAL_PA_TOWNS = [
  "York", "Dover", "Hanover", "Lancaster", "Harrisburg", "Gettysburg", 
  "Mechanicsburg", "Camp Hill", "Red Lion", "Dallastown", "Manchester", 
  "Wrightsville", "Columbia", "Lititz", "Carlisle", "Hershey", "Elizabethtown",
  "Spring Grove", "Shrewsbury", "New Oxford", "Glen Rock", "Emigsville",
  "Hellam", "Jacobus", "Loganville", "Seven Valleys", "Stewartstown",
  "Wellsville", "Windsor", "Winterstown", "Yoe", "York Haven", "Etters",
  "Lewisberry", "Dillsburg", "Mount Wolf", "East York", "West York", 
  "North York", "Hallam", "Spry", "Shiloh", "Weigelstown", "Paradise",
  "Ephrata", "Manheim", "Marietta", "Mount Joy", "Hummelstown", "Middletown"
];

// Prioritized PA Street Suffixes
const STREET_SUFFIXES = [
  "St", "Rd", "Ave", "Dr", "Ln", "Ct", "Blvd", "Way", "Cir", "Pike", 
  "Pl", "Ter", "Aly", "Hwy", "Trl", "Close", "Ext", "Loop", "Run", "View", "Hills",
  "Road", "Street", "Avenue", "Lane", "Drive"
];

// Common PA/Regional Abbreviations
const PA_ABBREVIATIONS: Record<string, string> = {
  "mt": "Mount",
  "mkt": "Market",
  "pk": "Park",
  "hts": "Heights",
  "vlg": "Village",
  "sq": "Square",
  "hwy": "Highway",
  "tup": "Turnpike",
  "lk": "Lake",
  "hl": "Hill",
  "ck": "Creek"
};

const AVERAGE_SPEED_MPH = 30;

interface RouteStop {
  id: string;
  address: string;
  lat?: number;
  lng?: number;
  isGeocoding: boolean;
  geocodingError?: boolean;
}

interface RouteOptimizerProps {
  jobs?: Job[];
}

const RouteOptimizer: React.FC<RouteOptimizerProps> = ({ jobs = [] }) => {
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [optimizedPlan, setOptimizedPlan] = useState<string | null>(null);
  const [groundingLinks, setGroundingLinks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'text'>('map');
  const [draggedStopIndex, setDraggedStopIndex] = useState<number | null>(null);
  
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const routeLabelsRef = useRef<any[]>([]);
  const prevStopCountRef = useRef<number>(0);

  const getAiStudio = () => (window as any).aistudio;

  // Calculate Route Metrics (Distance & Time)
  const routeMetrics = useMemo(() => {
    let totalDist = 0;
    const legMetrics: { distance: string; time: number }[] = [];

    for (let i = 0; i < stops.length - 1; i++) {
      const current = stops[i];
      const next = stops[i + 1];

      if (current.lat && current.lng && next.lat && next.lng) {
        const R = 3958.8; // Radius of Earth in miles
        const dLat = (next.lat - current.lat) * Math.PI / 180;
        const dLon = (next.lng - current.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(current.lat * Math.PI / 180) * Math.cos(next.lat * Math.PI / 180) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        // Calculate time based on average speed
        const timeHours = distance / AVERAGE_SPEED_MPH;
        const timeMinutes = Math.round(timeHours * 60);
        
        legMetrics.push({
            distance: distance.toFixed(1),
            time: Math.max(1, timeMinutes) // Minimum 1 min
        });
        totalDist += distance;
      } else {
        legMetrics.push({ distance: '0', time: 0 });
      }
    }
    
    return {
        legs: legMetrics,
        totalDistance: totalDist.toFixed(1),
        totalTime: Math.round((totalDist / AVERAGE_SPEED_MPH) * 60)
    };
  }, [stops]);

  // List Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedStopIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedStopIndex === null || draggedStopIndex === index) return;

    const newStops = [...stops];
    const [draggedItem] = newStops.splice(draggedStopIndex, 1);
    newStops.splice(index, 0, draggedItem);
    
    setStops(newStops);
    setDraggedStopIndex(null);
  };

  // Reverse Geocode (Map Click -> Address)
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // Add delay for free tier usage
      await new Promise(r => setTimeout(r, 500));
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      
      // Construct a clean short address if possible
      if (data.address) {
        const num = data.address.house_number || '';
        const road = data.address.road || '';
        const city = data.address.city || data.address.town || data.address.village || '';
        if (num && road) return `${num} ${road}, ${city}`;
        if (road) return `${road}, ${city}`;
        return data.display_name.split(',').slice(0, 3).join(',');
      }
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (e) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  // Initialize Map
  useEffect(() => {
    if (viewMode === 'map' && mapContainerRef.current && !mapInstanceRef.current) {
      const L = (window as any).L;
      if (!L) return; // Wait for Leaflet to load

      const map = L.map(mapContainerRef.current).setView([39.9626, -76.7277], 11); // Default to York, PA
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
    }
  }, [viewMode]);

  // Map Click Listener for Adding Stops
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = async (e: any) => {
      const { lat, lng } = e.latlng;
      setIsVerifying(true);
      setError(null);

      // Create temporary "Locating..." stop
      const tempId = `MAP-${Date.now()}`;
      setStops(prev => [...prev, {
        id: tempId,
        address: "Locating from map...",
        lat: lat,
        lng: lng,
        isGeocoding: true
      }]);

      const address = await reverseGeocode(lat, lng);
      
      setStops(prev => prev.map(s => s.id === tempId ? {
        ...s,
        address: address,
        isGeocoding: false
      } : s));
      
      setIsVerifying(false);
    };

    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
    };
  }, [mapInstanceRef.current]);

  // Update Map Markers & Route
  useEffect(() => {
    const L = (window as any).L;
    if (!mapInstanceRef.current || !L) return;

    const map = mapInstanceRef.current;

    // Clear existing markers/lines
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
    // Clear existing route labels
    routeLabelsRef.current.forEach(l => l.remove());
    routeLabelsRef.current = [];

    const validPoints: [number, number][] = [];

    stops.forEach((stop, idx) => {
      if (stop.lat && stop.lng) {
        const isStart = idx === 0;
        
        // Create custom icon based on position
        const iconHtml = `
          <div style="
            background-color: ${isStart ? '#143d2b' : '#f4c430'};
            color: ${isStart ? 'white' : '#143d2b'};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            cursor: grab;
          ">
            ${idx + 1}
          </div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: 'custom-map-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        // ----------------------------------------------------
        // DOM-based Popup Creation for Interactivity
        // ----------------------------------------------------
        const popupContainer = document.createElement('div');
        popupContainer.className = "font-sans min-w-[150px]";
        
        // Header
        const header = document.createElement('div');
        header.className = "font-bold text-slate-800 mb-1";
        header.innerText = `Stop ${idx + 1}`;
        popupContainer.appendChild(header);

        // Address
        const addrDiv = document.createElement('div');
        addrDiv.className = "text-xs text-slate-600 mb-3 leading-tight";
        addrDiv.innerText = stop.address;
        popupContainer.appendChild(addrDiv);

        // Next Stop Metrics (if applicable)
        if (idx < stops.length - 1 && routeMetrics.legs[idx]) {
          const leg = routeMetrics.legs[idx];
          const metricsDiv = document.createElement('div');
          metricsDiv.innerHTML = `
             <div class="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs font-bold text-[#143d2b]">
               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
               ${leg.time} min to next
             </div>
             <div class="text-[10px] text-slate-400 font-medium ml-5">${leg.distance} miles</div>
          `;
          popupContainer.appendChild(metricsDiv);
        }

        // Actions Container
        const actionsDiv = document.createElement('div');
        actionsDiv.className = "flex items-center justify-between mt-3 pt-2 border-t border-slate-100";
        
        // Drag Hint
        const dragHint = document.createElement('span');
        dragHint.className = "text-[9px] text-slate-300 uppercase tracking-wider";
        dragHint.innerText = "DRAG TO MOVE";
        actionsDiv.appendChild(dragHint);

        // Remove Button
        const removeBtn = document.createElement('button');
        removeBtn.className = "text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded transition-colors";
        removeBtn.title = "Remove Stop";
        removeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`;
        removeBtn.onclick = (e) => {
           e.stopPropagation(); // Prevent map click
           removeStop(stop.id);
        };
        actionsDiv.appendChild(removeBtn);

        popupContainer.appendChild(actionsDiv);
        // ----------------------------------------------------

        const marker = L.marker([stop.lat, stop.lng], { 
          icon, 
          draggable: true,
          zIndexOffset: isStart ? 1000 : 0,
          title: "Drag to move stop"
        })
          .bindPopup(popupContainer)
          .addTo(map);

        // Real-time polyline update during drag
        marker.on('drag', (e: any) => {
          if (polylineRef.current) {
            // Update the visual path using current locations of all markers
            const currentPoints = markersRef.current.map(m => m.getLatLng());
            polylineRef.current.setLatLngs(currentPoints);
          }
        });

        // Handle drag end to update state
        marker.on('dragend', (event: any) => {
          const newPos = event.target.getLatLng();
          setStops(prev => prev.map(s => 
            s.id === stop.id ? { ...s, lat: newPos.lat, lng: newPos.lng } : s
          ));
        });

        markersRef.current.push(marker);
        validPoints.push([stop.lat, stop.lng]);
      }
    });

    // Draw route line if we have points
    if (validPoints.length > 1) {
      polylineRef.current = L.polyline(validPoints, { 
        color: '#143d2b', 
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10',
        dashOffset: '0'
      }).addTo(map);

      // Add Dynamic Leg Labels
      for (let i = 0; i < validPoints.length - 1; i++) {
        const p1 = validPoints[i];
        const p2 = validPoints[i+1];
        
        // Calculate metrics for this visual segment
        const R = 3958.8; // Radius of Earth in miles
        const dLat = (p2[0] - p1[0]) * Math.PI / 180;
        const dLon = (p2[1] - p1[1]) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(p1[0] * Math.PI / 180) * Math.cos(p2[0] * Math.PI / 180) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        const timeMinutes = Math.round((distance / AVERAGE_SPEED_MPH) * 60);

        // Midpoint
        const midLat = (p1[0] + p2[0]) / 2;
        const midLng = (p1[1] + p2[1]) / 2;

        const labelHtml = `
          <div class="flex items-center gap-1.5 bg-white/95 backdrop-blur px-2 py-0.5 rounded-full shadow-sm border border-slate-200 transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform cursor-default pointer-events-auto">
             <span class="text-[10px] font-bold text-slate-700 whitespace-nowrap">${Math.max(1, timeMinutes)} min</span>
             <span class="w-0.5 h-2 bg-slate-300 rounded-full"></span>
             <span class="text-[9px] font-medium text-slate-400 whitespace-nowrap">${distance.toFixed(1)} mi</span>
          </div>
        `;

        const labelIcon = L.divIcon({
          className: 'route-label-icon',
          html: labelHtml,
          iconSize: [0, 0], // Size handled by HTML content
          iconAnchor: [0, 0] // Centering handled by CSS transform in HTML
        });

        const labelMarker = L.marker([midLat, midLng], { 
          icon: labelIcon, 
          zIndexOffset: 100, // Below pins (1000)
          interactive: false
        }).addTo(map);

        routeLabelsRef.current.push(labelMarker);
      }
      
      // Smart Bounds Fitting: Only fit bounds if the NUMBER of stops changed, or first load.
      if (validPoints.length !== prevStopCountRef.current) {
         const bounds = L.latLngBounds(validPoints);
         map.fitBounds(bounds, { padding: [50, 50] });
         prevStopCountRef.current = validPoints.length;
      }
    } else if (validPoints.length === 1 && prevStopCountRef.current !== 1) {
      map.setView(validPoints[0], 13);
      prevStopCountRef.current = 1;
    } else if (validPoints.length === 0) {
      prevStopCountRef.current = 0;
    }

  }, [stops, viewMode, routeMetrics]);

  // Geocoding Helper
  const geocodeAddress = async (address: string): Promise<{lat: number, lng: number} | null> => {
    try {
      // Using standard Nominatim free tier - Requires generous throttling in production
      await new Promise(r => setTimeout(r, 800)); 
      
      // Remove any apartment/unit numbers from the start of string for better geocoding
      const cleanAddress = address.replace(/^(unit|apt|suite|#)\s*[\w-]+\s*,?\s*/i, '');

      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanAddress)}&limit=1`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (e) {
      console.error("Geocoding failed for", address, e);
    }
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewAddress(val);
    
    // Clear error if user starts typing again
    if (error) setError(null);

    if (val.length < 2) {
      setSuggestions([]);
      return;
    }

    let newSuggestions: string[] = [];
    const hasNumber = /\d/.test(val);
    const words = val.split(' ');
    const lastWord = words[words.length - 1] || '';
    
    // 1. Abbreviation Expansion
    if (lastWord.toLowerCase() in PA_ABBREVIATIONS && !val.endsWith(' ')) {
        const expanded = PA_ABBREVIATIONS[lastWord.toLowerCase()];
        const base = val.substring(0, val.lastIndexOf(' '));
        newSuggestions.push(`${base} ${expanded}`);
    }

    // 2. Suffix Autocomplete
    if (hasNumber && lastWord.length > 0 && !val.includes(',')) {
       const potentialSuffixes = STREET_SUFFIXES.filter(s => 
         s.toLowerCase().startsWith(lastWord.toLowerCase()) && 
         s.toLowerCase() !== lastWord.toLowerCase()
       );
       if (potentialSuffixes.length > 0) {
         const base = val.substring(0, val.lastIndexOf(' '));
         potentialSuffixes.forEach(s => {
             newSuggestions.push(`${base} ${s}`);
         });
       }
    }

    // 3. Town Suggestions (After Suffix or Comma)
    const endsWithSuffix = STREET_SUFFIXES.some(s => 
      val.toLowerCase().endsWith(` ${s.toLowerCase()}`) || 
      val.toLowerCase().endsWith(` ${s.toLowerCase()}.`)
    );

    if (endsWithSuffix && !val.includes(',')) {
      const priorityTowns = ["York", "Dover", "Hanover", "Red Lion", "Lancaster"];
      priorityTowns.forEach(town => newSuggestions.push(`${val}, ${town}, PA`));
    }

    // 4. Explicit City Search
    if (val.includes(',')) {
      const parts = val.split(',');
      const cityPart = parts[parts.length - 1].trim().toLowerCase();
      if (cityPart.length > 0) {
        const matchedTowns = CENTRAL_PA_TOWNS.filter(t => 
          t.toLowerCase().startsWith(cityPart)
        );
        const prefix = parts.slice(0, -1).join(',').trim();
        matchedTowns.slice(0, 3).forEach(t => newSuggestions.push(`${prefix}, ${t}, PA`));
      }
    }

    setSuggestions(Array.from(new Set(newSuggestions)).slice(0, 5));
  };

  const selectSuggestion = (suggestion: string) => {
    setNewAddress(suggestion);
    setSuggestions([]);
  };

  // Input Validation Logic
  const validateAddressInput = (input: string) => {
    const clean = input.trim();
    if (clean.length < 5) {
      setError("Address is too short. Please enter a full street address.");
      return false;
    }

    // Check for starting digit (Street number)
    if (!/^\d+/.test(clean)) {
      setError("Start with a street number (e.g. '123').");
      return false;
    }

    // Check for street suffix
    const hasSuffix = STREET_SUFFIXES.some(s => new RegExp(`\\b${s}\\.?\\b`, 'i').test(clean));
    if (!hasSuffix) {
      setError("Include a street type (St, Rd, Ave, etc).");
      return false;
    }

    // Check for local context (Town or State)
    const hasTown = CENTRAL_PA_TOWNS.some(t => new RegExp(`\\b${t}\\b`, 'i').test(clean));
    const hasState = /\bPA\b/i.test(clean) || /\bPennsylvania\b/i.test(clean);
    
    if (!hasTown && !hasState) {
       setError("Specify a Central PA town or add 'PA'.");
       return false;
    }
    return true;
  };

  const verifyAndAddAddress = async () => {
    if (!newAddress.trim()) return;

    // Validate before proceeding
    if (!validateAddressInput(newAddress)) {
      return;
    }
    setError(null);

    setIsVerifying(true);
    const tempId = Date.now().toString();
    
    // 1. Add placeholder to UI immediately
    const newStop: RouteStop = {
      id: tempId,
      address: newAddress,
      isGeocoding: true
    };
    
    // Helper to get formatted address from AI
    let finalAddress = newAddress.trim();
    const aistudio = getAiStudio();
    const hasKey = await aistudio?.hasSelectedApiKey();

    if (hasKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `
            Standardize this address specifically for Central Pennsylvania (York/Lancaster region).
            Input: "${finalAddress}"
            
            Rules:
            1. Correct common spelling errors for local towns (e.g. "Hbg" -> "Harrisburg").
            2. Expand abbreviations like "Mt" to "Mount", "Mkt" to "Market" if appropriate for street names.
            3. Ensure State is PA.
            4. Return ONLY the clean, full address string.
          `,
        });
        if (response.text) finalAddress = response.text.trim();
      } catch (e) { console.warn('AI verify failed', e); }
    }

    newStop.address = finalAddress;
    setStops(prev => [...prev, newStop]);
    setNewAddress('');
    setSuggestions([]);
    setIsVerifying(false);

    // 2. Geocode in background
    const coords = await geocodeAddress(finalAddress);
    
    setStops(prev => prev.map(s => 
      s.id === tempId 
        ? { ...s, lat: coords?.lat, lng: coords?.lng, isGeocoding: false, geocodingError: !coords } 
        : s
    ));
  };

  const removeStop = (id: string) => {
    setStops(prev => prev.filter(s => s.id !== id));
  };

  const handleImportMows = () => {
    const mowJobs = jobs.filter(j => 
      ['Scheduled', 'In Progress'].includes(j.status) &&
      (j.jobType.toLowerCase().includes('mow') || 
       j.description.toLowerCase().includes('mow'))
    );

    if (mowJobs.length === 0) {
      alert("No active lawn mowing jobs found.");
      return;
    }

    // Process one by one to respect geocoding limits gently
    let delay = 0;
    mowJobs.forEach((j) => {
      const addr = j.address.toLowerCase().includes(j.cityArea.toLowerCase()) ? j.address : `${j.address}, ${j.cityArea}, PA`;
      
      // Check duplicate
      if (!stops.find(s => s.address === addr)) {
        setTimeout(() => {
          const newStop: RouteStop = {
            id: `JOB-${j.id}`,
            address: addr,
            isGeocoding: true
          };
          setStops(prev => [...prev, newStop]);
          geocodeAddress(addr).then(coords => {
            setStops(prev => prev.map(s => s.id === `JOB-${j.id}` ? { ...s, lat: coords?.lat, lng: coords?.lng, isGeocoding: false } : s));
          });
        }, delay);
        delay += 800;
      }
    });
  };

  const handleOptimize = async () => {
    if (stops.length < 2) {
      setError("Add at least 2 stops.");
      return;
    }

    const aistudio = getAiStudio();
    const hasKey = await aistudio?.hasSelectedApiKey();
    if (!hasKey) {
      await aistudio?.openSelectKey();
    }

    setIsOptimizing(true);
    setError(null);
    setOptimizedPlan(null);
    setGroundingLinks([]);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // We pass the list with indices and coordinates for better accuracy
      const stopsList = stops.map((s, i) => 
        `${i}: ${s.address} ${s.lat && s.lng ? `(Lat: ${s.lat}, Lng: ${s.lng})` : ''}`
      ).join('\n');
      
      const prompt = `
        I have a list of stops for a landscaping crew in York, PA.
        Start Location: ${stops[0].address} (Index 0)
        
        Stops to optimize:
        ${stopsList}

        Task:
        1. Reorder these stops to create the most efficient driving route starting from index 0.
        2. Use the provided coordinates to ensure accurate routing sequence.
        3. Return the response in raw JSON format with this structure:
           {
             "optimizedIndices": [0, 3, 1, 2, ...], 
             "narrative": "Detailed turn-by-turn plan..."
           }
        4. The "optimizedIndices" array MUST contain the original indices in the new order.
      `;

      // Note: responseMimeType is not allowed with googleMaps tool, so we parse manually
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
        }
      });

      const text = response.text || '';
      
      // Extract JSON from text block
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        if (data.optimizedIndices && Array.isArray(data.optimizedIndices)) {
          // Reorder the stops state!
          const newOrder = data.optimizedIndices.map((oldIndex: number) => stops[oldIndex]).filter(Boolean);
          setStops(newOrder);
          setOptimizedPlan(data.narrative || "Route optimized successfully.");
        } else {
          setOptimizedPlan(text); // Fallback to raw text
        }
      } else {
         setOptimizedPlan(text);
      }
      
      // Grounding data
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const links = chunks
        .filter((c: any) => c.web?.uri || c.web?.title)
        .map((c: any) => ({
          title: c.web?.title || 'Map Link',
          uri: c.web?.uri
        }));
      setGroundingLinks(links);

    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("API key")) {
         setError("API Key issue. Please verify.");
         await getAiStudio()?.openSelectKey();
      } else {
         setError("Optimization failed. Try again.");
      }
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Route Optimizer</h1>
          <p className="text-slate-500 font-medium">AI logistics with dynamic mapping.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={handleImportMows}
             className="bg-[#f4c430] text-[#143d2b] px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-[#eac040] transition-colors flex items-center gap-2"
           >
             <Briefcase className="w-4 h-4" /> Import Active Jobs
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        {/* Left Column: Stops List */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1">
             <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-[#143d2b] p-2 rounded-lg text-white">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800">Route Stops</h3>
              </div>
              {stops.length > 0 && (
                <button 
                  onClick={() => setStops([])}
                  className="text-xs font-bold text-rose-500 hover:bg-rose-50 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>

            {/* Address Input */}
            <div className="relative mb-2" ref={suggestionsRef}>
              <div className="relative">
                <input 
                  type="text" 
                  value={newAddress}
                  onChange={handleInputChange}
                  onKeyDown={(e) => e.key === 'Enter' && verifyAndAddAddress()}
                  disabled={isVerifying}
                  placeholder="Add a stop (e.g. 123 Main St)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm font-medium focus:ring-2 focus:ring-[#143d2b] outline-none text-slate-900"
                />
                {isVerifying ? (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#f4c430]" />
                  </div>
                ) : (
                  <button 
                    onClick={verifyAndAddAddress}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#f4c430] text-[#143d2b] rounded-lg hover:scale-105 transition-transform"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectSuggestion(s)}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-[#f4c430]/10 hover:text-[#143d2b] border-b border-slate-50 last:border-none flex items-center gap-2"
                    >
                       <MapPin className="w-3 h-3 text-slate-400" /> {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Validation Error Display */}
            {error && (
              <div className="mb-4 bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            {/* Stop List */}
            <div className="space-y-0 max-h-[500px] overflow-y-auto pr-1">
              {stops.map((stop, idx) => (
                <div 
                  key={stop.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  className={`transition-all duration-200 ${draggedStopIndex === idx ? 'opacity-40 scale-[0.98]' : 'opacity-100'}`}
                >
                  {/* Stop Item */}
                  <div className="group relative flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-[#f4c430] transition-colors z-10 cursor-move">
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-300">
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ml-3 ${idx === 0 ? 'bg-[#143d2b] text-white' : 'bg-white border-2 border-[#143d2b] text-[#143d2b]'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{stop.address}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {stop.isGeocoding ? (
                          <span className="text-[10px] text-[#f4c430] font-bold flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Locating...
                          </span>
                        ) : stop.geocodingError ? (
                          <span className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Location not found
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Mapped
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => removeStop(stop.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Metric Line to Next Stop */}
                  {idx < stops.length - 1 && routeMetrics.legs[idx] && (
                    <div className="pl-6 pb-2 -mt-1 pt-1 relative z-0">
                       <div className="border-l-2 border-dashed border-slate-300 ml-6 pl-6 py-2 flex items-center gap-3">
                          <div className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md flex items-center gap-1.5 border border-blue-100 shadow-sm text-xs font-bold">
                             <Clock className="w-3.5 h-3.5" /> 
                             <span>{routeMetrics.legs[idx].time} min</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                             <Car className="w-3.5 h-3.5" /> 
                             <span>{routeMetrics.legs[idx].distance} mi</span>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              ))}
              {stops.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-100">
                  Add stops to build route
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
               <button 
                onClick={handleOptimize}
                disabled={isOptimizing || stops.length < 2}
                className="w-full bg-[#143d2b] text-white py-4 rounded-xl font-black shadow-lg shadow-[#143d2b]/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOptimizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
                {isOptimizing ? 'Optimizing Route...' : 'Calculate Best Route'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Map & Results */}
        <div className="lg:col-span-2 flex flex-col gap-6">
           <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[500px] relative">
             {/* Map Controls */}
             <div className="absolute top-4 right-4 z-[400] bg-white p-1.5 rounded-xl shadow-md flex gap-1">
                <button 
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'map' ? 'bg-[#143d2b] text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  <MapIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setViewMode('text')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'text' ? 'bg-[#143d2b] text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  <List className="w-5 h-5" />
                </button>
             </div>

             {/* Dynamic Map Container */}
             <div 
               ref={mapContainerRef} 
               className={`w-full h-full bg-slate-100 ${viewMode === 'map' ? 'block' : 'hidden'}`}
             ></div>

             {/* Text View Overlay */}
             {viewMode === 'text' && (
                <div className="w-full h-full bg-white p-8 overflow-y-auto">
                   <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                     <Sparkles className="w-5 h-5 text-[#f4c430]" /> Optimization Report
                   </h3>
                   {optimizedPlan ? (
                     <div className="prose prose-sm prose-slate max-w-none">
                       <div className="whitespace-pre-wrap">{optimizedPlan}</div>
                       {groundingLinks.length > 0 && (
                          <div className="mt-6 pt-6 border-t border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Google Maps Sources</p>
                            <div className="flex flex-wrap gap-2">
                              {groundingLinks.map((l, i) => (
                                <a key={i} href={l.uri} target="_blank" className="text-xs bg-slate-50 px-3 py-1.5 rounded-lg text-blue-600 hover:underline flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {l.title}
                                </a>
                              ))}
                            </div>
                          </div>
                       )}
                     </div>
                   ) : (
                     <p className="text-slate-400 italic">No optimization results yet. Run the optimizer to see details.</p>
                   )}
                </div>
             )}
             
             {/* Empty State for Map */}
             {viewMode === 'map' && stops.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-[500] pointer-events-none">
                   <div className="text-center">
                      <MapIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-500">Map active</p>
                      <p className="text-xs text-slate-400">Click map to add stops</p>
                   </div>
                </div>
             )}
           </div>
           
           {/* Stats / Legend Bar */}
           <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-[#143d2b] text-white flex items-center justify-center font-bold">1</div>
                 <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-400 uppercase">Start Point</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{stops[0]?.address || 'Not Set'}</p>
                 </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-[#f4c430] text-[#143d2b] flex items-center justify-center font-bold">
                    <Car className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Trip Estimates</p>
                    <p className="text-sm font-bold text-slate-900">
                       {routeMetrics.totalDistance} mi <span className="text-slate-300 mx-1">|</span> {routeMetrics.totalTime} min
                    </p>
                 </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                 <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">Total Stops</p>
                    <p className="text-2xl font-black text-slate-900">{stops.length}</p>
                 </div>
                 <ArrowRight className="w-6 h-6 text-slate-200" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default RouteOptimizer;
