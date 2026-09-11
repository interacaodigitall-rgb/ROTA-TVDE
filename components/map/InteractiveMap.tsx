import React, { useEffect, useRef, useState } from 'react';
import { DriverLiveLocation } from '../../types';

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export interface MapMarker {
  id: string;
  position: LatLngLiteral;
  title?: string;
  subtitle?: string;
  type?: 'driver' | 'origin' | 'destination' | 'client';
  matricula?: string;
  category?: string;
  heading?: number;
  isActive?: boolean;
}

export interface InteractiveMapProps {
  center?: LatLngLiteral;
  zoom?: number;
  markers?: MapMarker[];
  drivers?: DriverLiveLocation[];
  routeOrigin?: LatLngLiteral;
  routeDestination?: LatLngLiteral;
  routeColor?: string;
  fitAllMarkers?: boolean;
  className?: string;
  interactive?: boolean;
  onMapClick?: (coords: LatLngLiteral) => void;
  onMarkerClick?: (markerId: string) => void;
  showTraffic?: boolean;
}

// Check for user-provided API key from environment ONLY
export const getEffectiveMapsKey = (): string => {
  const envKey = ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  if (envKey && !envKey.startsWith('YOUR_') && !envKey.startsWith('AIzaSyAL9ZcT5uhBTp0ydTiXA1kvM6EzMsIM33A') && envKey.length > 20) {
    return envKey;
  }
  return '';
};

// Premium Dark Theme Palette (Uber Obsidian & Neon Green/Cyan)
export const UBER_DARK_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#0B0F17" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0B0F17" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cbd5e1" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#0e1a1b" }]
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#10b981" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1E293B" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0F172A" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64748b" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#334155" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e293b" }]
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f8fafc" }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }]
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#38bdf8" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#05080E" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#334155" }]
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#05080E" }]
  }
];

// Helper to load Google Maps JS script safely
let googleMapsPromise: Promise<any> | null = null;
let googleMapsAuthFailed = false;

// Register global auth failure listener once
if (typeof window !== 'undefined') {
  const win = window as any;
  const originalGmAuthFailure = win.gm_authFailure;
  win.gm_authFailure = () => {
    googleMapsAuthFailed = true;
    googleMapsPromise = null;
    window.dispatchEvent(new CustomEvent('gmaps_auth_failed'));
    if (typeof originalGmAuthFailure === 'function') {
      try { originalGmAuthFailure(); } catch (e) { /* ignore */ }
    }
  };
}

