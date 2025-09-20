export enum UserRole {
  ADMIN = 'ADMIN',
  DRIVER = 'DRIVER',
}

export enum CalculationType {
  SLOT = 'SLOT',
  FROTA = 'FROTA',
}

export enum CalculationStatus {
  PENDING = 'Pendente',
  ACCEPTED = 'Aceito',
  REVISION_REQUESTED = 'Revisão Solicitada',
}

export interface User {
  id: string;
  email: string;
  password?: string;
  role: UserRole;
  name: string;
  matricula: string; 
  type: CalculationType;
}

export interface Calculation {
  id: string;
  driverId: string;
  driverName: string;
  adminId: string;
  type: CalculationType;
  status: CalculationStatus;
  date: any; // Will be a Firestore Timestamp
  periodStart: any; // Will be a Firestore Timestamp
  periodEnd: any; // Will be a Firestore Timestamp
  
  // Ganhos
  uberRides: number;
  uberTips: number;
  uberTolls: number;
  boltRides: number;
  boltTips: number;
  boltTolls: number;

  // Deduções
  vehicleRental: number;
  fleetCard: number;
  rentalTolls: number;
  otherExpenses: number;

  // Metadados
  revisionNotes?: string;
}