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

  const totalRides = uberRides + boltRides;
  const totalTips = uberTips + boltTips;
  const totalPlatformTolls = uberTolls + boltTolls;
  const totalGanhos = totalRides + totalTips + totalPlatformTolls;

  const slotFee = (calculation.type === CalculationType.SLOT && !calculation.isSlotExempt) ? totalGanhos * 0.04 : 0;
  const iva = !calculation.isIvaExempt ? totalGanhos * 0.06 : 0;
  const totalDeducoes = vehicleRental + slotFee + iva + fleetCard + rentalTolls + otherExpenses;

  const refundedTips = totalTips;
  const refundedTolls = calculation.type === CalculationType.SLOT ? totalPlatformTolls : 0;
  const totalDevolucoes = refundedTips + refundedTolls;
  
  const valorFinal = (totalRides + totalTips + refundedTolls) - totalDeducoes;

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