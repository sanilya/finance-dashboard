import { generateAmortizationSchedule } from '../finance';

describe('Amortization Schedule Tests', () => {
  test('remaining principal should be exactly zero in the last month', () => {
    // Test with different loan parameters
    const testCases = [
      { principal: 100000, rate: 10, months: 12 },
      { principal: 1000000, rate: 8.5, months: 180 },
      { principal: 50000, rate: 12, months: 36 },
      { principal: 2500000, rate: 7.25, months: 240 },
      { principal: 75000, rate: 9.75, months: 60 }
    ];
    
    testCases.forEach(({ principal, rate, months }) => {
      const schedule = generateAmortizationSchedule(principal, rate, months);
      
      // Check that we have the correct number of entries
      expect(schedule.length).toBe(months);
      
      // Check that the last month's remaining principal is exactly zero
      expect(schedule[months - 1].remainingPrincipal).toBe(0);
      
      // Check that the sum of all principal payments equals the original principal (within rounding tolerance)
      const totalPrincipalPaid = schedule.reduce((sum, month) => sum + month.principalPayment, 0);
      expect(totalPrincipalPaid).toBeCloseTo(principal, 0);
    });
  });
  
  test('each month should have consistent EMI value', () => {
    const principal = 500000;
    const rate = 9;
    const months = 120;
    
    const schedule = generateAmortizationSchedule(principal, rate, months);
    const emi = schedule[0].emi;
    
    // Check that all months have the same EMI
    schedule.forEach(month => {
      expect(month.emi).toBe(emi);
    });
  });
  
  test('interest portion should decrease over time', () => {
    const principal = 800000;
    const rate = 8;
    const months = 60;
    
    const schedule = generateAmortizationSchedule(principal, rate, months);
    
    // Check that interest payments decrease over time
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].interestPayment).toBeLessThan(schedule[i-1].interestPayment);
    }
  });
  
  test('principal portion should increase over time', () => {
    const principal = 300000;
    const rate = 11;
    const months = 48;
    
    const schedule = generateAmortizationSchedule(principal, rate, months);
    
    // Check that principal payments increase over time
    for (let i = 1; i < schedule.length; i++) {
      expect(schedule[i].principalPayment).toBeGreaterThan(schedule[i-1].principalPayment);
    }
  });
  
  test('each payment should equal the sum of principal and interest components', () => {
    const principal = 1200000;
    const rate = 7.5;
    const months = 84;
    
    const schedule = generateAmortizationSchedule(principal, rate, months);
    
    // Check that EMI = principal payment + interest payment for each month
    schedule.forEach(month => {
      expect(month.principalPayment + month.interestPayment).toBeCloseTo(month.emi, 1);
    });
  });
});
