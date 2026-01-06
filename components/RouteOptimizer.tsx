
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
  GripVertical,
  Key,
  ExternalLink,
  RefreshCw
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

// Priority Locations with ZIPs for Auto-Complete
const PRIORITY_LOCATIONS = [
  { town: "York", state: "PA" }, 
  { town: "Dover", state: "PA", zip: "17315" },
  { town: "Hanover", state: "PA", zip: "17331" },
  { town: "Red Lion", state: "PA", zip: "17356" },
  { town: "Lancaster", state: "PA" }, 
  { town: "Manchester", state: "PA", zip: "17345" },
  { town: "Wrightsville", state: "PA", zip: "17368" },
  { town: "Dallastown", state: "PA", zip: "17313" },
  { town: "Spring Grove", state: "PA", zip: "17362" }
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
  const [isImporting, setIsImporting] = useState(false);
  
  // Maps State
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [scriptLoadError, setScriptLoadError] = useState(false);
  
  // API Route Data
  const [optimizedPlan, setOptimizedPlan] = useState<string | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [apiMetrics, setApiMetrics] = useState<{distance: string, duration: string} | null>(null);
  
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

  // Robust Google Maps Script Loader
  const loadMapsScript = () => {
    // 1. Check if already loaded and healthy
    if ((window as any).google && (window as any).google.maps && !authError) {
      setMapsLoaded(true);
      return;
    }

    // 2. Clean up any failed/old script tags
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
       existingScript.remove();
    }

    // 3. Verify API Key Existence & Format
    const key = process.env.API_KEY;
    
    // Check for valid looking key (Starts with AIza) to prevent InvalidKeyMapError
    if (key && key !== 'undefined' && key.startsWith('AIza')) {
      setScriptLoadError(false);
      setAuthError(false);
      
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places,geometry&v=weekly`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setMapsLoaded(true);
        if (error?.includes("Google Maps SDK")) setError(null);
      };
      
      script.onerror = () => {
        console.error("Failed to load Google Maps SDK (Network Error)");
        setScriptLoadError(true);
        setError("Failed to connect to Google Maps. Please check your internet connection.");
      };
      
      document.head.appendChild(script);
    } else {
      console.warn("API Key missing or invalid format (must start with AIza)");
      // Don't set error immediately, let the UI show "Connect API Key" button
    }
  };

  // Initial Key Check & Load
  useEffect(() => {
    const checkKey = async () => {
      const aistudio = getAiStudio();
      if (aistudio) {
        const has = await aistudio.hasSelectedApiKey();
        if (has) {
          loadMapsScript();
        }
      }
    };
    
    // Register global auth failure handler
    // This fires if the key is valid format but rejected by Google (e.g. billing disabled, Maps API not enabled)
    (window as any).gm_authFailure = () => {
       console.error("Google Maps Auth Failure");
       setAuthError(true);
       setMapsLoaded(false);
    };

    checkKey();

    return () => {
      // Cleanup global handler
      (window as any).gm_authFailure = null;
    }
  }, []);

  const handleConnectKey = async () => {
    const aistudio = getAiStudio();
    if (aistudio) {
       await aistudio.openSelectKey();
       // Add short delay to ensure env is updated, then reload
       setTimeout(() => loadMapsScript(), 500);
    }
  };

  const handleRetryLoad = () => {
     setAuthError(false);
     setScriptLoadError(false);
     setMapsLoaded(false);
     loadMapsScript();
  };

  // Calculate Route Metrics (Fallback if API fails, or pre-optimization)
  const routeMetrics = useMemo(() => {
    // If we have API data, use that
    if (apiMetrics) {
      return {
        legs: [], 
        totalDistance: apiMetrics.distance,
        totalTime: apiMetrics.duration
      };
    }

    // Fallback: Straight line calculation
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
  }, [stops, apiMetrics]);

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
    setRouteCoordinates([]); // Clear API path on manual reorder
    setApiMetrics(null);
    setDraggedStopIndex(null);
  };

  // Reverse Geocode (Map Click -> Address)
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    // Strategy 1: Google Maps JS SDK Geocoder (Client-side)
    if (mapsLoaded && (window as any).google && !authError) {
      try {
        const geocoder = new (window as any).google.maps.Geocoder();
        const response = await geocoder.geocode({ location: { lat, lng } });
        if (response.results[0]) {
           return response.results[0].formatted_address.replace(', USA', '');
        }
      } catch (e) {
        console.warn("Google JS SDK reverse geocode failed", e);
      }
    }

    // Strategy 2: Nominatim Fallback
    try {
      await new Promise(r => setTimeout(r, 600));
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
         headers: { 'User-Agent': 'GodsGraceCommandCenter/1.0' }
      });
      const data = await res.json();
      
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
    // Only initialize Leaflet if Maps SDK is loaded OR we are using fallback. 
    // We defer Leaflet init until viewMode is map.
    if (viewMode === 'map' && mapContainerRef.current && !mapInstanceRef.current && mapsLoaded) {
      const L = (window as any).L;
      if (!L) return; // Wait for Leaflet to load

      const map = L.map(mapContainerRef.current).setView([39.9626, -76.7277], 11); // Default to York, PA
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
    }
  }, [viewMode, mapsLoaded]);

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
      
      setRouteCoordinates([]); // Clear optimized route if manual change occurs
      setApiMetrics(null);
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

    // 1. Draw Markers
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

        // Handle drag end to update state
        marker.on('dragend', (event: any) => {
          const newPos = event.target.getLatLng();
          setStops(prev => prev.map(s => 
            s.id === stop.id ? { ...s, lat: newPos.lat, lng: newPos.lng } : s
          ));
          setRouteCoordinates([]); // Reset API route if moved
          setApiMetrics(null);
        });

        markersRef.current.push(marker);
        validPoints.push([stop.lat, stop.lng]);
      }
    });

    // 2. Draw Polyline (Either API Route or Straight Lines)
    if (validPoints.length > 1) {
      const pathPoints = routeCoordinates.length > 0 ? routeCoordinates : validPoints;
      
      polylineRef.current = L.polyline(pathPoints, { 
        color: '#143d2b', 
        weight: 5,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: routeCoordinates.length > 0 ? null : '10, 10'
      }).addTo(map);
      
      // Smart Bounds Fitting
      if (validPoints.length !== prevStopCountRef.current || routeCoordinates.length > 0) {
         const bounds = L.latLngBounds(validPoints); // Fit to stops, not just path
         map.fitBounds(bounds, { padding: [50, 50] });
         prevStopCountRef.current = validPoints.length;
      }
    } else if (validPoints.length === 1 && prevStopCountRef.current !== 1) {
      map.setView(validPoints[0], 13);
      prevStopCountRef.current = 1;
    } else if (validPoints.length === 0) {
      prevStopCountRef.current = 0;
    }

  }, [stops, viewMode, routeCoordinates, mapsLoaded]);

  // --- GEOCODING STRATEGIES ---

  // Strategy 1: Google Maps JS SDK (Robust, Client-side)
  const geocodeWithGoogle = async (address: string): Promise<{lat: number, lng: number} | null> => {
    if (mapsLoaded && (window as any).google && !authError) {
      try {
        const geocoder = new (window as any).google.maps.Geocoder();
        const response = await geocoder.geocode({ address });
        if (response.results[0]) {
           const loc = response.results[0].geometry.location;
           return { lat: loc.lat(), lng: loc.lng() };
        }
      } catch (e) {
        console.warn("Google JS Geocoding error", e);
      }
    }
    return null;
  };

  // Strategy 2: Nominatim / OpenStreetMap (Free, Fallback)
  const geocodeWithNominatim = async (address: string): Promise<{lat: number, lng: number} | null> => {
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    try {
      let cleanAddress = address
        .replace(/^(unit|apt|suite|#)\s*[\w-]+\s*,?\s*/i, '')
        .replace(/\bMt\b\.?\s/g, 'Mount ')
        .replace(/\bRd\b\.?/gi, 'Road')
        .replace(/\bSt\b\.?/gi, 'Street')
        .trim();

      const performSearch = async (query: string, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          let controller: AbortController | null = null;
          let id: ReturnType<typeof setTimeout> | null = null;
          try {
            controller = new AbortController();
            id = setTimeout(() => controller?.abort(), 15000); 
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
            const res = await fetch(url, {
              headers: { 'User-Agent': 'GodsGraceCommandCenter/1.0' },
              signal: controller.signal
            });
            if (id) clearTimeout(id);
            if (!res.ok) {
               if (res.status === 429) { await sleep(3000 * (i + 1)); continue; }
               throw new Error(`HTTP Error ${res.status}`);
            }
            return await res.json();
          } catch (err: any) {
             if (id) clearTimeout(id);
             if (i === retries - 1) throw err;
             await sleep(1000 + (i * 1000));
          }
        }
      };

      let data = await performSearch(cleanAddress);
      
      // Fallback: If full search failed, try without zip if it looks like we sent one
      if (!data || data.length === 0) {
        if (/\d{5}/.test(cleanAddress)) {
             const noZip = cleanAddress.replace(/\s\d{5}(?:-\d{4})?$/, '');
             await sleep(1000);
             data = await performSearch(noZip);
        }
      }
      
      // Fallback: Try just street + city
      if (!data || data.length === 0) {
         const parts = cleanAddress.split(',');
         if (parts.length >= 2) {
             const cityState = parts.slice(-2).join(',').trim();
             if (cityState.length > 5) {
                await sleep(1000);
                data = await performSearch(cityState);
             }
         }
      }
      
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (e) {
      console.warn("Nominatim geocoding failed for", address, e);
      return null;
    }
    return null;
  };

  // Main Geocoding Orchestrator
  const geocodeAddress = async (address: string): Promise<{lat: number, lng: number} | null> => {
    // Try Google first if loaded
    if (mapsLoaded && !authError) {
      const googleResult = await geocodeWithGoogle(address);
      if (googleResult) return googleResult;
    }
    return await geocodeWithNominatim(address);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewAddress(val);
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
         potentialSuffixes.forEach(s => newSuggestions.push(`${base} ${s}`));
       }
    }

    // 3. Priority Town Autocomplete
    const lowerVal = val.toLowerCase();
    const hasComma = val.includes(',');
    
    // Check if input ends with a street suffix (e.g. "123 Main St")
    const endsWithSuffix = STREET_SUFFIXES.some(s => 
      lowerVal.endsWith(` ${s.toLowerCase()}`) || 
      lowerVal.endsWith(` ${s.toLowerCase()}.`)
    );

    // Suggest Priority Towns immediately after street is typed
    if ((endsWithSuffix && !hasComma) || (hasComma && val.split(',').length === 2 && !val.split(',')[1].trim())) {
      const base = hasComma ? val.split(',')[0] : val;
      PRIORITY_LOCATIONS.slice(0, 5).forEach(loc => {
          if (loc.zip) {
             newSuggestions.push(`${base}, ${loc.town}, ${loc.state} ${loc.zip}`);
          } else {
             newSuggestions.push(`${base}, ${loc.town}, ${loc.state}`);
          }
      });
    }

    // 4. Partial Town Match
    if (hasComma) {
      const parts = val.split(',');
      const cityPart = parts[parts.length - 1].trim().toLowerCase();
      
      if (cityPart.length > 0) {
        const prefix = parts.slice(0, -1).join(',').trim();
        
        // Match against Priority Locations first
        const matchedPriority = PRIORITY_LOCATIONS.filter(l => 
            l.town.toLowerCase().startsWith(cityPart)
        );
        
        matchedPriority.forEach(loc => {
            if (loc.zip) {
                newSuggestions.push(`${prefix}, ${loc.town}, ${loc.state} ${loc.zip}`);
            } else {
                newSuggestions.push(`${prefix}, ${loc.town}, ${loc.state}`);
            }
        });

        // Fill remaining slots with generic Central PA towns
        if (newSuggestions.length < 5) {
            const otherTowns = CENTRAL_PA_TOWNS.filter(t => 
                t.toLowerCase().startsWith(cityPart) && 
                !matchedPriority.some(mp => mp.town === t)
            );
            otherTowns.slice(0, 5 - newSuggestions.length).forEach(t => {
                newSuggestions.push(`${prefix}, ${t}, PA`);
            });
        }
      }
    }

    setSuggestions(Array.from(new Set(newSuggestions)).slice(0, 5));
  };

  const selectSuggestion = (suggestion: string) => {
    setNewAddress(suggestion);
    setSuggestions([]);
  };

  const validateAddressInput = (input: string) => {
    const clean = input.trim();
    if (clean.length < 5) {
      setError("Address is too short. Please enter a full street address.");
      return false;
    }
    if (!/^\d+/.test(clean)) {
      setError("Start with a street number (e.g. '123').");
      return false;
    }
    const hasSuffix = STREET_SUFFIXES.some(s => new RegExp(`\\b${s}\\.?\\b`, 'i').test(clean));
    if (!hasSuffix) {
      setError("Include a street type (St, Rd, Ave, etc).");
      return false;
    }
    // Updated validation to allow Zip Code or Town/State
    const hasTown = CENTRAL_PA_TOWNS.some(t => new RegExp(`\\b${t}\\b`, 'i').test(clean));
    const hasState = /\bPA\b/i.test(clean) || /\bPennsylvania\b/i.test(clean);
    const hasZip = /\b17\d{3}\b/.test(clean); // Basic PA zip check (17xxx)
    
    if (!hasTown && !hasState && !hasZip) {
       setError("Specify a Central PA town, 'PA', or a ZIP code.");
       return false;
    }
    return true;
  };

  const verifyAndAddAddress = async () => {
    if (!newAddress.trim()) return;
    if (!validateAddressInput(newAddress)) return;
    setError(null);
    setIsVerifying(true);
    const tempId = Date.now().toString();
    
    // Add placeholder
    const newStop: RouteStop = {
      id: tempId,
      address: newAddress,
      isGeocoding: true
    };
    
    let finalAddress = newAddress.trim();
    setStops(prev => [...prev, newStop]);
    setNewAddress('');
    setSuggestions([]);
    
    // Geocode
    const coords = await geocodeAddress(finalAddress);
    
    setStops(prev => prev.map(s => 
      s.id === tempId 
        ? { ...s, lat: coords?.lat, lng: coords?.lng, isGeocoding: false, geocodingError: !coords } 
        : s
    ));
    setRouteCoordinates([]);
    setApiMetrics(null);
    setIsVerifying(false);
  };

  const removeStop = (id: string) => {
    setStops(prev => prev.filter(s => s.id !== id));
    setRouteCoordinates([]);
    setApiMetrics(null);
  };

  const handleImportMows = async () => {
    if (isImporting) return;
    const mowJobs = jobs.filter(j => 
      ['Scheduled', 'In Progress'].includes(j.status) &&
      (j.jobType.toLowerCase().includes('mow') || 
       j.description.toLowerCase().includes('mow'))
    );
    if (mowJobs.length === 0) {
      alert("No active lawn mowing jobs found.");
      return;
    }
    setIsImporting(true);
    for (const j of mowJobs) {
      const addr = j.address.toLowerCase().includes(j.cityArea.toLowerCase()) ? j.address : `${j.address}, ${j.cityArea}, PA`;
      if (stops.find(s => s.address === addr)) continue;

      const newStop: RouteStop = {
        id: `JOB-${j.id}`,
        address: addr,
        isGeocoding: true
      };
      setStops(prev => [...prev, newStop]);

      const coords = await geocodeAddress(addr);
      
      setStops(prev => prev.map(s => 
        s.id === `JOB-${j.id}` 
          ? { ...s, lat: coords?.lat, lng: coords?.lng, isGeocoding: false, geocodingError: !coords } 
          : s
      ));
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    setRouteCoordinates([]);
    setApiMetrics(null);
    setIsImporting(false);
  };

  // --- GOOGLE ROUTES OPTIMIZATION (CLIENT-SIDE) ---
  const handleOptimize = async () => {
    if (stops.length < 2) {
      setError("Add at least 2 stops.");
      return;
    }
    
    // 1. Ensure Key
    const aistudio = getAiStudio();
    const hasKey = await aistudio?.hasSelectedApiKey();
    if (!hasKey) {
      await aistudio?.openSelectKey();
    }

    // 2. Ensure Maps Loaded
    if (!mapsLoaded) {
      loadMapsScript();
      if (authError) {
        setError("Maps API authentication failed. Please check your API key settings.");
        return;
      }
      setError("Initializing Google Maps... Please wait a moment and try again.");
      return;
    }
    
    if (!(window as any).google) {
       setError("Google Maps SDK failed to load. Please verify your API key supports Maps JavaScript API.");
       return;
    }

    setIsOptimizing(true);
    setError(null);
    setOptimizedPlan(null);
    setRouteCoordinates([]);
    
    try {
      const originStop = stops[0];
      const destinationStop = stops[stops.length - 1];
      const waypointStops = stops.slice(1, -1);
      
      if (!originStop.lat || !originStop.lng || !destinationStop.lat || !destinationStop.lng) {
        throw new Error("Missing coordinates for start or end point.");
      }
      
      const directionsService = new (window as any).google.maps.DirectionsService();
      
      // Convert internal waypoints to Google Maps API format
      const waypoints = waypointStops
        .filter(s => s.lat && s.lng)
        .map(s => ({
          location: { lat: s.lat, lng: s.lng },
          stopover: true
        }));

      const result = await directionsService.route({
        origin: { lat: originStop.lat, lng: originStop.lng },
        destination: { lat: destinationStop.lat, lng: destinationStop.lng },
        waypoints: waypoints,
        optimizeWaypoints: true,
        travelMode: (window as any).google.maps.TravelMode.DRIVING
      });

      if (result.status === 'OK' && result.routes.length > 0) {
        const route = result.routes[0];
        
        // 1. Reorder Stops based on optimized waypoint_order
        const waypointOrder = route.waypoint_order; // Array of indices mapping original waypoints array
        const reorderedWaypoints = waypointOrder.map((index: number) => waypointStops[index]);
        const newStopOrder = [originStop, ...reorderedWaypoints, destinationStop];
        
        setStops(newStopOrder);

        // 2. Extract Polyline Path for Leaflet
        // The JS SDK returns array of LatLng objects, we map to [lat, lng]
        if (route.overview_path) {
          const path = route.overview_path.map((p: any) => [p.lat(), p.lng()] as [number, number]);
          setRouteCoordinates(path);
        }

        // 3. Calculate Totals
        let totalDistMeters = 0;
        let totalDurationSeconds = 0;
        route.legs.forEach((leg: any) => {
           totalDistMeters += leg.distance.value;
           totalDurationSeconds += leg.duration.value;
        });

        const totalMiles = (totalDistMeters * 0.000621371).toFixed(1);
        const totalMinutes = Math.round(totalDurationSeconds / 60);
        
        setApiMetrics({
           distance: totalMiles,
           duration: totalMinutes.toString()
        });

        // 4. Generate Narrative
        const narrative = `Optimized Route:\nStart at ${originStop.address}.\n\n` + 
          newStopOrder.slice(1, -1).map((s, i) => `${i+1}. ${s.address}`).join('\n') +
          `\n\nEnd at ${destinationStop.address}.\nTotal Distance: ${totalMiles} mi\nTotal Time: ${Math.floor(totalMinutes/60)}h ${totalMinutes%60}m`;
        
        setOptimizedPlan(narrative);

      } else {
        throw new Error("Directions request failed: " + result.status);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('REQUEST_DENIED')) {
         setAuthError(true);
         setError("Maps API Request Denied. Please ensure 'Directions API' is enabled in Google Cloud Console.");
      } else {
         setError("Optimization failed. " + (err.message || "Verify addresses and API key."));
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
          <p className="text-slate-500 font-medium">AI logistics with Google Maps integration.</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={handleImportMows}
             disabled={isImporting}
             className="bg-[#f4c430] text-[#143d2b] px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-[#eac040] transition-colors flex items-center gap-2 disabled:opacity-50"
           >
             {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
             {isImporting ? 'Importing...' : 'Import Active Jobs'}
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
                  onClick={() => { setStops([]); setRouteCoordinates([]); setApiMetrics(null); }}
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
              ))}
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
                  
                  {/* Visual Connector for sequence */}
                  {idx < stops.length - 1 && (
                    <div className="pl-6 pb-2 -mt-1 pt-1 relative z-0">
                       <div className="border-l-2 border-dashed border-slate-300 ml-6 pl-6 py-2 flex items-center gap-3">
                          <span className="text-xs text-slate-300 font-bold">
                             {/* Hide per-leg metrics if API not run yet, to reduce clutter until solved */}
                             {routeCoordinates.length > 0 ? '' : '...'}
                          </span>
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
                disabled={isOptimizing || stops.length < 2 || !mapsLoaded}
                className="w-full bg-[#143d2b] text-white py-4 rounded-xl font-black shadow-lg shadow-[#143d2b]/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOptimizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
                {isOptimizing ? 'Optimizing Route...' : (!mapsLoaded ? 'Initialize Maps & Optimize' : 'Find Best Route (Google)')}
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
               className={`w-full h-full bg-slate-100 transition-opacity duration-300 ${(viewMode === 'map' && mapsLoaded) ? 'opacity-100' : 'opacity-0'} ${viewMode === 'map' ? 'block' : 'hidden'}`}
             ></div>

             {/* Map Not Loaded State */}
             {viewMode === 'map' && (!mapsLoaded || authError || scriptLoadError) && (
               <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10 p-6">
                 <div className="text-center max-w-sm">
                   {authError ? (
                     <>
                      <div className="bg-rose-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-rose-600" />
                      </div>
                      <h3 className="font-black text-slate-800 text-lg mb-2">Maps Authentication Failed</h3>
                      <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                        Your API key was rejected. Please ensure these APIs are enabled in your <a href="https://console.cloud.google.com/google/maps-apis/api-list" target="_blank" className="underline font-bold text-[#143d2b]">Google Cloud Console</a>:
                      </p>
                      <ul className="text-left text-xs font-medium text-slate-600 mb-6 bg-white p-4 rounded-xl border border-slate-100 space-y-2">
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Maps JavaScript API</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Directions API</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Geocoding API</li>
                        <li className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Places API (New)</li>
                      </ul>
                      <div className="flex gap-2 justify-center">
                        <button 
                          onClick={handleConnectKey}
                          className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                        >
                          <Key className="w-3 h-3" /> Update Key
                        </button>
                         <button 
                          onClick={handleRetryLoad}
                          className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                          <RefreshCw className="w-3 h-3" /> Retry
                        </button>
                      </div>
                     </>
                   ) : scriptLoadError ? (
                      <>
                        <div className="bg-rose-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                           <AlertCircle className="w-8 h-8 text-rose-600" />
                        </div>
                        <h3 className="font-black text-slate-800 text-lg mb-2">Network Error</h3>
                        <p className="text-sm text-slate-500 mb-6">Unable to load Google Maps SDK. Please check your connection.</p>
                        <button 
                          onClick={handleRetryLoad}
                          className="bg-[#143d2b] text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
                        >
                          <RefreshCw className="w-4 h-4" /> Retry Connection
                        </button>
                      </>
                   ) : (
                     <>
                       <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-8 h-8 text-amber-600" />
                      </div>
                      <h3 className="font-black text-slate-800 text-lg mb-2">Connect Google Maps</h3>
                      <p className="text-sm text-slate-500 mb-6">
                        To use the map and route optimizer, please connect a valid Google Cloud API key with Maps JavaScript API enabled.
                      </p>
                      <button 
                        onClick={handleConnectKey}
                        className="bg-[#143d2b] text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-[#143d2b]/20 hover:scale-[1.02] transition-transform flex items-center gap-2 mx-auto"
                      >
                        <Key className="w-4 h-4" /> Connect API Key
                      </button>
                     </>
                   )}
                 </div>
               </div>
             )}

             {/* Text View Overlay */}
             {viewMode === 'text' && (
                <div className="w-full h-full bg-white p-8 overflow-y-auto">
                   <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                     <Sparkles className="w-5 h-5 text-[#f4c430]" /> Optimization Report
                   </h3>
                   {optimizedPlan ? (
                     <div className="prose prose-sm prose-slate max-w-none">
                       <div className="whitespace-pre-wrap font-mono text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">{optimizedPlan}</div>
                     </div>
                   ) : (
                     <p className="text-slate-400 italic">No optimization results yet. Run the optimizer to see details.</p>
                   )}
                </div>
             )}
             
             {/* Empty State for Map (Only show if loaded and no stops) */}
             {viewMode === 'map' && mapsLoaded && stops.length === 0 && (
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
