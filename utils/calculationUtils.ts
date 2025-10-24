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

  const totalRides = uberRides + boltRides;
  const totalTips = uberTips + boltTips;
  const totalPlatformTolls = uberTolls + boltTolls;
  const totalAdjustments = uberPreviousPeriodAdjustments + boltPreviousPeriodAdjustments;

  // Default IVA calculation (on rides only), used for Percentage type.
  // It will be recalculated for Frota/Slot types later.
  let iva = !calculation.isIvaExempt ? totalRides * 0.06 : 0;

  if (calculation.type === CalculationType.PERCENTAGE) {
    // This is the core amount from rides & adjustments, subject to splitting.
    const baseEarnings = totalRides + totalAdjustments;
    
    // Tips are a direct pass-through to the driver.
    const refundedTips = totalTips;
    // NEW RULE: Tolls from platforms now belong to the company, not the driver.
    // This variable is used in the final value calculation, so it must be 0.
    const refundedTolls = 0;

    const isDiesel = calculation.fuelType === FuelType.DIESEL;
    const isElectric = calculation.fuelType === FuelType.ELECTRIC;
    
    // 50/50 LOGIC (New)
    if (calculation.percentageType === PercentageType.FIFTY_FIFTY) {
        // "potToSplit" is the net value after deducting shared costs from base earnings.
        let potToSplit = baseEarnings;

        // 1. Deduct full IVA from the pot.
        potToSplit -= iva;

        // 2. Handle fleet card costs.
        // The cost up to the limit is shared (deducted from the pot before splitting).
        const fleetCardLimit = isDiesel ? 120 : (isElectric ? 70 : 0);
        const fleetCardCostToSplit = Math.min(fleetCard, fleetCardLimit);
        // Any excess is a direct cost to the driver.
        const fleetCardExcessForDriver = Math.max(0, fleetCard - fleetCardLimit);
        
        // Deduct the splittable portion from the pot.
        potToSplit -= fleetCardCostToSplit;

        // 3. Split the final pot.
        const driverShare = potToSplit * 0.5;

        // 4. Calculate driver-specific costs (not shared).
        // For 50/50, tolls are not refunded to the driver, they are a company revenue.
        // Here we just calculate costs that are purely on the driver's side.
        const driverSpecificCosts = 
            fleetCardExcessForDriver + 
            rentalTolls + 
            otherExpenses + 
            debtDeduction;

        // 5. Calculate final payout.
        // refundedTolls is 0 here, correctly not giving the tolls to the driver.
        const valorFinal = driverShare + refundedTips - driverSpecificCosts;

        return {
            isPercentage: true,
            percentageType: calculation.percentageType,
            baseEarnings,
            refundedTips,
            refundedTolls,
            totalPlatformTolls, // For display purposes only
            iva,
            potToSplit,
            driverShare,
            fleetCardCostToSplit, // For display
            driverCosts: driverSpecificCosts, // For display
            valorFinal,
        };
    }

    // 60/40 LOGIC
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
        
        // refundedTolls is 0 here, correctly not giving the tolls to the driver.
        const valorFinal = driverShareRaw - driverExcessFleetCard + refundedTips + refundedTolls - debtDeduction;

        return {
            isPercentage: true,
            percentageType: calculation.percentageType,
            baseEarnings,
            refundedTips,
            refundedTolls,
            totalPlatformTolls, // For display purposes only
            totalCompanyCosts,
            netToSplit,
            driverShare: driverShareRaw,
            fleetCardExcess: driverExcessFleetCard,
            valorFinal,
            iva, // Add iva to the return object
        };
    }
  }
  
  // --- START OF STANDARD (FROTA / SLOT) LOGIC ---
  const totalGanhos = totalRides + totalTips + totalPlatformTolls + totalAdjustments;
  
  // Per user request, for Frota/Slot, IVA is now calculated on total earnings.
  iva = !calculation.isIvaExempt ? totalGanhos * 0.06 : 0;
  
  const slotFee = (calculation.type === CalculationType.SLOT && !calculation.isSlotExempt) ? totalGanhos * 0.04 : 0;
  
  // All costs that are deducted from the driver's earnings
  const driverCosts = vehicleRental + slotFee + iva + fleetCard + rentalTolls + otherExpenses + debtDeduction;
  
  // The driver's final value is what they earned (rides, tips, adjustments) minus their costs.
  // Platform tolls are fleet revenue and are not part of the driver's earnings for this calculation.
  const valorFinal = (totalRides + totalTips + totalAdjustments) - driverCosts;
  
  // For UI display, totalDeducoes includes driver costs AND platform tolls retained by the company.
  const totalDeducoes = driverCosts + totalPlatformTolls;

  const refundedTips = totalTips;
  const refundedTolls = totalPlatformTolls; // This is for DISPLAY only in the "Devoluções" section.
  const refundedAdjustments = totalAdjustments;
  const totalDevolucoes = refundedTips + refundedTolls + refundedAdjustments;
  
  return {
    isPercentage: false,
    totalRides,
    totalTips,
    totalPlatformTolls,
    totalGanhos,
    slotFee,
    iva,
    totalDeducoes,
    refundedTips,
    refundedTolls,
    refundedAdjustments,
    totalDevolucoes,
    valorFinal,
  };
};