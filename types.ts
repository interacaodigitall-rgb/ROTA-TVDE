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
  
  // Vehicle Information
  vehicleModel?: string;
  insuranceCompany?: string;
  insurancePolicy?: string;
  fleetCardCompany?: string;
  fleetCardNumber?: string;
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
  otherExpensesNotes?: string; // Reason for other expenses
  isIvaExempt?: boolean;
  isSlotExempt?: boolean;

  // Metadados
  revisionNotes?: string;
}

export interface Iban {
  id: string;
  driverId: string;
  driverName: string; // The name of the driver from the users collection
  fullName: string; // The full name on the bank account
  nif: string;
  iban: string;
}