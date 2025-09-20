import { User, Calculation, Iban, UserRole, CalculationType, CalculationStatus } from './types';

// IDs for mock users
const ADMIN_ID = 'admin-01';
const FROTA_DRIVER_ID = 'driver-frota-01';
const SLOT_DRIVER_ID = 'driver-slot-01';

export const MOCK_USERS: User[] = [
  {
    id: ADMIN_ID,
    email: 'admin@rotarapida.pt',
    password: '1234',
    role: UserRole.ADMIN,
    name: 'Administrador Demo',
    matricula: 'N/A',
    type: CalculationType.SLOT, // Not relevant for admin
  },
  {
    id: FROTA_DRIVER_ID,
    email: 'frota@rotatvde.pt',
    password: '123456',
    role: UserRole.DRIVER,
    name: 'Condutor Frota',
    matricula: 'AA-01-BB',
    type: CalculationType.FROTA,
  },
  {
    id: SLOT_DRIVER_ID,
    email: 'slot@rotatvde.pt',
    password: '123456',
    role: UserRole.DRIVER,
    name: 'Condutor Slot',
    matricula: 'CC-02-DD',
    type: CalculationType.SLOT,
  },
];

const today = new Date();
const lastWeekEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
const lastWeekStart = new Date(lastWeekEnd.getFullYear(), lastWeekEnd.getMonth(), lastWeekEnd.getDate() - 6);

const twoWeeksAgoEnd = new Date(lastWeekEnd.getFullYear(), lastWeekEnd.getMonth(), lastWeekEnd.getDate() - 7);
const twoWeeksAgoStart = new Date(twoWeeksAgoEnd.getFullYear(), twoWeeksAgoEnd.getMonth(), twoWeeksAgoEnd.getDate() - 6);


export const MOCK_CALCULATIONS: Calculation[] = [
  {
    id: 'calc-01',
    driverId: FROTA_DRIVER_ID,
    driverName: 'Condutor Frota',
    adminId: ADMIN_ID,
    type: CalculationType.FROTA,
    status: CalculationStatus.PENDING,
    date: new Date(),
    periodStart: lastWeekStart,
    periodEnd: lastWeekEnd,
    uberRides: 450.50,
    uberTips: 25.00,
    uberTolls: 15.20,
    boltRides: 380.75,
    boltTips: 18.50,
    boltTolls: 10.80,
    vehicleRental: 200.00,
    fleetCard: 150.00,
    rentalTolls: 22.50,
    otherExpenses: 10.00,
  },
  {
    id: 'calc-02',
    driverId: SLOT_DRIVER_ID,
    driverName: 'Condutor Slot',
    adminId: ADMIN_ID,
    type: CalculationType.SLOT,
    status: CalculationStatus.ACCEPTED,
    date: new Date(new Date().setDate(today.getDate() - 1)),
    periodStart: lastWeekStart,
    periodEnd: lastWeekEnd,
    uberRides: 520.00,
    uberTips: 30.00,
    uberTolls: 20.00,
    boltRides: 410.25,
    boltTips: 22.00,
    boltTolls: 15.50,
    vehicleRental: 0,
    fleetCard: 180.30,
    rentalTolls: 0,
    otherExpenses: 5.00,
  },
  {
    id: 'calc-03',
    driverId: FROTA_DRIVER_ID,
    driverName: 'Condutor Frota',
    adminId: ADMIN_ID,
    type: CalculationType.FROTA,
    status: CalculationStatus.REVISION_REQUESTED,
    revisionNotes: 'Falta o pagamento de um bónus de 50€ esta semana.',
    date: new Date(new Date().setDate(today.getDate() - 8)),
    periodStart: twoWeeksAgoStart,
    periodEnd: twoWeeksAgoEnd,
    uberRides: 480.00,
    uberTips: 20.00,
    uberTolls: 12.00,
    boltRides: 400.00,
    boltTips: 15.00,
    boltTolls: 8.00,
    vehicleRental: 200.00,
    fleetCard: 160.00,
    rentalTolls: 25.00,
    otherExpenses: 0,
  },
];

export const MOCK_IBANS: Iban[] = [
  {
    id: 'iban-01',
    driverId: FROTA_DRIVER_ID,
    driverName: 'Condutor Frota',
    fullName: 'José da Frota',
    nif: '123456789',
    iban: 'PT50000700000001234567890'
  },
  {
    id: 'iban-02',
    driverId: SLOT_DRIVER_ID,
    driverName: 'Condutor Slot',
    fullName: 'Maria do Slot',
    nif: '987654321',
    iban: 'PT50000700000009876543210'
  },
];