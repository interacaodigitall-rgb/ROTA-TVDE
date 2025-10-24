export enum UserRole {
  ADMIN = 'ADMIN',
  DRIVER = 'DRIVER',
  OWNER = 'OWNER',
}

export enum CalculationType {
  SLOT = 'SLOT',
  FROTA = 'FROTA',
  PERCENTAGE = 'PERCENTAGE',
}

export enum CalculationStatus {
  PENDING = 'Pendente',
  ACCEPTED = 'Aceito',
  REVISION_REQUESTED = 'Revisão Solicitada',
}

export enum FuelType {
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
}

export enum PercentageType {
  FIFTY_FIFTY = '50/50',
  SIXTY_FORTY = '60/40',
}


export interface User {
  id: string;
  email: string;
  password?: string;
  role: UserRole;
  status?: 'ACTIVE' | 'ARCHIVED';
  name: string;
  matricula: string; 
  type: CalculationType;
  
  // Vehicle Information
  vehicleModel?: string;
  insuranceCompany?: string;
  insurancePolicy?: string;
  fleetCardCompany?: string;
  fleetCardNumber?: string;

  // Debt Management
  outstandingDebt?: number;
  debtNotes?: string;

  // Calculation Defaults
  defaultRentalValue?: number; // For FROTA
  isIvaExempt?: boolean;
  slotType?: 'PERCENTAGE' | 'FIXED'; // For SLOT
  slotFixedValue?: number; // For SLOT
  percentageType?: PercentageType; // For PERCENTAGE
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
  uberPreviousPeriodAdjustments?: number;
  boltRides: number;
  boltTips: number;
  boltTolls: number;
  boltPreviousPeriodAdjustments?: number;

  // Deduções
  vehicleRental: number;
  fleetCard: number;
  rentalTolls: number;
  otherExpenses: number;
  debtDeduction?: number; // For outstanding debt
  otherExpensesNotes?: string; // Reason for other expenses
  isIvaExempt?: boolean;
  isSlotExempt?: boolean;

  // Metadados
  revisionNotes?: string;
  percentageType?: PercentageType;
  fuelType?: FuelType;
}

export interface Iban {
  id: string;
  driverId: string;
  driverName: string; // The name of the driver from the users collection
  fullName: string; // The full name on the bank account
  nif: string;
  iban: string;
}