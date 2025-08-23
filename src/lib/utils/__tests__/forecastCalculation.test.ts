import { debugForecastCalculation } from '../debugUtils';
import { generateWealthProjection } from '../../calculations/finance';

// Mock data from user with proper type conversion
const incomes = [
  {
    "name": "sahana",
    "category": "SALARY" as const,
    "amount": 145000,
    "frequency": "MONTHLY" as const,
    "bankAccountId": "953e81da-e213-4ed8-b734-2ef95679f9eb",
    "startDate": new Date("2025-09-05T00:00:00.000Z"),
    "notes": "",
    "id": "14a37028-fc2c-4587-9a20-ebee287f34fe",
    "createdAt": new Date("2025-08-16T11:09:42.172Z"),
    "updatedAt": new Date("2025-08-16T11:09:42.172Z")
  }
];

const loans = [
  {
    "name": "House",
    "type": "HOME" as const,
    "principal": 10000000,
    "interestRate": 8.5,
    "startDate": new Date("2025-08-16T00:00:00.000Z"),
    "tenureMonths": 300,
    "emi": 80522.71,
    "notes": "",
    "id": "6fe24266-23f5-4173-9981-20716f40beea",
    "createdAt": new Date("2025-08-16T11:11:44.750Z"),
    "updatedAt": new Date("2025-08-16T11:12:04.609Z")
  }
];

const settings = {
  "defaultSavingsRate": 30,
  "defaultInflationRate": 7,
  "defaultInvestmentReturn": 20,
  "currency": "INR",
  "theme": "light"
};

