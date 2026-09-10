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

  // Gestão Fiscal & IVA (Portugal / Finanças)
  ivaLiquidado?: number;
  ivaDedutivel?: number;
  saldoIvaSemana?: number;
  anoFiscal?: number;
  trimestre?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
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

export interface CompanyIntegrations {
  uberClientId?: string;
  uberClientSecret?: string;
  uberFleetPartnerId?: string;
  boltApiKey?: string;
  boltFleetCompanyId?: string;
  uberConnected?: boolean;
  boltConnected?: boolean;
  lastTestedAt?: string;
}

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
  masterTabletCode?: string; // e.g. "ASFALTO2026"
  integrations?: CompanyIntegrations;
  createdAt?: any;
}

export interface TabletDevice {
  id: string; // e.g. "tablet_AA-00-AA"
  companyId: string;
  matricula: string;
  viaturaId?: string;
  motoristaAtualId?: string; // Sincronizado dinamicamente via Firestore
  motoristaAtualNome?: string;
  motoristaFoto?: string;
  pinCode?: string;
  status: 'online' | 'offline' | 'standby';
  impressoesTotais: number;
  scansQR: number;
  lastPing: any;
  tabletModel?: string;
  batteryLevel?: number;
  appVersion?: string;
  remoteCommand?: 'RELOAD' | 'RESET' | null;
  remoteCommandTimestamp?: any;
  earnedBonus?: number;
}

export interface TabletPendingPairing {
  pin: string; // 6 digits, e.g. "482-910"
  status: 'WAITING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  matricula?: string;
  viaturaId?: string;
  companyId?: string;
  tabletId?: string;
  driverId?: string;
  driverName?: string;
  createdAt: any;
  expiresAt: any;
  tabletModel?: string;
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

// --- MÓDULO DE GESTÃO DE IVA & REEMBOLSO ANUAL (FINANÇAS PT) ---

export type FiscalQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface FiscalSettings {
  taxaIvaPassageiros: number; // 0.06 (6%)
  taxaNormalIva: number; // 0.23 (23%)
  quotaDeducaoDiesel: number; // 0.50 (50% nos termos do CIVA art. 21)
  quotaDeducaoEletrico: number; // 1.00 (100%)
  quotaDeducaoPortagens: number; // 1.00 (100% do IVA 23%)
  quotaDeducaoAluguer: number; // 1.00 (100% do IVA 23%)
  quotaDeducaoManutencao: number; // 1.00 (100% do IVA 23%)
}

export interface WeeklyIvaRecord {
  calculationId: string;
  driverId: string;
  driverName: string;
  matricula?: string;
  periodStart: any;
  periodEnd: any;
  anoFiscal: number;
  trimestre: FiscalQuarter;
  
  // Ganhos e IVA Liquidado (Débito)
  faturacaoBruta: number; // Uber + Bolt
  taxaIvaLiquidado: number; // 6%
  ivaLiquidado: number;
  
  // Despesas elegíveis e IVA Dedutível (Crédito)
  combustivelTotal: number;
  combustivelIvaDedutivel: number;
  portagensTotal: number;
  portagensIvaDedutivel: number;
  aluguerTotal: number;
  aluguerIvaDedutivel: number;
  outrasDespesasTotal: number;
  outrasDespesasIvaDedutivel: number;
  totalIvaDedutivel: number;
  
  // Saldo da Semana: Liquidado - Dedutível
  saldoIvaSemana: number; // Positivo: A pagar; Negativo: A recuperar
  statusSemana: 'A_RECUPERAR' | 'A_PAGAR' | 'EQUILIBRADO';
}

export interface QuarterlyIvaSummary {
  trimestre: FiscalQuarter;
  anoFiscal: number;
  label: string; // ex: "1º Trimestre (Jan - Mar)"
  dataLimiteEntrega: string; // ex: "15 de Maio"
  ivaLiquidado: number;
  ivaDedutivel: number;
  saldoIva: number; // Liquidado - Dedutivel
  status: 'REEMBOLSO' | 'PAGAMENTO' | 'EQUILIBRADO';
  totalFaturacao: number;
  totalDespesas: number;
  numCalculos: number;
  semanas: WeeklyIvaRecord[];
}

export interface AnnualIvaSummary {
  anoFiscal: number;
  totalCalculos: number;
  totalFaturacaoBruta: number;
  totalDespesasOperacionais: number;
  
  // Totais IVA
  ivaLiquidadoTotal: number;
  ivaDedutivelTotal: number;
  saldoIvaAnual: number; // Liquidado - Dedutivel
  
  // Classificação
  isReembolso: boolean; // true se saldoIvaAnual < 0
  reembolsoEstimado: number; // abs(saldo) se isReembolso
  aPagarEstimado: number; // saldo se !isReembolso
  
  // Discriminação do IVA Dedutível
  combustivelIvaTotal: number;
  portagensIvaTotal: number;
  aluguerIvaTotal: number;
  outrasDespesasIvaTotal: number;
  
  // Trimestres
  trimestres: Record<FiscalQuarter, QuarterlyIvaSummary>;
}

