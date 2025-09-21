import { User, UserRole, CalculationType, Calculation, CalculationStatus, Iban } from './types';

// --- MOCK USERS ---
export const MOCK_ADMIN_USER: User = {
  id: 'demo-admin-id',
  email: 'admin@demo.com',
  role: UserRole.ADMIN,
  name: 'Admin Demo',
  matricula: 'ADM-000',
  type: CalculationType.SLOT, // N/A for admin, but good to have
};

// --- FROTA DRIVERS ---
export const MOCK_FROTA_DRIVER_BX21BD: User = {
  id: 'demo-frota-driver-bx21bd',
  email: 'frota1@demo.com',
  role: UserRole.DRIVER,
  name: 'Motorista (bx21bd)',
  matricula: 'bx21bd',
  type: CalculationType.FROTA,
  vehicleModel: 'TESLA model3 2020',
  insuranceCompany: 'fidelidade',
  insurancePolicy: '757347766',
  fleetCardCompany: 'prio',
  fleetCardNumber: '608713610737000 5',
};

export const MOCK_FROTA_DRIVER_BV80EJ: User = {
  id: 'demo-frota-driver-bv80ej',
  email: 'frota2@demo.com',
  role: UserRole.DRIVER,
  name: 'Motorista (bv80ej)',
  matricula: 'bv80ej',
  type: CalculationType.FROTA,
  vehicleModel: 'TESLA model3 2022',
  insuranceCompany: 'fidelidade',
  insurancePolicy: '757310954',
  fleetCardCompany: 'prio',
  fleetCardNumber: '608713610737000 3',
};

export const MOCK_FROTA_DRIVER_BV34EH: User = {
  id: 'demo-frota-driver-bv34eh',
  email: 'frota3@demo.com',
  role: UserRole.DRIVER,
  name: 'Motorista (bv34eh)',
  matricula: 'bv34eh',
  type: CalculationType.FROTA,
  vehicleModel: 'TESLA model3 2022',
  insuranceCompany: 'fidelidade',
  insurancePolicy: '757310960',
  fleetCardCompany: 'prio',
  fleetCardNumber: '608713610737000 4',
};

export const MOCK_FROTA_DRIVER_63ZC58: User = {
  id: 'demo-frota-driver-63zc58',
  email: 'frota4@demo.com',
  role: UserRole.DRIVER,
  name: 'Motorista (63zc58)',
  matricula: '63zc58',
  type: CalculationType.FROTA,
  vehicleModel: 'BMW-GASOLEO',
  insuranceCompany: 'fidelidade',
  insurancePolicy: '757340103',
  fleetCardCompany: 'prio',
  fleetCardNumber: '782473610737000 0',
};

export const MOCK_FROTA_DRIVER_AA75LL: User = {
  id: 'demo-frota-driver-aa75ll',
  email: 'frota5@demo.com',
  role: UserRole.DRIVER,
  name: 'Motorista (aa75ll)',
  matricula: 'aa75ll',
  type: CalculationType.FROTA,
  vehicleModel: '5008',
  insuranceCompany: 'fidelidade',
  insurancePolicy: '757355909',
  fleetCardCompany: 'prio',
  fleetCardNumber: '782473610737000 1',
};


// --- SLOT DRIVER ---
export const MOCK_SLOT_DRIVER_USER: User = {
  id: 'demo-slot-driver-id',
  email: 'slot@demo.com',
  role: UserRole.DRIVER,
  name: 'Motorista Slot (Demo)',
  matricula: 'SLO-456',
  type: CalculationType.SLOT,
  // Vehicle data is intentionally left blank for SLOT driver demo
};

export const MOCK_USERS: User[] = [
    MOCK_ADMIN_USER,
    MOCK_FROTA_DRIVER_BX21BD,
    MOCK_FROTA_DRIVER_BV80EJ,
    MOCK_FROTA_DRIVER_BV34EH,
    MOCK_FROTA_DRIVER_63ZC58,
    MOCK_FROTA_DRIVER_AA75LL,
    MOCK_SLOT_DRIVER_USER,
];

// --- MOCK IBANS ---
export const MOCK_IBANS: Iban[] = [
    {
        id: 'demo-iban-frota',
        driverId: MOCK_FROTA_DRIVER_BX21BD.id,
        driverName: MOCK_FROTA_DRIVER_BX21BD.name,
        fullName: 'Demo Frota Driver Full Name',
        nif: '999888777',
        iban: 'PT50 0000 0000 1111 2222 3333 4',
    },
    {
        id: 'demo-iban-slot',
        driverId: MOCK_SLOT_DRIVER_USER.id,
        driverName: MOCK_SLOT_DRIVER_USER.name,
        fullName: 'Demo Slot Driver Full Name',
        nif: '666555444',
        iban: 'PT50 0000 0000 4444 5555 6666 7',
    },
];