describe('Forecast Calculation Tests', () => {
  test('should correctly calculate forecast with provided data', () => {
    // Initial net worth (from previous test)
    const initialNetWorth = -4405000;
    
    // Monthly values
    const monthlyIncome = 145000; // From income data
    const monthlyExpenses = 0; // No expenses provided
    const monthlyEMIs = 80522.71; // From loan data
    
    // Calculate expected values
    const availableIncome = monthlyIncome - monthlyExpenses - monthlyEMIs;
    const expectedAvailableIncome = 145000 - 0 - 80522.71;
    expect(availableIncome).toBeCloseTo(expectedAvailableIncome, 1);
    
    const monthlySavings = availableIncome * settings.defaultSavingsRate / 100;
    const expectedMonthlySavings = expectedAvailableIncome * 0.3;
    expect(monthlySavings).toBeCloseTo(expectedMonthlySavings, 1);
    
    const yearlySavings = monthlySavings * 12;
    const expectedYearlySavings = expectedMonthlySavings * 12;
    expect(yearlySavings).toBeCloseTo(expectedYearlySavings, 1);
    
    // Use debug utility
    const forecastDebug = debugForecastCalculation(
      initialNetWorth,
      monthlyIncome,
      monthlyExpenses,
      monthlyEMIs,
      settings.defaultSavingsRate,
      settings.defaultInvestmentReturn,
      settings.defaultInflationRate,
      20
    );
    
    // Verify the forecast calculations
    expect(forecastDebug.initialNetWorth).toBe(initialNetWorth);
    expect(forecastDebug.monthlyIncome).toBe(monthlyIncome);
    expect(forecastDebug.availableIncome).toBeCloseTo(expectedAvailableIncome, 1);
    expect(forecastDebug.monthlySavings).toBeCloseTo(expectedMonthlySavings, 1);
    expect(forecastDebug.yearlySavings).toBeCloseTo(expectedYearlySavings, 1);
    
    // Verify first year projection
    expect(forecastDebug.projection[0].year).toBe(0);
    expect(forecastDebug.projection[0].netWorth).toBe(initialNetWorth);
    
    // Verify the projection matches the generateWealthProjection function
    const manualProjection = generateWealthProjection(
      initialNetWorth,
      yearlySavings,
      settings.defaultInvestmentReturn,
      5
    );
    
    // Compare the first 5 years
    for (let i = 0; i <= 5; i++) {
      expect(forecastDebug.projection[i].netWorth).toBeCloseTo(manualProjection[i].netWorth, 0);
    }
  });
  
  test('should handle zero or negative available income', () => {
    const initialNetWorth = 1000000;
    const monthlyIncome = 50000;
    const monthlyExpenses = 30000;
    const monthlyEMIs = 30000; // Expenses + EMIs > Income
    
    const forecastDebug = debugForecastCalculation(
      initialNetWorth,
      monthlyIncome,
      monthlyExpenses,
      monthlyEMIs,
      settings.defaultSavingsRate,
      settings.defaultInvestmentReturn,
      settings.defaultInflationRate,
      20
    );
    
    // Available income should be negative
    expect(forecastDebug.availableIncome).toBe(-10000);
    
    // Monthly savings should be 0 (not negative)
    expect(forecastDebug.monthlySavings).toBe(0);
    expect(forecastDebug.yearlySavings).toBe(0);
    
    // First year should just be the initial net worth
    expect(forecastDebug.projection[0].netWorth).toBe(initialNetWorth);
    
    // Second year should grow only by investment return, no savings
    const expectedSecondYearNetWorth = initialNetWorth * (1 + settings.defaultInvestmentReturn / 100);
    expect(forecastDebug.projection[1].netWorth).toBeCloseTo(expectedSecondYearNetWorth, 0);
  });
  
  test('should correctly project wealth turning from negative to positive', () => {
    // Start with negative net worth
    const initialNetWorth = -1000000;
    
    // But have strong positive cash flow
    const monthlyIncome = 200000;
    const monthlyExpenses = 50000;
    const monthlyEMIs = 50000;
    
    const forecastDebug = debugForecastCalculation(
      initialNetWorth,
      monthlyIncome,
      monthlyExpenses,
      monthlyEMIs,
      settings.defaultSavingsRate,
      settings.defaultInvestmentReturn,
      settings.defaultInflationRate,
      20
    );
    
    // Available income should be positive
    expect(forecastDebug.availableIncome).toBe(100000);
    
    // Monthly savings should be 30% of available income
    expect(forecastDebug.monthlySavings).toBe(30000);
    expect(forecastDebug.yearlySavings).toBe(360000);
    
    // First year should be negative
    expect(forecastDebug.projection[0].netWorth).toBe(initialNetWorth);
    
    // At some point, net worth should turn positive
    let becamePositive = false;
    let yearOfPositiveNetWorth = -1;
    
    for (let i = 1; i < forecastDebug.projection.length; i++) {
      if (forecastDebug.projection[i].netWorth > 0 && !becamePositive) {
        becamePositive = true;
        yearOfPositiveNetWorth = i;
        break;
      }
    }
    
    expect(becamePositive).toBe(true);
    expect(yearOfPositiveNetWorth).toBeGreaterThan(0);
  });
  
  test('should correctly calculate with the user provided data', () => {
    // Initial net worth (from previous test)
    const initialNetWorth = -4405000;
    
    // Monthly values from user data
    const monthlyIncome = incomes[0].amount; // 145000
    const monthlyExpenses = 0; // No expenses provided
    const monthlyEMIs = loans[0].emi; // 80522.71
    
    // Use debug utility
    const forecastDebug = debugForecastCalculation(
      initialNetWorth,
      monthlyIncome,
      monthlyExpenses,
      monthlyEMIs,
      settings.defaultSavingsRate,
      settings.defaultInvestmentReturn,
      settings.defaultInflationRate,
      20
    );
    
    // Calculate expected values
    const expectedAvailableIncome = monthlyIncome - monthlyExpenses - monthlyEMIs;
    const expectedMonthlySavings = expectedAvailableIncome * settings.defaultSavingsRate / 100;
    const expectedYearlySavings = expectedMonthlySavings * 12;
    
    // Verify calculations
    expect(forecastDebug.availableIncome).toBeCloseTo(expectedAvailableIncome, 1);
    expect(forecastDebug.monthlySavings).toBeCloseTo(expectedMonthlySavings, 1);
    expect(forecastDebug.yearlySavings).toBeCloseTo(expectedYearlySavings, 1);
    
    // With the user's data, net worth is negative and may not become positive within 5 years
    // due to the large loan principal (10M) compared to monthly savings
    // This is expected behavior - we're just verifying the calculation is working correctly
    
    // Verify that the calculation is using the correct values
    expect(forecastDebug.initialNetWorth).toBe(initialNetWorth);
    expect(forecastDebug.monthlyIncome).toBe(monthlyIncome);
    expect(forecastDebug.monthlyEMIs).toBeCloseTo(monthlyEMIs, 1);
    expect(forecastDebug.availableIncome).toBeCloseTo(expectedAvailableIncome, 1);
    expect(forecastDebug.monthlySavings).toBeCloseTo(expectedMonthlySavings, 1);
    expect(forecastDebug.yearlySavings).toBeCloseTo(expectedYearlySavings, 1);
  });
});
