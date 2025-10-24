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

  if (calculation.type === CalculationType.PERCENTAGE) {
    const totalEarnings = totalRides + totalPlatformTolls + totalAdjustments;
    const refundedTips = totalTips;
    const isDiesel = calculation.fuelType === FuelType.DIESEL;
    const isElectric = calculation.fuelType === FuelType.ELECTRIC;
    const iva = !calculation.isIvaExempt ? totalEarnings * 0.06 : 0;
    
    // 50/50 LOGIC
    if (calculation.percentageType === PercentageType.FIFTY_FIFTY) {
      // "apenas divide: o cartao frota ... e o iva 6%."
      const driverShareRaw = totalEarnings * 0.5;

      // IVA is split 50/50
      const driverIvaCost = iva / 2;

      // The part of the fleet card cost under the limit is split. The excess is paid by the driver.
      let driverFleetCardCost = 0;
      let companyFleetCardCost = 0;
      
      if (isDiesel) {
          const splitAmount = Math.min(fleetCard, 120);
          companyFleetCardCost = splitAmount / 2;
          driverFleetCardCost = fleetCard - companyFleetCardCost;
      } else if (isElectric) {
          const splitAmount = Math.min(fleetCard, 70);
          companyFleetCardCost = splitAmount / 2;
          driverFleetCardCost = fleetCard - companyFleetCardCost;
      }

      const driverCosts = driverIvaCost + driverFleetCardCost;
      const valorFinal = driverShareRaw - driverCosts + refundedTips - debtDeduction;

      return {
          isPercentage: true,
          percentageType: calculation.percentageType,
          totalEarnings,
          refundedTips,
          iva,
          fleetCard,
          driverShare: driverShareRaw,
          driverCosts,
          valorFinal,
      };
    }

    // 60/40 LOGIC
    if (calculation.percentageType === PercentageType.SIXTY_FORTY) {
        // "o motorista leva apenas 40% do liquido depois de deduzido as dispesas"
        // "cartao frota ... a frota assume ... se ultrapassar o restante ... é descontado dos 40%"
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
        const netToSplit = totalEarnings - totalCompanyCosts;

        const driverShareRaw = netToSplit * 0.4;
        const companyShare = netToSplit * 0.6;
        
        const driverShareAfterExcess = driverShareRaw - driverExcessFleetCard;
        const valorFinal = driverShareAfterExcess + refundedTips - debtDeduction;

        return {
            isPercentage: true,
            percentageType: calculation.percentageType,
            totalEarnings,
            refundedTips,
            totalCompanyCosts,
            netToSplit,
            driverShare: driverShareAfterExcess, // This is the final share before tips
            companyShare,
            fleetCardExcess: driverExcessFleetCard, // To display the deduction
            valorFinal,
        };
    }
  }
  
  // --- START OF STANDARD (FROTA / SLOT) LOGIC ---
  const totalGanhos = totalRides + totalTips + totalPlatformTolls + totalAdjustments;

  const slotFee = (calculation.type === CalculationType.SLOT && !calculation.isSlotExempt) ? totalGanhos * 0.04 : 0;
  const iva = !calculation.isIvaExempt ? totalGanhos * 0.06 : 0;
  
  const platformTollsAsDeduction = calculation.type === CalculationType.FROTA ? totalPlatformTolls : 0;

  const totalDeducoes = vehicleRental + slotFee + iva + fleetCard + rentalTolls + otherExpenses + debtDeduction + platformTollsAsDeduction;

  const refundedTips = totalTips;
  const refundedTolls = calculation.type === CalculationType.SLOT ? totalPlatformTolls : 0;
  const refundedAdjustments = totalAdjustments;
  const totalDevolucoes = refundedTips + refundedTolls + refundedAdjustments;
  
  const valorFinal = totalGanhos - totalDeducoes;

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