import { Calculation, CalculationType, FuelType, PercentageType } from '../types';

export const calculateSummary = (calculation: Calculation): any => {
  // Gross values from the form, as per user request.
  const uberGross = calculation.uberRides || 0;
  const boltGross = calculation.boltRides || 0;

  // Informational components already included in the gross values.
  const uberTips = calculation.uberTips || 0;
  const uberTolls = calculation.uberTolls || 0;
  const uberPreviousPeriodAdjustments = calculation.uberPreviousPeriodAdjustments || 0;
  const boltTips = calculation.boltTips || 0;
  const boltTolls = calculation.boltTolls || 0;
  const boltPreviousPeriodAdjustments = calculation.boltPreviousPeriodAdjustments || 0;
  
  // Deductions
  const vehicleRental = calculation.vehicleRental || 0;
  const fleetCard = calculation.fleetCard || 0;
  const rentalTolls = calculation.rentalTolls || 0;
  const otherExpenses = calculation.otherExpenses || 0;
  const debtDeduction = calculation.debtDeduction || 0;

  // --- Aggregated Values ---
  const totalGross = uberGross + boltGross;
  const totalTips = uberTips + boltTips;
  const totalPlatformTolls = uberTolls + boltTolls;
  const totalAdjustments = uberPreviousPeriodAdjustments + boltPreviousPeriodAdjustments;

  // This is the "pure" rides value, calculated by subtracting the components from the gross value.
  const totalRidesValue = totalGross - totalTips - totalPlatformTolls - totalAdjustments;
  
  // Gross earnings from platforms, for display and as the base for IVA.
  const totalGanhosBrutos = totalGross;

  // --- Common Calculations ---
  // IVA is calculated on the total gross income.
  const iva = !calculation.isIvaExempt ? totalGanhosBrutos * 0.06 : 0;

  // --- PERCENTAGE LOGIC ---
  if (calculation.type === CalculationType.PERCENTAGE) {
    // baseEarnings for splitting is the gross amount minus pass-throughs (tips and tolls). Adjustments are part of the split.
    const baseEarnings = totalGross - totalTips - totalPlatformTolls;
    const refundedTips = totalTips; // Tips are a direct pass-through

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
        // Driver's specific costs are their share of the fleet card excess, plus other items.
        // Platform tolls are a company cost in this model and not deducted from the driver here.
        const driverSpecificCosts = fleetCardExcessForDriver + rentalTolls + otherExpenses + debtDeduction;
        const valorFinal = driverShare + refundedTips - driverSpecificCosts;

        return {
            isPercentage: true,
            percentageType: calculation.percentageType,
            baseEarnings,
            refundedTips,
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
        
        // Company costs also include platform tolls
        const totalCompanyCosts = iva + companyAssumesFleetCard + vehicleRental + rentalTolls + otherExpenses + totalPlatformTolls;
        const netToSplit = baseEarnings - totalCompanyCosts;
        const driverShareRaw = netToSplit * 0.4;
        const valorFinal = driverShareRaw - driverExcessFleetCard + refundedTips - debtDeduction;

        return {
            isPercentage: true,
            percentageType: calculation.percentageType,
            baseEarnings,
            refundedTips,
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
  
  // totalGanhos is the gross total from platforms, used for display.
  const totalGanhos = totalGanhosBrutos;
  
  // Slot is calculated based on the "pure" rides value, not the gross total.
  const baseParaTaxas = totalRidesValue;
  const slotFee = (calculation.type === CalculationType.SLOT && !calculation.isSlotExempt) ? baseParaTaxas * 0.04 : 0;

  // Total deductions includes all costs, with platform tolls acting as a pass-through debit.
  const totalDeducoes = 
      vehicleRental + 
      slotFee + 
      iva + 
      fleetCard + 
      rentalTolls + 
      otherExpenses + 
      debtDeduction +
      totalPlatformTolls;

  // Final value is the simple difference between gross earnings and total deductions.
  const valorFinal = totalGanhos - totalDeducoes;
  
  return {
    isPercentage: false,
    totalGanhos,
    totalDeducoes,
    valorFinal,
    // Return individual components for detailed view
    slotFee,
    iva,
    refundedTips: totalTips,
    refundedAdjustments: totalAdjustments,
    totalPlatformTolls,
  };
};