export const loadGoogleMaps = (apiKey: string = ''): Promise<any> => {
  const win = window as any;
  if (googleMapsAuthFailed) {
    return Promise.reject(new Error('Google Maps authentication failed'));
  }

  if (win.google && win.google.maps) {
    return Promise.resolve(win.google);
  }

  const keyToUse = (apiKey || getEffectiveMapsKey()).trim();
  if (!keyToUse || keyToUse.length < 20) {
    return Promise.reject(new Error('No valid Google Maps API Key configured'));
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      if (win.google && win.google.maps) {
        resolve(win.google);
      } else {
        existingScript.addEventListener('load', () => resolve(win.google));
        existingScript.addEventListener('error', (e) => reject(e));
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(keyToUse)}&libraries=places,geometry&loading=async&callback=__initGoogleMapCallback`;
    script.async = true;
    script.defer = true;

    win.__initGoogleMapCallback = () => {
      resolve(win.google);
    };

    script.onerror = (err) => {
      googleMapsPromise = null;
      reject(err);
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  center = { lat: 38.7369, lng: -9.1426 }, // Lisbon Center
  zoom = 13,
  markers = [],
  drivers = [],
  routeOrigin,
  routeDestination,
  routeColor = '#10B981',
  fitAllMarkers = false,
  className = 'w-full h-full min-h-[300px]',
  interactive = true,
  onMapClick,
  onMarkerClick
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const polylineRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(true); // Default to vector canvas mode for zero errors

  // Animated interpolated driver positions for smooth 60fps translation
  const [animatedDrivers, setAnimatedDrivers] = useState<DriverLiveLocation[]>(drivers);
  const prevDriversRef = useRef<Map<string, { lat: number; lng: number }>>(new Map());

  // Merge external markers with live drivers
  const allMarkers: MapMarker[] = [
    ...markers,
    ...animatedDrivers.map(d => ({
      id: d.driverId,
      position: { lat: d.lat, lng: d.lng },
      title: d.driverName,
      subtitle: `${d.matricula} • ${d.vehicleModel}`,
      type: 'driver' as const,
      matricula: d.matricula,
      category: d.categoria,
      heading: d.heading || 0,
      isActive: d.isOnline
    }))
  ];

  if (routeOrigin) {
    allMarkers.push({
      id: 'origin_pickup',
      position: routeOrigin,
      title: 'Local de Recolha',
      type: 'origin'
    });
  }

  if (routeDestination) {
    allMarkers.push({
      id: 'destination_dropoff',
      position: routeDestination,
      title: 'Destino',
      type: 'destination'
    });
  }

  // Smooth interpolation effect when drivers list update
  useEffect(() => {
    let animFrame: number;
    const startTime = performance.now();
    const duration = 1200; // ms transition

    const startPositions = new Map<string, { lat: number; lng: number }>();
    drivers.forEach(d => {
      const prev = prevDriversRef.current.get(d.driverId) || { lat: d.lat, lng: d.lng };
      startPositions.set(d.driverId, prev);
    });

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      setAnimatedDrivers(
        drivers.map(d => {
          const start = startPositions.get(d.driverId) || { lat: d.lat, lng: d.lng };
          return {
            ...d,
            lat: start.lat + (d.lat - start.lat) * ease,
            lng: start.lng + (d.lng - start.lng) * ease
          };
        })
      );

      if (progress < 1) {
        animFrame = requestAnimationFrame(animate);
      } else {
        drivers.forEach(d => {
          prevDriversRef.current.set(d.driverId, { lat: d.lat, lng: d.lng });
        });
      }
    };

    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [drivers]);

  // Load Google Maps Script ONLY if user provided a valid custom key in .env
  useEffect(() => {
    const validKey = getEffectiveMapsKey();
    if (!validKey) {
      setLoadError(true);
      setIsLoaded(false);
      return;
    }

    const handleAuthFail = () => {
      setLoadError(true);
      setIsLoaded(false);
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };

    window.addEventListener('gmaps_auth_failed', handleAuthFail);

    loadGoogleMaps(validKey)
      .then(() => {
        if (!googleMapsAuthFailed) {
          setIsLoaded(true);
          setLoadError(false);
        } else {
          setLoadError(true);
        }
      })
      .catch((err) => {
        setLoadError(true);
      });

    return () => {
      window.removeEventListener('gmaps_auth_failed', handleAuthFail);
    };
  }, []);

  // Initialize Map Instance
  useEffect(() => {
    const win = window as any;
    if (!isLoaded || loadError || googleMapsAuthFailed || !mapContainerRef.current || mapInstanceRef.current || !win.google?.maps) return;

    try {
      const map = new win.google.maps.Map(mapContainerRef.current, {
        center,
        zoom,
        styles: UBER_DARK_MAP_STYLES,
        disableDefaultUI: !interactive,
        zoomControl: interactive,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        backgroundColor: '#0B0F17',
        gestureHandling: interactive ? 'greedy' : 'none'
      });

      if (onMapClick) {
        map.addListener('click', (e: any) => {
          if (e.latLng) {
            onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          }
        });
      }

      mapInstanceRef.current = map;
    } catch (e) {
      console.warn('Error initializing Google Map instance:', e);
      setLoadError(true);
    }
  }, [isLoaded, loadError, center, zoom, interactive, onMapClick]);

  // Update Center & FitBounds
  useEffect(() => {
    const win = window as any;
    const map = mapInstanceRef.current;
    if (!map || loadError || !win.google?.maps) return;

    if (fitAllMarkers && allMarkers.length > 0) {
      const bounds = new win.google.maps.LatLngBounds();
      allMarkers.forEach(m => bounds.extend(m.position));
      map.fitBounds(bounds, 40);
    } else if (center) {
      map.panTo(center);
    }
  }, [center.lat, center.lng, fitAllMarkers, allMarkers.length, loadError]);

  // Sync Markers to Google Maps Instance
  useEffect(() => {
    const win = window as any;
    const map = mapInstanceRef.current;
    if (!map || loadError || !win.google?.maps) return;

    const currentMarkerIds = new Set(allMarkers.map(m => m.id));

    // Remove old markers
    markersRef.current.forEach((marker, id) => {
      if (!currentMarkerIds.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    });

    // Create custom SVG car icon for drivers
    const carIconSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="38" height="38">
        <circle cx="24" cy="24" r="20" fill="#090D16" stroke="#10B981" stroke-width="3"/>
        <path d="M14 26 L17 17 C17.5 15.5 19 14.5 20.5 14.5 L27.5 14.5 C29 14.5 30.5 15.5 31 17 L34 26 C35 26.5 36 27.5 36 29 L36 33 C36 34 35 35 34 35 L33 35 C32 35 31 34 31 33 L31 32 L17 32 L17 33 C17 34 16 35 15 35 L14 35 C13 35 12 34 12 33 L12 29 C12 27.5 13 26.5 14 26 Z" fill="#10B981"/>
        <circle cx="18" cy="28" r="2" fill="#FFFFFF"/>
        <circle cx="30" cy="28" r="2" fill="#FFFFFF"/>
        <rect x="18" y="18" width="12" height="5" rx="1.5" fill="#090D16"/>
      </svg>
    `;

    const carIconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(carIconSvg)}`;

    // Add or update markers
    allMarkers.forEach(m => {
      let marker = markersRef.current.get(m.id);

      if (!marker) {
        let icon: any = undefined;

        if (m.type === 'driver') {
          icon = {
            url: carIconUrl,
            scaledSize: new win.google.maps.Size(38, 38),
            anchor: new win.google.maps.Point(19, 19)
          };
        }

        marker = new win.google.maps.Marker({
          position: m.position,
          map,
          title: m.title || m.matricula,
          icon,
          label: m.type === 'origin' ? { text: 'A', color: '#FFF', fontWeight: 'bold' } :
                 m.type === 'destination' ? { text: 'B', color: '#FFF', fontWeight: 'bold' } : undefined
        });

        if (onMarkerClick) {
          marker.addListener('click', () => onMarkerClick(m.id));
        }

        markersRef.current.set(m.id, marker);
      } else {
        marker.setPosition(m.position);
      }
    });
  }, [allMarkers, onMarkerClick, loadError]);

  // Render Driving Route Polyline
  useEffect(() => {
    const win = window as any;
    const map = mapInstanceRef.current;
    if (!map || loadError || !win.google?.maps) return;

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (routeOrigin && routeDestination) {
      const path = [
        new win.google.maps.LatLng(routeOrigin.lat, routeOrigin.lng),
        new win.google.maps.LatLng(
          (routeOrigin.lat + routeDestination.lat) / 2 + 0.005,
          (routeOrigin.lng + routeDestination.lng) / 2 - 0.003
        ),
        new win.google.maps.LatLng(routeDestination.lat, routeDestination.lng)
      ];

      polylineRef.current = new win.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: routeColor,
        strokeOpacity: 0.9,
        strokeWeight: 5,
        map
      });
    }
  }, [routeOrigin, routeDestination, routeColor, loadError]);

  // Fallback Vector Canvas Engine
  const renderFallbackVectorMap = () => {
    const minLat = 38.68;
    const maxLat = 38.82;
    const minLng = -9.45;
    const maxLng = -9.05;

    const toY = (lat: number) => 100 - ((lat - minLat) / (maxLat - minLat)) * 100;
    const toX = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * 100;

    return (
      <div className="relative w-full h-full bg-[#0B0F17] overflow-hidden select-none">
        {/* Subtle Map Matrix Pattern */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />
        
        {/* Vector Road Arteries */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 600" preserveAspectRatio="none">
          <defs>
            <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#10B981" stopOpacity="1" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
            </linearGradient>
            <filter id="neonFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          <path d="M 50 180 Q 300 130, 600 280 T 950 320" stroke="#1E293B" strokeWidth="8" fill="none" />
          <path d="M 50 180 Q 300 130, 600 280 T 950 320" stroke="#334155" strokeWidth="3" fill="none" />
          
          <path d="M 220 50 Q 380 320, 650 580" stroke="#1E293B" strokeWidth="7" fill="none" />
          <path d="M 220 50 Q 380 320, 650 580" stroke="#334155" strokeWidth="2.5" fill="none" />

          <path d="M 120 520 Q 420 420, 820 180" stroke="#1E293B" strokeWidth="6" fill="none" />
          
          <path d="M 0 540 Q 350 480, 700 520 T 1000 460 L 1000 600 L 0 600 Z" fill="#05080E" opacity="0.9" />

          {routeOrigin && routeDestination && (
            <path
              d={`M ${toX(routeOrigin.lng) * 10} ${toY(routeOrigin.lat) * 6} Q ${(toX(routeOrigin.lng) + toX(routeDestination.lng)) * 5} ${(toY(routeOrigin.lat) + toY(routeDestination.lat)) * 3 - 20}, ${toX(routeDestination.lng) * 10} ${toY(routeDestination.lat) * 6}`}
              stroke="url(#routeGlow)"
              strokeWidth="5"
              strokeDasharray="6,4"
              filter="url(#neonFilter)"
              fill="none"
              className="animate-pulse"
            />
          )}
        </svg>

        {/* Realtime Moving Car Markers */}
        {allMarkers.map((m) => {
          const top = toY(m.position.lat);
          const left = toX(m.position.lng);

          if (m.type === 'driver') {
            return (
              <div
                key={m.id}
                onClick={() => onMarkerClick && onMarkerClick(m.id)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out cursor-pointer z-20 group hover:z-40"
                style={{ top: `${top}%`, left: `${left}%` }}
              >
                <div className="relative">
                  <span className="absolute -inset-2 rounded-full bg-emerald-500/20 animate-ping" />
                  
                  <div className="w-10 h-10 rounded-full bg-slate-950 border-2 border-emerald-400 shadow-2xl flex items-center justify-center text-emerald-400 group-hover:scale-125 transition-transform duration-300">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-4.66l.12-.34h13.77l.11.34V17z"/>
                      <circle cx="7.5" cy="14.5" r="1.5" fill="#FFF"/>
                      <circle cx="16.5" cy="14.5" r="1.5" fill="#FFF"/>
                    </svg>
                  </div>

                  <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-slate-950/95 border border-slate-700 text-[10px] font-mono font-bold text-white shadow-xl opacity-90 group-hover:opacity-100 transition">
                    {m.matricula || m.title}
                  </div>
                </div>
              </div>
            );
          }

          if (m.type === 'origin') {
            return (
              <div
                key={m.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
                style={{ top: `${top}%`, left: `${left}%` }}
              >
                <div className="flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-blue-400 opacity-50" />
                  <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-xl flex items-center justify-center text-[10px] font-black text-white">
                    A
                  </div>
                </div>
              </div>
            );
          }

          if (m.type === 'destination') {
            return (
              <div
                key={m.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
                style={{ top: `${top}%`, left: `${left}%` }}
              >
                <div className="flex items-center justify-center">
                  <div className="px-2.5 py-1 rounded-xl bg-emerald-600 border border-emerald-400 text-white text-xs font-black shadow-2xl animate-bounce flex items-center gap-1">
                    <span>📍</span> {m.title || 'Destino'}
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    );
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      {isLoaded && !loadError ? (
        <div ref={mapContainerRef} className="w-full h-full min-h-[300px]" />
      ) : (
        renderFallbackVectorMap()
      )}
    </div>
  );
};

export default InteractiveMap;
