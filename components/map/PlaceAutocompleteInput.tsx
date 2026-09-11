import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps, getEffectiveMapsKey } from './InteractiveMap';
import { MapPin } from 'lucide-react';

interface PlaceAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: { address: string; lat: number; lng: number; name?: string }) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

const DEFAULT_POPULAR_PREDICTIONS = [
  { place_id: 'lis_aeroporto', description: 'Aeroporto Humberto Delgado (LIS), Lisboa', structured_formatting: { main_text: 'Aeroporto Humberto Delgado (LIS)', secondary_text: 'Alameda das Comunidades Portuguesas, Lisboa' }, lat: 38.7756, lng: -9.1354 },
  { place_id: 'cascais_marina', description: 'Cascais Marina & Centro Histórico', structured_formatting: { main_text: 'Cascais Marina & Centro Histórico', secondary_text: 'Passeio D. Luís I, Cascais' }, lat: 38.6979, lng: -9.4215 },
  { place_id: 'sintra_vila', description: 'Sintra Vila Histórica & Palácio da Vila', structured_formatting: { main_text: 'Sintra Vila Histórica', secondary_text: 'Praça da República, Sintra' }, lat: 38.7990, lng: -9.3916 },
  { place_id: 'oriente_station', description: 'Gare do Oriente / Parque das Nações, Lisboa', structured_formatting: { main_text: 'Gare do Oriente / Parque das Nações', secondary_text: 'Av. Dom João II, Lisboa' }, lat: 38.7678, lng: -9.0991 },
  { place_id: 'marques_pombal', description: 'Marquês de Pombal / Av. da Liberdade, Lisboa', structured_formatting: { main_text: 'Marquês de Pombal / Av. Liberdade', secondary_text: 'Praça Marquês de Pombal, Lisboa' }, lat: 38.7253, lng: -9.1500 },
  { place_id: 'belem_torre', description: 'Torre de Belém / CCB, Lisboa', structured_formatting: { main_text: 'Torre de Belém / CCB', secondary_text: 'Av. Brasília, Lisboa' }, lat: 38.6916, lng: -9.2160 }
];

export const PlaceAutocompleteInput: React.FC<PlaceAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Para onde vamos hoje?',
  className = '',
  inputClassName = ''
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState<boolean>(false);
  const autocompleteServiceRef = useRef<any>(null);

  useEffect(() => {
    const apiKey = getEffectiveMapsKey();
    if (!apiKey) return;

    loadGoogleMaps(apiKey).then((googleObj) => {
      if (!inputRef.current || !googleObj?.maps?.places) return;

      try {
        autocompleteServiceRef.current = new googleObj.maps.places.AutocompleteService();
        
        const autocomplete = new googleObj.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode', 'establishment'],
          componentRestrictions: { country: 'pt' },
          fields: ['formatted_address', 'geometry', 'name']
        });

        autocomplete.addListener('place_changed', () => {
          try {
            const place = autocomplete.getPlace();
            if (place && place.geometry && place.geometry.location) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              const address = place.formatted_address || place.name || '';
              onChange(address);
              if (onPlaceSelect) {
                onPlaceSelect({
                  address,
                  lat,
                  lng,
                  name: place.name
                });
              }
            }
          } catch (err) {
            console.warn('Place selection handling notice:', err);
          }
        });

        autocompleteRef.current = autocomplete;
      } catch (err) {
        console.warn('Place autocomplete initialization notice:', err);
      }
    }).catch(() => {
      // Offline fallback mode handled seamlessly
    });
  }, [onChange, onPlaceSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    onChange(newVal);

    const win = window as any;
    if (autocompleteServiceRef.current && newVal.length > 2 && win.google?.maps?.places) {
      try {
        autocompleteServiceRef.current.getPlacePredictions(
          {
            input: newVal,
            componentRestrictions: { country: 'pt' }
          },
          (results: any[], status: string) => {
            if (status === win.google?.maps?.places?.PlacesServiceStatus?.OK && results && results.length > 0) {
              setPredictions(results);
              setShowPredictions(true);
            } else {
              // Local fallback filter
              const filtered = DEFAULT_POPULAR_PREDICTIONS.filter(p => 
                p.description.toLowerCase().includes(newVal.toLowerCase()) ||
                p.structured_formatting.main_text.toLowerCase().includes(newVal.toLowerCase())
              );
              setPredictions(filtered);
              setShowPredictions(filtered.length > 0);
            }
          }
        );
      } catch (e) {
        const filtered = DEFAULT_POPULAR_PREDICTIONS.filter(p => 
          p.description.toLowerCase().includes(newVal.toLowerCase()) ||
          p.structured_formatting.main_text.toLowerCase().includes(newVal.toLowerCase())
        );
        setPredictions(filtered);
        setShowPredictions(filtered.length > 0);
      }
    } else if (newVal.length > 1) {
      const filtered = DEFAULT_POPULAR_PREDICTIONS.filter(p => 
        p.description.toLowerCase().includes(newVal.toLowerCase()) ||
        p.structured_formatting.main_text.toLowerCase().includes(newVal.toLowerCase())
      );
      setPredictions(filtered);
      setShowPredictions(filtered.length > 0);
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  const handleSelectPrediction = (prediction: any) => {
    onChange(prediction.description);
    setShowPredictions(false);

    // If local preset item
    if (prediction.lat && prediction.lng) {
      if (onPlaceSelect) {
        onPlaceSelect({
          address: prediction.description,
          lat: prediction.lat,
          lng: prediction.lng,
          name: prediction.structured_formatting?.main_text
        });
      }
      return;
    }

    const win = window as any;
    if (win.google?.maps?.Geocoder) {
      try {
        const geocoder = new win.google.maps.Geocoder();
        geocoder.geocode({ placeId: prediction.place_id }, (results: any[], status: string) => {
          if (status === 'OK' && results && results[0]?.geometry?.location) {
            const loc = results[0].geometry.location;
            if (onPlaceSelect) {
              onPlaceSelect({
                address: prediction.description,
                lat: typeof loc.lat === 'function' ? loc.lat() : loc.lat,
                lng: typeof loc.lng === 'function' ? loc.lng() : loc.lng
              });
            }
          }
        });
      } catch (err) {
        console.warn('Geocoder error:', err);
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (predictions.length === 0 && !value) {
            setPredictions(DEFAULT_POPULAR_PREDICTIONS.slice(0, 4));
            setShowPredictions(true);
          } else if (predictions.length > 0) {
            setShowPredictions(true);
          }
        }}
        placeholder={placeholder}
        className={inputClassName || "w-full bg-transparent text-sm text-white font-bold focus:outline-none placeholder-slate-400"}
      />

      {showPredictions && predictions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto">
          {predictions.map((p) => (
            <button
              key={p.place_id}
              type="button"
              onClick={() => handleSelectPrediction(p)}
              className="w-full px-4 py-3 text-left hover:bg-slate-800 flex items-center gap-3 transition border-b border-slate-800/60 last:border-none group"
            >
              <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20">
                <MapPin className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{p.structured_formatting?.main_text || p.description}</div>
                <div className="text-[10px] text-slate-400 truncate">{p.structured_formatting?.secondary_text || ''}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaceAutocompleteInput;
