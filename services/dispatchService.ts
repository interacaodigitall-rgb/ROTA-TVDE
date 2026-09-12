import { db, firestore } from '../firebase';
import { 
  PrivateRide, 
  FleetFareRules, 
  DriverLiveLocation, 
  VehicleCategory, 
  RideStatus, 
  PaymentMethod 
} from '../types';

export const DEFAULT_FARE_RULES: FleetFareRules = {
  baseStandard: 2.50,
  kmStandard: 0.95,
  minStandard: 0.20,
  minimoStandard: 5.00,
  multBlackTesla: 1.50,
  multXL: 1.85,
  taxaAeroporto: 3.50,
  taxaNoturnaPercent: 20,
  comissaoFrotaPercent: 15
};

export interface AirportFixedFareMatch {
  isAirportFixedFare: boolean;
  zoneKey?: 'LISBOA_CENTRO' | 'OEIRAS_CAPARICA' | 'CASCAIS_SINTRA' | 'MONTIJO_VFXIRA';
  zoneLabel?: string;
  isNight: boolean;
  fixedFares?: Record<VehicleCategory, { valorTotal: number; valorLiquido: number; comissao: number }>;
}

/**
 * Regra de Exceção Aeroporto (LIS):
 * Tabela de Preço Fixo quando a viagem tem origem no Aeroporto Humberto Delgado (LIS)
 */
