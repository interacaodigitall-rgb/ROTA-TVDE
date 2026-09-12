import { db } from '../firebase';
import { Establishment } from '../types';

export const INITIAL_ESTABLISHMENTS: Establishment[] = [
  {
    id: 'est_tivoli_avenida',
    name: 'Hotel Tivoli Avenida Liberdade',
    tradeName: 'Tivoli Avenida Lisboa',
    category: 'HOTEL',
    logoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&auto=format&fit=crop&q=80',
    fixedPickupAddress: 'Av. da Liberdade 185, 1269-050 Lisboa',
    fixedPickupCoords: {
      lat: 38.7212,
      lng: -9.1465
    },
    contactPhone: '+351 213 198 900',
    contactEmail: 'concierge.avenida@tivolihotels.com',
    accountManager: 'Rodrigo M. (Equipa Asfalto VIP)',
    commissionRatePercent: 10,
    billingNif: '502345678',
    billingAddress: 'Av. da Liberdade 185, Lisboa',
    status: 'ACTIVE',
    notes: 'Ponto de recolha no Pórtico Principal com Valet Parking. Serviço prioritário para transfers de aeroporto.',
    createdAt: '2026-01-10T10:00:00.000Z'
  },
  {
    id: 'est_jncquoi_avenida',
    name: 'Restaurante JNcQUOI Avenida',
    tradeName: 'JNcQUOI Lisboa',
    category: 'RESTAURANT',
    logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop&q=80',
    fixedPickupAddress: 'Av. da Liberdade 182-184, 1250-146 Lisboa',
    fixedPickupCoords: {
      lat: 38.7208,
      lng: -9.1461
    },
    contactPhone: '+351 219 369 900',
    contactEmail: 'concierge@jncquoi.pt',
    accountManager: 'Sofia Vasconcelos',
    commissionRatePercent: 10,
    billingNif: '509876543',
    billingAddress: 'Av. da Liberdade 182, Lisboa',
    status: 'ACTIVE',
    notes: 'Recolha na baía executiva em frente à entrada do restaurante. Notificar porteiro na chegada.',
    createdAt: '2026-01-15T12:00:00.000Z'
  },
  {
    id: 'est_epic_sana',
    name: 'Epic Sana Lisboa Hotel',
    tradeName: 'Epic Sana Marquês',
    category: 'HOTEL',
    logoUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=200&auto=format&fit=crop&q=80',
    fixedPickupAddress: 'Av. Eng. Duarte Pacheco 15, 1070-100 Lisboa',
    fixedPickupCoords: {
      lat: 38.7253,
      lng: -9.1578
    },
    contactPhone: '+351 211 597 300',
    contactEmail: 'concierge.lisboa@sanahotels.com',
    accountManager: 'Rodrigo M.',
    commissionRatePercent: 12,
    billingNif: '501234890',
    billingAddress: 'Av. Eng. Duarte Pacheco 15, Lisboa',
    status: 'ACTIVE',
    notes: 'Transfers para executivos e delegações de conferências no Amoreiras.',
    createdAt: '2026-02-01T09:00:00.000Z'
  },
  {
    id: 'est_the_ivens',
    name: 'The Ivens Hotel (Autograph Collection)',
    tradeName: 'The Ivens Chiado',
    category: 'HOTEL',
    logoUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=200&auto=format&fit=crop&q=80',
    fixedPickupAddress: 'R. Capelo 5, 1200-224 Lisboa (Chiado)',
    fixedPickupCoords: {
      lat: 38.7099,
      lng: -9.1415
    },
    contactPhone: '+351 210 543 400',
    contactEmail: 'frontdesk@theivenshotel.com',
    accountManager: 'Ana Paula Reis',
    commissionRatePercent: 10,
    billingNif: '514332110',
    billingAddress: 'R. Capelo 5, Lisboa',
    status: 'ACTIVE',
    notes: 'Zona de acesso condicionado no Chiado. Frota autorizada com dísticos TVDE e identificação.',
    createdAt: '2026-02-14T14:30:00.000Z'
  },
  {
    id: 'est_sublime_lisboa',
    name: 'Sublime Lisboa Hotel',
    tradeName: 'Sublime Lisboa Luxury',
    category: 'HOTEL',
    logoUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=200&auto=format&fit=crop&q=80',
    fixedPickupAddress: 'Rua Marquês de Subserra 10, 1070-012 Lisboa',
    fixedPickupCoords: {
      lat: 38.7289,
      lng: -9.1558
    },
    contactPhone: '+351 211 450 780',
    contactEmail: 'concierge@sublimelisboa.com',
    accountManager: 'Sofia Vasconcelos',
    commissionRatePercent: 10,
    billingNif: '516778990',
    billingAddress: 'Rua Marquês de Subserra 10, Lisboa',
    status: 'ACTIVE',
    notes: 'Clientela de alta fidelidade VIP. Preferência por viaturas Black Tesla e Mercedes Classe E.',
    createdAt: '2026-03-01T11:00:00.000Z'
  }
];

class EstablishmentService {
  private establishments: Establishment[] = [];
  private activeEstablishmentId: string = 'est_tivoli_avenida';

  constructor() {
    this.loadInitial();
  }

  private loadInitial() {
    try {
      const stored = localStorage.getItem('asfalto_b2b_establishments');
      if (stored) {
        this.establishments = JSON.parse(stored);
      } else {
        this.establishments = [...INITIAL_ESTABLISHMENTS];
        this.persist();
      }
    } catch (e) {
      this.establishments = [...INITIAL_ESTABLISHMENTS];
    }
  }

  private persist() {
    try {
      localStorage.setItem('asfalto_b2b_establishments', JSON.stringify(this.establishments));
    } catch (e) {}
  }

  public getAll(): Establishment[] {
    return this.establishments;
  }

  public getById(id: string): Establishment | undefined {
    return this.establishments.find(e => e.id === id);
  }

  public getActive(): Establishment {
    const found = this.establishments.find(e => e.id === this.activeEstablishmentId);
    return found || this.establishments[0] || INITIAL_ESTABLISHMENTS[0];
  }

  public setActiveId(id: string) {
    if (this.establishments.some(e => e.id === id)) {
      this.activeEstablishmentId = id;
    }
  }

  public addEstablishment(est: Omit<Establishment, 'id' | 'createdAt'>): Establishment {
    const newId = `est_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newEst: Establishment = {
      ...est,
      id: newId,
      createdAt: new Date().toISOString()
    };
    this.establishments.push(newEst);
    this.persist();

    // Try save to Firestore
    try {
      db.collection('establishments').doc(newId).set(newEst).catch(() => {});
    } catch (e) {}

    return newEst;
  }

  public updateEstablishment(id: string, updates: Partial<Establishment>): Establishment | null {
    const idx = this.establishments.findIndex(e => e.id === id);
    if (idx === -1) return null;

    this.establishments[idx] = {
      ...this.establishments[idx],
      ...updates
    };
    this.persist();

    try {
      db.collection('establishments').doc(id).set(updates, { merge: true }).catch(() => {});
    } catch (e) {}

    return this.establishments[idx];
  }
}

export const establishmentService = new EstablishmentService();
