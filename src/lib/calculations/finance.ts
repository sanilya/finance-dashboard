/**
 * Financial calculation utilities for the Finance App
 */

/**
 * Calculate EMI (Equated Monthly Installment)
 * 
 * @param principal - Principal loan amount
 * @param interestRate - Annual interest rate (in percentage)
 * @param tenureMonths - Loan tenure in months
 * @returns Monthly EMI amount
 */
export const calculateEMI = (
  principal: number,
  interestRate: number,
  tenureMonths: number
): number => {
  // Convert annual interest rate to monthly rate (decimal)
  const monthlyRate = interestRate / 100 / 12;
  
  // EMI formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
  const emi = principal * 
    monthlyRate * 
    Math.pow(1 + monthlyRate, tenureMonths) / 
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  
  return Math.round(emi * 100) / 100;
};

/**
 * Generate amortization schedule for a loan
 * 
 * @param principal - Principal loan amount
 * @param interestRate - Annual interest rate (in percentage)
 * @param tenureMonths - Loan tenure in months
 * @returns Array of monthly payment details
 */
export const generateAmortizationSchedule = (
  principal: number,
  interestRate: number,
  tenureMonths: number
) => {
  const monthlyRate = interestRate / 100 / 12;
  
  let remainingPrincipal = principal;
  const schedule = [];
  
  // Calculate exact EMI without rounding to ensure perfect amortization
  const exactEmi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / 
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  
  for (let month = 1; month <= tenureMonths; month++) {
    const interestPayment = remainingPrincipal * monthlyRate;
    
    // For the last month, adjust principal payment to clear the remaining balance exactly
    let principalPayment;
    if (month === tenureMonths) {
      principalPayment = remainingPrincipal;
      // Adjust the final EMI to match the exact remaining amount
      schedule.push({
        month,
        emi: Math.round((interestPayment + principalPayment) * 100) / 100,
        principalPayment: Math.round(principalPayment * 100) / 100,
        interestPayment: Math.round(interestPayment * 100) / 100,
        remainingPrincipal: 0
      });
    } else {
      principalPayment = exactEmi - interestPayment;
      remainingPrincipal -= principalPayment;
      
      schedule.push({
        month,
        emi: Math.round(exactEmi * 100) / 100,
        principalPayment: Math.round(principalPayment * 100) / 100,
        interestPayment: Math.round(interestPayment * 100) / 100,
        remainingPrincipal: Math.round(remainingPrincipal * 100) / 100
      });
    }
  }
  
  return schedule;
};

/**
 * Calculate future value of an investment with regular contributions
 * 
 * @param initialAmount - Initial investment amount
 * @param monthlyContribution - Regular monthly contribution
 * @param annualRate - Annual growth rate (in percentage)
 * @param years - Investment duration in years
 * @returns Final investment value
 */
export const calculateInvestmentGrowth = (
  initialAmount: number,
  monthlyContribution: number,
  annualRate: number,
  years: number
): number => {
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = years * 12;
  
  // Calculate growth of initial amount
  const initialGrowth = initialAmount * Math.pow(1 + monthlyRate, totalMonths);
  
  // Calculate growth of regular contributions (SIP)
  const contributionGrowth = monthlyContribution * 
    (Math.pow(1 + monthlyRate, totalMonths) - 1) / 
    monthlyRate;
  
  return Math.round((initialGrowth + contributionGrowth) * 100) / 100;
};

/**
 * Generate year-by-year wealth projection
 * 
 * @param initialNetWorth - Starting net worth
 * @param yearlySavings - Expected yearly savings
 * @param growthRate - Annual growth rate (in percentage)
 * @param years - Projection duration in years
 * @returns Year-by-year projection
 */
export const generateWealthProjection = (
  initialNetWorth: number,
  yearlySavings: number,
  growthRate: number,
  years: number
) => {
  const projection = [];
  let currentNetWorth = initialNetWorth;
  
  for (let year = 0; year <= years; year++) {
    projection.push({
      year,
      netWorth: Math.round(currentNetWorth * 100) / 100
    });
    
    // Apply growth and add savings for next year
    currentNetWorth = currentNetWorth * (1 + growthRate / 100) + yearlySavings;
  }
  
  return projection;
};

/**
 * Calculate the impact of prepayment on a loan
 * 
 * @param principal - Remaining principal amount
 * @param interestRate - Annual interest rate (in percentage)
 * @param tenureMonths - Remaining tenure in months
 * @param prepaymentAmount - Lump sum prepayment amount
 * @returns Impact on tenure and EMI
 */
export const calculatePrepaymentImpact = (
  principal: number,
  interestRate: number,
  tenureMonths: number,
  prepaymentAmount: number
) => {
  const originalEMI = calculateEMI(principal, interestRate, tenureMonths);
  
  // Reduced principal after prepayment
  const reducedPrincipal = principal - prepaymentAmount;
  if (reducedPrincipal <= 0) {
    return {
      originalEMI,
      originalTenure: tenureMonths,
      reducedEMI: 0,
      reducedTenure: 0,
      interestSaved: principal * interestRate / 100 / 12 * tenureMonths - prepaymentAmount,
      tenureSaved: tenureMonths
    };
  }
  
  // Option 1: Same EMI, reduced tenure
  const monthlyRate = interestRate / 100 / 12;
  const reducedTenure = Math.ceil(
    Math.log(originalEMI / (originalEMI - reducedPrincipal * monthlyRate)) / 
    Math.log(1 + monthlyRate)
  );
  
  // Option 2: Same tenure, reduced EMI
  const reducedEMI = calculateEMI(reducedPrincipal, interestRate, tenureMonths);
  
  // Calculate interest savings
  const originalTotalPayment = originalEMI * tenureMonths;
  const reducedTotalPayment = reducedEMI * tenureMonths;
  const interestSaved = originalTotalPayment - reducedTotalPayment - prepaymentAmount;
  
  return {
    originalEMI,
    originalTenure: tenureMonths,
    reducedEMI,
    reducedTenure,
    interestSaved: Math.round(interestSaved * 100) / 100,
    tenureSaved: tenureMonths - reducedTenure
  };
};

/**
 * Calculate monthly savings needed to reach a goal
 * 
 * @param targetAmount - Goal target amount
 * @param currentAmount - Current amount already saved
 * @param yearsToGoal - Years to reach the goal
 * @param annualRate - Expected annual growth rate (in percentage)
 * @returns Required monthly savings
 */
export const calculateMonthlySavingsForGoal = (
  targetAmount: number,
  currentAmount: number,
  yearsToGoal: number,
  annualRate: number
): number => {
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = yearsToGoal * 12;
  
  // Calculate future value of current amount
  const futureValueOfCurrent = currentAmount * Math.pow(1 + monthlyRate, totalMonths);
  
  // Calculate remaining amount to be saved
  const amountToSave = targetAmount - futureValueOfCurrent;
  
  if (amountToSave <= 0) return 0;
  
  // Calculate monthly savings required
  const monthlySavings = amountToSave / 
    ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);
  
  return Math.round(monthlySavings * 100) / 100;
};