export function detectAirportFixedFare(
  originText: string,
  destinationText: string,
  forceNight?: boolean
): AirportFixedFareMatch {
  const normOrigin = (originText || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const normDest = (destinationText || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const isAirportOrigin = normOrigin.includes('aeroporto') || 
                          normOrigin.includes('humberto delgado') || 
                          normOrigin.includes('lisbon airport') || 
                          normOrigin.includes('terminal 1') || 
                          normOrigin.includes('terminal 2') ||
                          normOrigin.includes('portela');

  if (!isAirportOrigin) {
    return { isAirportFixedFare: false, isNight: false };
  }

  const currentHour = new Date().getHours();
  const isNight = forceNight !== undefined ? forceNight : (currentHour >= 21 || currentHour < 6);

  // 1. Aeroporto ➔ Lisboa Centro: €16-€19 (Diurno) | €20-€23 (Noturno)
  const isLisboaCentro = normDest.includes('lisboa') || normDest.includes('centro') || 
                        normDest.includes('baixa') || normDest.includes('chiado') || 
                        normDest.includes('marques') || normDest.includes('saldanha') || 
                        normDest.includes('alfama') || normDest.includes('rossio') || 
                        normDest.includes('oriente') || normDest.includes('nacoes') || 
                        normDest.includes('alvalade') || normDest.includes('campo') ||
                        normDest.includes('benfica') || normDest.includes('estrela');

  // 2. Aeroporto ➔ Oeiras / Caparica: €32,00 (Standard) / €42,00 (XL)
  const isOeirasCaparica = normDest.includes('oeiras') || normDest.includes('caparica') || 
                           normDest.includes('almada') || normDest.includes('carcavelos') || 
                           normDest.includes('paco de arcos') || normDest.includes('cacilhas') ||
                           normDest.includes('pragal') || normDest.includes('charneca');

  // 3. Aeroporto ➔ Cascais / Sintra: €48,00 (Standard) / €60,00 (XL)
  const isCascaisSintra = normDest.includes('cascais') || normDest.includes('sintra') || 
                          normDest.includes('estoril') || normDest.includes('queluz') || 
                          normDest.includes('cacem') || normDest.includes('guincho') ||
                          normDest.includes('rio de mouro') || normDest.includes('beloura');

  // 4. Aeroporto ➔ Montijo / VFXira: €44,00 (Standard) / €55,00 (XL)
  const isMontijoVfxira = normDest.includes('montijo') || normDest.includes('vila franca') || 
                          normDest.includes('vfxira') || normDest.includes('alverca') || 
                          normDest.includes('barreiro') || normDest.includes('moita') || 
                          normDest.includes('alcochete') || normDest.includes('santa iria');

  let zoneKey: 'LISBOA_CENTRO' | 'OEIRAS_CAPARICA' | 'CASCAIS_SINTRA' | 'MONTIJO_VFXIRA' = 'LISBOA_CENTRO';
  let zoneLabel = 'Lisboa Centro';

  if (isCascaisSintra) {
    zoneKey = 'CASCAIS_SINTRA';
    zoneLabel = 'Cascais / Sintra';
  } else if (isOeirasCaparica) {
    zoneKey = 'OEIRAS_CAPARICA';
    zoneLabel = 'Oeiras / Caparica';
  } else if (isMontijoVfxira) {
    zoneKey = 'MONTIJO_VFXIRA';
    zoneLabel = 'Montijo / VFXira';
  } else {
    zoneKey = 'LISBOA_CENTRO';
    zoneLabel = 'Lisboa Centro';
  }

  // Exact Official Tariff Table
  let stdPrice = 18.00;
  let xlPrice = 28.00;

  if (zoneKey === 'LISBOA_CENTRO') {
    stdPrice = isNight ? 22.00 : 18.00; // €16,00 - €19,00 (Diurno) | €20,00 - €23,00 (Noturno 21h-06h)
    xlPrice = isNight ? 32.00 : 26.00;
  } else if (zoneKey === 'OEIRAS_CAPARICA') {
    stdPrice = 32.00;
    xlPrice = 42.00;
  } else if (zoneKey === 'CASCAIS_SINTRA') {
    stdPrice = 48.00;
    xlPrice = 60.00;
  } else if (zoneKey === 'MONTIJO_VFXIRA') {
    stdPrice = 44.00;
    xlPrice = 55.00;
  }

  const buildCategory = (valorTotal: number) => {
    const comissao = Math.round((valorTotal * 0.15) * 100) / 100;
    const valorLiquido = Math.round((valorTotal - comissao) * 100) / 100;
    return { valorTotal, valorLiquido, comissao };
  };

  const fixedFares: Record<VehicleCategory, { valorTotal: number; valorLiquido: number; comissao: number }> = {
    STANDARD: buildCategory(stdPrice),
    ELECTRIC: buildCategory(Math.round((stdPrice * 1.15) * 100) / 100),
    BLACK_TESLA: buildCategory(Math.round((stdPrice * 1.35) * 100) / 100),
    XL_VAN: buildCategory(xlPrice),
    PRIORIDADE: buildCategory(Math.round((stdPrice * 1.40) * 100) / 100)
  };

  return {
    isAirportFixedFare: true,
    zoneKey,
    zoneLabel,
    isNight,
    fixedFares
  };
}

// Initial simulated fleet locations around Lisbon/Porto for rich interactive experience
export const INITIAL_DEMO_DRIVERS: DriverLiveLocation[] = [
  {
    driverId: 'drv-joao-silva',
    driverName: 'João Silva',
    matricula: '45-TX-90',
    vehicleModel: 'Peugeot 5008 Allure (7L)',
    categoria: 'XL_VAN',
    lat: 38.7485,
    lng: -9.1450,
    heading: 45,
    isOnline: true,
    status: 'LIVRE',
    lastUpdate: new Date(),
    phone: '+351 912 345 678',
    rating: 4.95,
    batteryLevel: 92
  },
  {
    driverId: 'drv-carlos-mendes',
    driverName: 'Carlos Mendes',
    matricula: '82-QA-14',
    vehicleModel: 'Tesla Model 3 Long Range',
    categoria: 'BLACK_TESLA',
    lat: 38.7690,
    lng: -9.1290,
    heading: 180,
    isOnline: true,
    status: 'LIVRE',
    lastUpdate: new Date(),
    phone: '+351 923 456 789',
    rating: 4.98,
    batteryLevel: 78
  },
  {
    driverId: 'drv-antonio-pinto',
    driverName: 'António Pinto',
    matricula: '19-ZZ-03',
    vehicleModel: 'Toyota Corolla Touring Sports',
    categoria: 'STANDARD',
    lat: 38.7180,
    lng: -9.1390,
    heading: 270,
    isOnline: true,
    status: 'LIVRE',
    lastUpdate: new Date(),
    phone: '+351 934 567 890',
    rating: 4.88,
    batteryLevel: 85
  },
  {
    driverId: 'drv-manuel-santos',
    driverName: 'Manuel Santos',
    matricula: '61-MR-77',
    vehicleModel: 'Tesla Model Y Performance',
    categoria: 'BLACK_TESLA',
    lat: 38.7075,
    lng: -9.1365,
    heading: 90,
    isOnline: true,
    status: 'LIVRE',
    lastUpdate: new Date(),
    phone: '+351 965 678 901',
    rating: 4.92,
    batteryLevel: 64
  }
];

// Sound generator using Web Audio API for high-priority dispatch alerts
export const playDispatchAlertSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Play distinctive double-beep Uber Driver style tone
    const now = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, now + 0.22); // D6
    gain2.gain.setValueAtTime(0.35, now + 0.22);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.22);
    osc2.stop(now + 0.5);
  } catch (err) {
    console.warn('Audio alert error:', err);
  }
};

