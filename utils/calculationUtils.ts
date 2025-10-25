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

  // --- Base Values ---
  const totalRides = uberRides + boltRides;
  const totalTips = uberTips + boltTips;
  const totalPlatformTolls = uberTolls + boltTolls;
  const totalAdjustments = uberPreviousPeriodAdjustments + boltPreviousPeriodAdjustments;

  // Gross earnings from platforms, used as the base for IVA.
  const totalGanhosBrutos = totalRides + totalTips + totalPlatformTolls + totalAdjustments;

  // --- Common Calculations ---
  // IVA is calculated on the total gross income as requested by the user.
  // Slot fee remains calculated on rides only.
  const iva = !calculation.isIvaExempt ? totalGanhosBrutos * 0.06 : 0;

  // --- PERCENTAGE LOGIC ---
  if (calculation.type === CalculationType.PERCENTAGE) {
    // baseEarnings for splitting is rides + adjustments. Tips and tolls are handled separately.
    const baseEarnings = totalRides + totalAdjustments;
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
  
  // Slot is calculated based on rides only.
  const baseParaTaxas = totalRides;
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
    refundedTips: totalTips, // Still needed for line items, though the "Devoluções" concept is gone
    refundedAdjustments: totalAdjustments, // Still needed for line items
    totalPlatformTolls,
  };
};