// --- MOCK CALCULATIONS ---
const today = new Date();
const lastMonday = new Date(today);
lastMonday.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1));
lastMonday.setHours(0,0,0,0);

const lastSunday = new Date(lastMonday);
lastSunday.setDate(lastMonday.getDate() + 6);
lastSunday.setHours(23,59,59,999);


const prevMonday = new Date(lastMonday);
prevMonday.setDate(lastMonday.getDate() - 7);
const prevSunday = new Date(lastSunday);
prevSunday.setDate(lastSunday.getDate() - 7);

export const MOCK_CALCULATIONS: Calculation[] = [
  // Frota Driver Calculations
  {
    id: 'demo-calc-frota-1',
    driverId: MOCK_FROTA_DRIVER_BX21BD.id,
    driverName: MOCK_FROTA_DRIVER_BX21BD.name,
    adminId: MOCK_ADMIN_USER.id,
    type: CalculationType.FROTA,
    status: CalculationStatus.PENDING,
    date: lastSunday,
    periodStart: lastMonday,
    periodEnd: lastSunday,
    uberRides: 450.50, uberTips: 25.00, uberTolls: 15.20,
    boltRides: 380.75, boltTips: 18.50, boltTolls: 10.80,
    vehicleRental: 200.00, fleetCard: 150.00, rentalTolls: 30.00, otherExpenses: 10.00,
    otherExpensesNotes: 'Lavagem da viatura',
  },
  {
    id: 'demo-calc-frota-2',
    driverId: MOCK_FROTA_DRIVER_BX21BD.id,
    driverName: MOCK_FROTA_DRIVER_BX21BD.name,
    adminId: MOCK_ADMIN_USER.id,
    type: CalculationType.FROTA,
    status: CalculationStatus.ACCEPTED,
    date: prevSunday,
    periodStart: prevMonday,
    periodEnd: prevSunday,
    uberRides: 510.00, uberTips: 30.00, uberTolls: 20.00,
    boltRides: 420.00, boltTips: 15.00, boltTolls: 12.00,
    vehicleRental: 200.00, fleetCard: 165.00, rentalTolls: 35.00, otherExpenses: 0,
  },
  // Slot Driver Calculations
  {
    id: 'demo-calc-slot-1',
    driverId: MOCK_SLOT_DRIVER_USER.id,
    driverName: MOCK_SLOT_DRIVER_USER.name,
    adminId: MOCK_ADMIN_USER.id,
    type: CalculationType.SLOT,
    status: CalculationStatus.REVISION_REQUESTED,
    date: lastSunday,
    periodStart: lastMonday,
    periodEnd: lastSunday,
    uberRides: 600.00, uberTips: 50.00, uberTolls: 30.00,
    boltRides: 550.00, boltTips: 40.00, boltTolls: 25.00,
    vehicleRental: 0, fleetCard: 80.00, rentalTolls: 0, otherExpenses: 5.00,
    otherExpensesNotes: 'Ajuste de conta',
    revisionNotes: 'Acho que os valores do cartão frota estão incorretos, o valor deveria ser menor.'
  },
  {
    id: 'demo-calc-slot-2',
    driverId: MOCK_SLOT_DRIVER_USER.id,
    driverName: MOCK_SLOT_DRIVER_USER.name,
    adminId: MOCK_ADMIN_USER.id,
    type: CalculationType.SLOT,
    status: CalculationStatus.ACCEPTED,
    date: prevSunday,
    periodStart: prevMonday,
    periodEnd: prevSunday,
    uberRides: 620.00, uberTips: 45.00, uberTolls: 28.00,
    boltRides: 580.00, boltTips: 35.00, boltTolls: 22.00,
    vehicleRental: 0, fleetCard: 75.00, rentalTolls: 0, otherExpenses: 0,
  },
];


// --- MOCK COMPANY INFO ---
export const MOCK_COMPANY_INFO = {
    name: "DEMO EMPRESA FICTÍCIA - UNIPESSOAL LDA",
    nipc: "999999999",
    address: "RUA DA SIMULAÇÃO, 123 - 1000-001 LISBOA",
    phone: "+351 999 999 999"
}
