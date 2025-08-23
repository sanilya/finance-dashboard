import {
  calculateEMI,
  generateAmortizationSchedule,
  calculateInvestmentGrowth,
  generateWealthProjection,
  calculatePrepaymentImpact,
  calculateMonthlySavingsForGoal
} from '../finance';

describe('Finance Calculation Tests', () => {
  describe('calculateEMI', () => {
    test('should calculate EMI correctly for standard loan', () => {
      // 10 lakh loan at 10% for 20 years (240 months)
      const result = calculateEMI(1000000, 10, 240);
      expect(result).toBeCloseTo(9650.14, 1);
    });

    test('should handle zero interest rate', () => {
      // 100000 loan at 0% for 12 months = 8333.33 per month
      const result = calculateEMI(100000, 0, 12);
      expect(result).toBeCloseTo(8333.33, 1);
    });

    test('should handle short tenure', () => {
      // 50000 loan at 12% for 3 months
      const result = calculateEMI(50000, 12, 3);
      expect(result).toBeGreaterThan(16666); // More than just principal/tenure due to interest
    });
  });

  describe('generateAmortizationSchedule', () => {
    test('should generate correct amortization schedule', () => {
      const schedule = generateAmortizationSchedule(100000, 10, 12);
      
      // Should have 12 entries
      expect(schedule.length).toBe(12);
      
      // First month should have higher interest, lower principal
      expect(schedule[0].interestPayment).toBeGreaterThan(schedule[11].interestPayment);
      expect(schedule[0].principalPayment).toBeLessThan(schedule[11].principalPayment);
      
      // Last month should have remaining principal close to zero
      expect(schedule[11].remainingPrincipal).toBeCloseTo(0, 0);
      
      // Sum of all principal payments should equal original loan
      const totalPrincipal = schedule.reduce((sum, month) => sum + month.principalPayment, 0);
      expect(totalPrincipal).toBeCloseTo(100000, 0);
    });
  });

  describe('calculateInvestmentGrowth', () => {
    test('should calculate investment growth correctly with no contributions', () => {
      // 100000 initial, no monthly contribution, 10% annual return, 5 years
      const result = calculateInvestmentGrowth(100000, 0, 10, 5);
      expect(result).toBeCloseTo(161051.00, 0); // Compound growth only
    });

    test('should calculate investment growth correctly with contributions', () => {
      // 100000 initial, 5000 monthly, 12% annual return, 10 years
      const result = calculateInvestmentGrowth(100000, 5000, 12, 10);
      expect(result).toBeGreaterThan(1500000); // Significant growth expected
    });

    test('should handle negative returns', () => {
      // 100000 initial, 1000 monthly, -5% annual return, 3 years
      const result = calculateInvestmentGrowth(100000, 1000, -5, 3);
      expect(result).toBeLessThan(100000 + 36000); // Less than principal + contributions
    });
  });

  describe('generateWealthProjection', () => {
    test('should generate wealth projection with positive growth', () => {
      const projection = generateWealthProjection(100000, 60000, 10, 5);
      
      // Should have 6 entries (0 to 5 years)
      expect(projection.length).toBe(6);
      
      // Initial year should be the starting amount
      expect(projection[0].netWorth).toBe(100000);
      
      // Final year should be significantly higher
      expect(projection[5].netWorth).toBeGreaterThan(500000);
      
      // Each year should be greater than the previous
      for (let i = 1; i < projection.length; i++) {
        expect(projection[i].netWorth).toBeGreaterThan(projection[i-1].netWorth);
      }
    });

    test('should handle negative growth rates', () => {
      const projection = generateWealthProjection(100000, 20000, -5, 3);
      
      // Even with negative growth, yearly savings should still increase total
      expect(projection[3].netWorth).toBeGreaterThan(100000);
    });

    test('should handle zero initial net worth', () => {
      const projection = generateWealthProjection(0, 12000, 8, 5);
      
      // Should still grow from zero with just savings
      expect(projection[5].netWorth).toBeGreaterThan(60000);
    });
  });

  describe('calculatePrepaymentImpact', () => {
    test('should calculate prepayment impact correctly', () => {
      // 1000000 loan, 10% interest, 240 months remaining, 200000 prepayment
      const impact = calculatePrepaymentImpact(1000000, 10, 240, 200000);
      
      // Reduced EMI should be less than original
      expect(impact.reducedEMI).toBeLessThan(impact.originalEMI);
      
      // Reduced tenure should be less than original
      expect(impact.reducedTenure).toBeLessThan(impact.originalTenure);
      
      // Interest saved should be positive
      expect(impact.interestSaved).toBeGreaterThan(0);
    });

    test('should handle prepayment greater than principal', () => {
      const impact = calculatePrepaymentImpact(100000, 10, 60, 150000);
      
      // Should indicate loan is fully paid
      expect(impact.reducedEMI).toBe(0);
      expect(impact.reducedTenure).toBe(0);
      expect(impact.tenureSaved).toBe(60);
    });
  });

  describe('calculateMonthlySavingsForGoal', () => {
    test('should calculate monthly savings needed correctly', () => {
      // Goal: 1000000, current: 100000, years: 10, growth: 10%
      const result = calculateMonthlySavingsForGoal(1000000, 100000, 10, 10);
      
      // Should be a reasonable monthly amount
      expect(result).toBeGreaterThan(3000);
      expect(result).toBeLessThan(10000);
    });

    test('should return zero if current amount exceeds target', () => {
      const result = calculateMonthlySavingsForGoal(100000, 150000, 5, 8);
      expect(result).toBe(0);
    });

    test('should handle zero growth rate', () => {
      // Goal: 60000, current: 0, years: 5, growth: 0%
      // Simple calculation: 60000 / (5 * 12) = 1000 per month
      const result = calculateMonthlySavingsForGoal(60000, 0, 5, 0);
      expect(result).toBeCloseTo(1000, 0);
    });
  });

  // Integration tests combining multiple calculations
  describe('Integration tests', () => {
    test('loan and investment combined scenario', () => {
      // Scenario: Taking a loan and investing the difference
      const loanAmount = 500000;
      const loanRate = 8;
      const loanTenure = 60; // 5 years
      
      const emi = calculateEMI(loanAmount, loanRate, loanTenure);
      const totalLoanPayment = emi * loanTenure;
      
      // Investing the loan amount at a higher return
      const investmentReturn = 12;
      const investmentValue = calculateInvestmentGrowth(loanAmount, 0, investmentReturn, 5);
      
      // Investment should exceed loan cost for this to be profitable
      const profit = investmentValue - totalLoanPayment;
      expect(profit).toBeGreaterThan(0);
    });

    test('wealth projection with loan payoff scenario', () => {
      // Initial: 200k net worth, 50k yearly savings, 10% growth
      let projection = generateWealthProjection(200000, 50000, 10, 10);
      
      // After 5 years, pay off a 300k loan
      const netWorthAfter5Years = projection[5].netWorth;
      const remainingProjection = generateWealthProjection(
        netWorthAfter5Years - 300000, // Reduced by loan amount
        50000 + 24000, // Increased savings (no more EMI of 2k/month)
        10, 
        5
      );
      
      // Final net worth should still be positive and growing
      expect(remainingProjection[5].netWorth).toBeGreaterThan(remainingProjection[0].netWorth);
    });
  });

  // Edge cases and boundary tests
  describe('Edge cases', () => {
    test('extremely high interest rates', () => {
      // 10000 loan at 50% for 12 months
      const highInterestEMI = calculateEMI(10000, 50, 12);
      expect(highInterestEMI).toBeGreaterThan(1200); // Much higher than principal/tenure
    });
    
    test('extremely long tenure', () => {
      // 1000000 loan at 8% for 30 years (360 months)
      const longTermEMI = calculateEMI(1000000, 8, 360);
      expect(longTermEMI).toBeLessThan(8000); // Lower monthly payment due to long term
    });
    
    test('extremely high investment returns', () => {
      // 10000 initial, 1000 monthly, 50% annual return, 10 years
      const highReturnGrowth = calculateInvestmentGrowth(10000, 1000, 50, 10);
      expect(highReturnGrowth).toBeGreaterThan(10000000); // Exponential growth
    });
  });
});
