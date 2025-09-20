
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

export const MOCK_FROTA_DRIVER_USER: User = {
  id: 'demo-frota-driver-id',
  email: 'frota@demo.com',
  role: UserRole.DRIVER,
  name: 'Motorista Frota (Demo)',
  matricula: 'FRO-123',
  type: CalculationType.FROTA,
};

export const MOCK_SLOT_DRIVER_USER: User = {
  id: 'demo-slot-driver-id',
  email: 'slot@demo.com',
  role: UserRole.DRIVER,
  name: 'Motorista Slot (Demo)',
  matricula: 'SLO-456',
  type: CalculationType.SLOT,
};

export const MOCK_USERS: User[] = [
    MOCK_ADMIN_USER,
    MOCK_FROTA_DRIVER_USER,
    MOCK_SLOT_DRIVER_USER,
];

// --- MOCK IBANS ---
export const MOCK_IBANS: Iban[] = [
    {
        id: 'demo-iban-frota',
        driverId: MOCK_FROTA_DRIVER_USER.id,
        driverName: MOCK_FROTA_DRIVER_USER.name,
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
    driverId: MOCK_FROTA_DRIVER_USER.id,
    driverName: MOCK_FROTA_DRIVER_USER.name,
    adminId: MOCK_ADMIN_USER.id,
    type: CalculationType.FROTA,
    status: CalculationStatus.PENDING,
    date: lastSunday,
    periodStart: lastMonday,
    periodEnd: lastSunday,
    uberRides: 450.50, uberTips: 25.00, uberTolls: 15.20,
    boltRides: 380.75, boltTips: 18.50, boltTolls: 10.80,
    vehicleRental: 200.00, fleetCard: 150.00, rentalTolls: 30.00, otherExpenses: 10.00,
  },
  {
    id: 'demo-calc-frota-2',
    driverId: MOCK_FROTA_DRIVER_USER.id,
    driverName: MOCK_FROTA_DRIVER_USER.name,
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
