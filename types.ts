export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER', // Gerente
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

export enum AdjustmentStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
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
  
  // SaaS Multi-tenancy (Defaults to 'asfalto-cativante')
  companyId?: string;

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

  // AdTech extension
  adTechEnabled?: boolean;
  adTechAccumulatedBonus?: number;
  assignedTabletId?: string;
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
  
  // SaaS Multi-tenancy
  companyId?: string;
  matricula?: string;

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

  // AdTech bonus integration (optional extra earnings passed to driver)
  adTechBonus?: number;
}

export interface Iban {
  id: string;
  driverId: string;
  driverName: string; // The name of the driver from the users collection
  fullName: string; // The full name on the bank account
  nif: string;
  iban: string;
  companyId?: string;
}

export interface Receipt {
  id: string;
  driverId: string;
  driverName: string;
  amount: number;
  date: any; // Firestore Timestamp
  notes?: string;
  companyId?: string;
}

export interface Adjustment {
  id: string;
  driverId: string;
  driverName: string;
  amount: number; // Positive: Company owes driver.
  notes: string;
  dateCreated: any; // Firestore Timestamp
  status: AdjustmentStatus;
  resolvedInCalculationId?: string;
  companyId?: string;
}

// --- SAAS & ADTECH NEW EXTENSIONS ---

export interface Company {
  id: string;
  name: string; // Default: "Asfalto Cativante"
  tradeName?: string;
  nipc: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  plan: 'STARTER' | 'PRO_FLEET' | 'ENTERPRISE';
  tvdeLicence?: string;
  defaultSlotFeePercentage: number; // e.g. 4%
  defaultIvaRate: number; // e.g. 6%
  adTechActive: boolean;
  adTechDriverSharePercentage: number; // e.g. 30% of vehicle ad revenue to driver
  createdAt?: any;
}

export interface AdCampaign {
  id: string;
  companyId?: string;
  title: string;
  advertiser: string;
  category: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  targetUrl: string;
  qrCodeData: string;
  status: 'ACTIVE' | 'PAUSED' | 'SCHEDULED' | 'COMPLETED';
  impressions: number;
  scans: number;
  revenue: number; // € total
  cpm: number; // Revenue per 1000 views
  scanReward: number; // Revenue per scan
  startDate: any;
  endDate: any;
  description?: string;
  callToAction?: string;
  driverBonusRate: number; // percentage (e.g. 30%)
}

export interface AdDevice {
  id: string;
  companyId?: string;
  matricula: string;
  driverId?: string;
  driverName?: string;
  tabletModel: string;
  status: 'ONLINE' | 'OFFLINE' | 'STANDBY';
  batteryLevel: number;
  lastPing: any;
  totalImpressions: number;
  totalScans: number;
  earnedBonus: number; // Total bonus earned for the assigned driver
  currentCampaignId?: string;
  appVersion?: string;
}

export interface ExtratoImportRecord {
  id: string;
  provider: 'UBER' | 'BOLT' | 'PRIO' | 'GALP' | 'REPSOL' | 'VIA_VERDE';
  matricula?: string;
  driverName?: string;
  matchedDriverId?: string;
  periodStart: string;
  periodEnd: string;
  ridesGross: number;
  tips: number;
  tolls: number;
  adjustments: number;
  fuelCard: number;
  rentalTolls: number;
  status: 'PENDING' | 'IMPORTED' | 'RECONCILED';
}

export interface ContractTemplate {
  id: string;
  title: string;
  type: 'SLOT_TVDE' | 'FROTA_ALUGUER' | 'PERCENTAGEM_TVDE' | 'ADTECH_TERMS';
  description: string;
  content: string;
  lastUpdated: string;
}
