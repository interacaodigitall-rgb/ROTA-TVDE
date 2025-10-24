import { Calculation, CalculationType, FuelType, PercentageType } from '../types';

export const calculateSummary = (calculation: Calculation): any => {
  // Use default values of 0 for any potentially missing numeric fields to prevent NaN errors
  const uberRides = calculation.uberRides || 0;
  const uberTips = calculation.uberTips || 0;
  const uberTolls = calculation.uberTolls || 0;
  const uberPreviousPeriodAdjustments = calculation.uberPreviousPeriodAdjustments || 0;
  const boltRides = calculation.boltRides || 0;
  const boltTips = calculation.boltTips || 0;
  const boltTolls = calculation.boltTolls || 0;
  const boltPreviousPeriodAdjustments = calculation.boltPreviousPeriodAdjustments || 0;
  const vehicleRental = calculation.vehicleRental || 0;
  const fleetCard = calculation.fleetCard || 0;
  const rentalTolls = calculation.rentalTolls || 0;
  const otherExpenses = calculation.otherExpenses || 0;
  const debtDeduction = calculation.debtDeduction || 0;

  // --- CORE LOGIC REFACTORED BASED ON USER FEEDBACK ---
  // "uberRides" and "boltRides" are the GROSS earnings from platforms.
  const totalGrossEarnings = uberRides + boltRides;

  // The other fields are breakdowns of the gross amount.
  const totalTips = uberTips + boltTips;
  const totalPlatformTolls = uberTolls + boltTolls;
  const totalAdjustments = uberPreviousPeriodAdjustments + boltPreviousPeriodAdjustments;

  // --- VAT (IVA) Calculation ---
  // As per user screenshot and clarification, IVA is calculated on the total gross earnings from platforms for all types.
  const iva = !calculation.isIvaExempt ? totalGrossEarnings * 0.06 : 0;

  // --- PERCENTAGE LOGIC ---
  if (calculation.type === CalculationType.PERCENTAGE) {
    // The amount to be split is the gross earnings minus non-splittable items (tips and tolls).
    const baseEarnings = totalGrossEarnings - totalTips - totalPlatformTolls;
    
    // Tips are a direct pass-through to the driver.
    const refundedTips = totalTips;
    // Tolls are a company revenue/pass-through, not refunded to the driver.
    const refundedTolls = 0;

    const isDiesel = calculation.fuelType === FuelType.DIESEL;
    const isElectric = calculation.fuelType === FuelType.ELECTRIC;
    
    if (calculation.percentageType === PercentageType.FIFTY_FIFTY) {
        let potToSplit = baseEarnings;
        potToSplit -= iva;

        const fleetCardLimit = isDiesel ? 120 : (isElectric ? 70 : 0);
        const fleetCardCostToSplit = Math.min(fleetCard, fleetCardLimit);
        const fleetCardExcessForDriver = Math.max(0, fleetCard - fleetCardLimit);
        
        potToSplit -= fleetCardCostToSplit;

        const driverShare = potToSplit * 0.5;
        const driverSpecificCosts = fleetCardExcessForDriver + rentalTolls + otherExpenses + debtDeduction;
        const valorFinal = driverShare + refundedTips - driverSpecificCosts;

        return {
            isPercentage: true,
            percentageType: calculation.percentageType,
            baseEarnings,
            refundedTips,
            refundedTolls,
            totalPlatformTolls,
            iva,
            potToSplit,
            driverShare,
            fleetCardCostToSplit,
            driverCosts: driverSpecificCosts,
            valorFinal,
        };
    }

    if (calculation.percentageType === PercentageType.SIXTY_FORTY) {
        let companyAssumesFleetCard = 0;
        let driverExcessFleetCard = 0;

        if (isDiesel) {
            companyAssumesFleetCard = Math.min(fleetCard, 120);
            driverExcessFleetCard = Math.max(0, fleetCard - 120);
        } else if (isElectric) {
            companyAssumesFleetCard = Math.min(fleetCard, 70);
            driverExcessFleetCard = Math.max(0, fleetCard - 70);
        }
        
        const totalCompanyCosts = iva + companyAssumesFleetCard + vehicleRental + rentalTolls + otherExpenses;
        const netToSplit = baseEarnings - totalCompanyCosts;
        const driverShareRaw = netToSplit * 0.4;
        const valorFinal = driverShareRaw - driverExcessFleetCard + refundedTips - debtDeduction;

        return {
            isPercentage: true,
            percentageType: calculation.percentageType,
            baseEarnings,
            refundedTips,
            refundedTolls,
            totalPlatformTolls,
            totalCompanyCosts,
            netToSplit,
            driverShare: driverShareRaw,
            fleetCardExcess: driverExcessFleetCard,
            valorFinal,
            iva,
        };
    }
  }
  
  // --- STANDARD (FROTA / SLOT) LOGIC ---
  const totalGanhos = totalGrossEarnings;
  
  // The slot fee remains calculated on the service value, excluding pass-throughs (tips, tolls).
  const baseParaSlot = totalGrossEarnings - totalTips - totalPlatformTolls;
  const slotFee = (calculation.type === CalculationType.SLOT && !calculation.isSlotExempt) ? baseParaSlot * 0.04 : 0;
  
  const driverCosts = vehicleRental + slotFee + iva + fleetCard + rentalTolls + otherExpenses + debtDeduction;
  
  // As per user request, platform tolls are now part of deductions.
  const totalDeducoes = driverCosts + totalPlatformTolls;

  // The final value is the total gross earnings minus all deductions.
  // Tips are not in deductions, so they correctly remain for the driver.
  const valorFinal = totalGanhos - totalDeducoes;
  
  // "Devoluções" section is for display purposes, showing what is returned to the driver.
  // Tolls are no longer considered a "devolução" in the UI.
  const refundedTips = totalTips;
  const refundedTolls = 0; // Moved to deductions
  const refundedAdjustments = totalAdjustments;
  const totalDevolucoes = refundedTips + refundedAdjustments;
  
  return {
    isPercentage: false,
    totalRides: baseParaSlot, // This is a better representation of "rides value"
    totalTips,
    totalPlatformTolls, // Still needed for display in deductions
    totalGanhos,
    slotFee,
    iva,
    totalDeducoes,
    refundedTips,
    refundedTolls, // Will be 0
    refundedAdjustments,
    totalDevolucoes,
    valorFinal,
  };
};