class DispatchService {
  private fareRules: FleetFareRules = DEFAULT_FARE_RULES;
  private localRides: PrivateRide[] = [];
  private localDrivers: DriverLiveLocation[] = [...INITIAL_DEMO_DRIVERS];

  constructor() {
    this.loadPersistedData();
  }

  private loadPersistedData() {
    try {
      const savedRules = localStorage.getItem('asfalto_fare_rules');
      if (savedRules) {
        this.fareRules = { ...DEFAULT_FARE_RULES, ...JSON.parse(savedRules) };
      }
      const savedRides = localStorage.getItem('asfalto_private_rides');
      if (savedRides) {
        this.localRides = JSON.parse(savedRides);
      }
    } catch (e) {
      console.warn('Error loading dispatch local data', e);
    }
  }

  public getFareRules(): FleetFareRules {
    return this.fareRules;
  }

  public saveFareRules(rules: FleetFareRules) {
    this.fareRules = rules;
    try {
      localStorage.setItem('asfalto_fare_rules', JSON.stringify(rules));
      db.collection('companies').doc('asfalto_cativante').set({
        regrasTarifarias: rules
      }, { merge: true }).catch(() => {});
    } catch (e) {
      console.warn('Error saving rules to Firestore', e);
    }
  }

  /**
   * Calculate estimate for all categories based on Distance (km), Duration (minutes)
   * or Fixed Airport Rules (Geofencing Humberto Delgado LIS).
   */
  public calculateEstimates(
    distanciaKm: number, 
    duracaoMin: number, 
    isAirportOrOrigin: boolean | string = false, 
    isNightOrDestination: boolean | string = false
  ): Record<VehicleCategory, { valorTotal: number; valorLiquido: number; comissao: number }> & {
    isFixedAirportRate?: boolean;
    airportZoneLabel?: string;
    isNightRate?: boolean;
  } {
    // Check if called with origin and destination strings
    const originStr = typeof isAirportOrOrigin === 'string' ? isAirportOrOrigin : '';
    const destStr = typeof isNightOrDestination === 'string' ? isNightOrDestination : '';

    const isExplicitAirport = typeof isAirportOrOrigin === 'boolean' && isAirportOrOrigin;
    const isExplicitNight = typeof isNightOrDestination === 'boolean' && isNightOrDestination;

    // Check Airport Geofence Fixed Rate
    const airportCheck = detectAirportFixedFare(
      originStr || (isExplicitAirport ? 'Aeroporto Humberto Delgado LIS' : ''),
      destStr || 'Lisboa Centro',
      typeof isNightOrDestination === 'boolean' ? isNightOrDestination : undefined
    );

    if (airportCheck.isAirportFixedFare && airportCheck.fixedFares) {
      return {
        ...airportCheck.fixedFares,
        isFixedAirportRate: true,
        airportZoneLabel: airportCheck.zoneLabel,
        isNightRate: airportCheck.isNight
      };
    }

    const rules = this.fareRules;
    const isAirport = isExplicitAirport || originStr.toLowerCase().includes('aeroporto') || destStr.toLowerCase().includes('aeroporto');
    const isNight = isExplicitNight || (new Date().getHours() >= 21 || new Date().getHours() < 6);

    const baseFare = (multiplier: number) => {
      let valor = (rules.baseStandard + (distanciaKm * rules.kmStandard) + (duracaoMin * rules.minStandard)) * multiplier;
      if (isAirport) {
        valor += rules.taxaAeroporto;
      }
      if (isNight) {
        valor += (valor * (rules.taxaNoturnaPercent / 100));
      }
      const minValor = rules.minimoStandard * multiplier;
      const total = Math.max(valor, minValor);
      const roundedTotal = Math.round(total * 100) / 100;
      const comissao = Math.round((roundedTotal * (rules.comissaoFrotaPercent / 100)) * 100) / 100;
      const valorLiquido = Math.round((roundedTotal - comissao) * 100) / 100;

      return { valorTotal: roundedTotal, valorLiquido, comissao };
    };

    return {
      STANDARD: baseFare(1.0),
      ELECTRIC: baseFare(1.18),
      BLACK_TESLA: baseFare(rules.multBlackTesla),
      XL_VAN: baseFare(rules.multXL),
      PRIORIDADE: baseFare(rules.multBlackTesla * 1.06),
      isFixedAirportRate: false,
      isNightRate: isNight
    };
  }

