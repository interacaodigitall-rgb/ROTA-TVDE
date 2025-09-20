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
  date: Date;
  periodStart: Date;
  periodEnd: Date;
  
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

export interface Iban {
  id: string;
  driverId: string;
  driverName: string; // The name of the driver from the users collection
  fullName: string; // The full name on the bank account
  nif: string;
  iban: string;
}