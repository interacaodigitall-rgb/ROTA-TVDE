import { Calculation, CalculationType } from '../types';

export const calculateSummary = (calculation: Calculation) => {
  // Use default values of 0 for any potentially missing numeric fields to prevent NaN errors
  const uberRides = calculation.uberRides || 0;
  const uberTips = calculation.uberTips || 0;
  const uberTolls = calculation.uberTolls || 0;
  const boltRides = calculation.boltRides || 0;
  const boltTips = calculation.boltTips || 0;
  const boltTolls = calculation.boltTolls || 0;
  const vehicleRental = calculation.vehicleRental || 0;
  const fleetCard = calculation.fleetCard || 0;
  const rentalTolls = calculation.rentalTolls || 0;
  const otherExpenses = calculation.otherExpenses || 0;
  const debtDeduction = calculation.debtDeduction || 0;

  const totalRides = uberRides + boltRides;
  const totalTips = uberTips + boltTips;
  const totalPlatformTolls = uberTolls + boltTolls;
  const totalGanhos = totalRides + totalTips + totalPlatformTolls;

  const slotFee = (calculation.type === CalculationType.SLOT && !calculation.isSlotExempt) ? totalGanhos * 0.04 : 0;
  const iva = !calculation.isIvaExempt ? totalGanhos * 0.06 : 0;
  
  // For FROTA drivers, platform tolls are company revenue and are deducted.
  // For SLOT drivers, they belong to the driver and are refunded, not deducted.
  const platformTollsAsDeduction = calculation.type === CalculationType.FROTA ? totalPlatformTolls : 0;

  const totalDeducoes = vehicleRental + slotFee + iva + fleetCard + rentalTolls + otherExpenses + debtDeduction + platformTollsAsDeduction;

  // Tips are always refunded to the driver.
  const refundedTips = totalTips;
  // Platform tolls are only refunded to SLOT drivers.
  const refundedTolls = calculation.type === CalculationType.SLOT ? totalPlatformTolls : 0;
  const totalDevolucoes = refundedTips + refundedTolls;
  
  // The final value is the total earnings minus total deductions.
  // This single formula works for both driver types because the deductions are handled conditionally.
  const valorFinal = totalGanhos - totalDeducoes;

  return {
    totalRides,
    totalTips,
    totalPlatformTolls,
    totalGanhos,
    slotFee,
    iva,
    totalDeducoes,
    refundedTips,
    refundedTolls,
    totalDevolucoes,
    valorFinal,
  };
};