  /**
   * Create a new private ride request
   */
  public async createRide(rideData: Omit<PrivateRide, 'id' | 'createdAt' | 'status' | 'statusPagamento'>): Promise<PrivateRide> {
    const newId = `ride_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newRide: PrivateRide = {
      ...rideData,
      id: newId,
      status: 'pendente',
      statusPagamento: rideData.metodoPagamento === 'CASH' || rideData.metodoPagamento === 'TPA' ? 'pendente' : 'pago',
      createdAt: new Date().toISOString(),
      etaMinutos: Math.ceil(rideData.duracaoMin / 2) || 4,
      chatMensagens: [
        {
          id: 'msg_welcome',
          sender: 'system',
          text: 'Chamado privado recebido. A procurar a viatura Asfalto Cativante mais próxima...',
          time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    this.localRides.unshift(newRide);
    this.persistLocalRides();

    // Try save to Firestore
    try {
      await db.collection('corridas_privadas').doc(newId).set(newRide);
    } catch (e) {
      console.warn('Firestore fallback to local state for ride creation:', e);
    }

    return newRide;
  }

  /**
   * Listen to active rides for client
   */
  public subscribeToRide(rideId: string, callback: (ride: PrivateRide | null) => void) {
    // Check local state first
    const foundLocal = this.localRides.find(r => r.id === rideId);
    if (foundLocal) callback(foundLocal);

    try {
      const unsubscribe = db.collection('corridas_privadas').doc(rideId).onSnapshot((doc) => {
        if (doc.exists) {
          const ride = doc.data() as PrivateRide;
          this.updateLocalRide(ride);
          callback(ride);
        } else {
          const current = this.localRides.find(r => r.id === rideId);
          callback(current || null);
        }
      }, () => {
        const current = this.localRides.find(r => r.id === rideId);
        callback(current || null);
      });
      return unsubscribe;
    } catch (e) {
      const interval = setInterval(() => {
        const current = this.localRides.find(r => r.id === rideId);
        callback(current || null);
      }, 1500);
      return () => clearInterval(interval);
    }
  }

  /**
   * Listen to pending and assigned rides for driver
   */
  public subscribeToDriverRides(driverId: string, callback: (rides: PrivateRide[]) => void) {
    const filterRides = () => {
      return this.localRides.filter(r => 
        (r.status === 'pendente' && (!r.motoristaId || r.motoristaId === driverId)) || 
        (r.motoristaId === driverId && r.status !== 'concluido' && r.status !== 'cancelado')
      );
    };

    callback(filterRides());

    try {
      const unsubscribe = db.collection('corridas_privadas')
        .onSnapshot((snapshot) => {
          const firestoreRides: PrivateRide[] = [];
          snapshot.forEach(doc => firestoreRides.push(doc.data() as PrivateRide));
          if (firestoreRides.length > 0) {
            this.localRides = firestoreRides;
            this.persistLocalRides();
          }
          callback(filterRides());
        }, () => {
          callback(filterRides());
        });
      return unsubscribe;
    } catch (e) {
      const interval = setInterval(() => {
        callback(filterRides());
      }, 2000);
      return () => clearInterval(interval);
    }
  }

  /**
   * Driver accepts ride
   */
  public async acceptRide(rideId: string, driver: { id: string; name: string; phone?: string; matricula: string; vehicleModel?: string; rating?: number; photo?: string }) {
    const updates: Partial<PrivateRide> = {
      status: 'aceito',
      motoristaId: driver.id,
      motoristaNome: driver.name,
      motoristaTelefone: driver.phone || '+351 912 345 678',
      viaturaMatricula: driver.matricula,
      viaturaModelo: driver.vehicleModel || 'Viatura Executiva Asfalto',
      motoristaRating: driver.rating || 4.95,
      motoristaFoto: driver.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      acceptedAt: new Date().toISOString(),
      etaMinutos: 4
    };

    this.updateRideStatusInLocalAndDb(rideId, updates);
  }

  /**
   * Update ride status step by step (aceito -> a_caminho -> no_local -> em_viagem -> concluido)
   */
  public async advanceRideStatus(rideId: string, newStatus: RideStatus) {
    const updates: Partial<PrivateRide> = {
      status: newStatus
    };

    if (newStatus === 'no_local') {
      updates.etaMinutos = 0;
    } else if (newStatus === 'concluido') {
      updates.completedAt = new Date().toISOString();
      updates.statusPagamento = 'pago';
    }

    this.updateRideStatusInLocalAndDb(rideId, updates);
  }

  /**
   * Send chat message
   */
  public async sendChatMessage(rideId: string, sender: 'client' | 'driver', text: string) {
    const ride = this.localRides.find(r => r.id === rideId);
    if (!ride) return;

    const newMessage = {
      id: `msg_${Date.now()}`,
      sender,
      text,
      time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...(ride.chatMensagens || []), newMessage];
    this.updateRideStatusInLocalAndDb(rideId, { chatMensagens: updatedMessages });
  }

  /**
   * Update driver GPS and status
   */
  public updateDriverLocation(driverLocation: DriverLiveLocation) {
    const idx = this.localDrivers.findIndex(d => d.driverId === driverLocation.driverId);
    if (idx >= 0) {
      this.localDrivers[idx] = { ...this.localDrivers[idx], ...driverLocation, lastUpdate: new Date() };
    } else {
      this.localDrivers.push({ ...driverLocation, lastUpdate: new Date() });
    }

    try {
      db.collection('driver_locations').doc(driverLocation.driverId).set({
        ...driverLocation,
        lastUpdate: firestore.FieldValue?.serverTimestamp ? firestore.FieldValue.serverTimestamp() : new Date()
      }, { merge: true }).catch(() => {});
    } catch (e) {}
  }

  public getLiveDrivers(): DriverLiveLocation[] {
    return this.localDrivers;
  }

  public getAllRides(): PrivateRide[] {
    return this.localRides;
  }

  /**
   * Get all completed private rides for a specific driver within an optional date range
   */
  public getDriverCompletedRides(driverId: string, startDate?: Date, endDate?: Date): PrivateRide[] {
    return this.localRides.filter(r => {
      if (r.motoristaId !== driverId || r.status !== 'concluido') return false;
      if (!startDate && !endDate) return true;
      const rideDate = new Date(r.createdAt);
      if (startDate && rideDate < startDate) return false;
      if (endDate && rideDate > endDate) return false;
      return true;
    });
  }

  /**
   * Get net total earnings of completed private rides for a driver
   */
  public getDriverCompletedRidesNetTotal(driverId: string, startDate?: Date, endDate?: Date): number {
    const rides = this.getDriverCompletedRides(driverId, startDate, endDate);
    const total = rides.reduce((sum, r) => sum + (r.valorLiquidoMotorista || 0), 0);
    return Math.round(total * 100) / 100;
  }

  private updateRideStatusInLocalAndDb(rideId: string, updates: Partial<PrivateRide>) {
    const idx = this.localRides.findIndex(r => r.id === rideId);
    if (idx >= 0) {
      this.localRides[idx] = { ...this.localRides[idx], ...updates };
      this.persistLocalRides();
    }

    try {
      db.collection('corridas_privadas').doc(rideId).set(updates, { merge: true }).catch(() => {});
    } catch (e) {
      console.warn('Firestore update error', e);
    }
  }

  private updateLocalRide(ride: PrivateRide) {
    const idx = this.localRides.findIndex(r => r.id === ride.id);
    if (idx >= 0) {
      this.localRides[idx] = ride;
    } else {
      this.localRides.unshift(ride);
    }
    this.persistLocalRides();
  }

  private persistLocalRides() {
    try {
      localStorage.setItem('asfalto_private_rides', JSON.stringify(this.localRides));
    } catch (e) {}
  }
}

export const dispatchService = new DispatchService();
