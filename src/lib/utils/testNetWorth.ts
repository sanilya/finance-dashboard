/**
 * Test script to debug net worth calculation with provided data
 */

import { debugNetWorthCalculation, debugForecastCalculation } from './debugUtils';
import { formatCurrency } from '../formatters/currency';

// Mock data from user with proper type conversion
const bankAccounts = [
  {
    "name": "Axis",
    "accountNumber": "XXXXXXXX",
    "accountType": "SAVINGS" as const,
    "balance": 4645000,
    "interestRate": 3,
    "isAsset": true,
    "notes": "",
    "id": "953e81da-e213-4ed8-b734-2ef95679f9eb",
    "createdAt": new Date("2025-08-16T11:08:48.511Z"),
    "updatedAt": new Date("2025-08-16T11:09:42.173Z")
  },
  {
    "name": "KCCB",
    "accountNumber": "XXXXXXXX1",
    "accountType": "SAVINGS" as const,
    "balance": 950000,
    "interestRate": 4.5,
    "isAsset": true,
    "notes": "",
    "id": "478abc64-adf7-4c90-8388-01fdbdfb4363",
    "createdAt": new Date("2025-08-16T11:09:04.350Z"),
    "updatedAt": new Date("2025-08-16T11:09:04.350Z")
  }
];

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

// Test function
export const testNetWorthCalculation = () => {
  console.log('===== TESTING NET WORTH CALCULATION WITH PROVIDED DATA =====');
  
  // Empty assets array since none were provided
  const assets: any[] = [];
  
  // Calculate net worth manually
  const assetsTotal = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  const bankAccountsTotal = bankAccounts
    .filter(account => account.isAsset)
    .reduce((sum, account) => sum + account.balance, 0);
  const totalAssets = assetsTotal + bankAccountsTotal;
  const liabilitiesTotal = loans.reduce((sum, loan) => sum + loan.principal, 0);
  const netWorth = totalAssets - liabilitiesTotal;
  
  console.log('Manual calculation:');
  console.log(`Assets Total: ${formatCurrency(assetsTotal)}`);
  console.log(`Bank Accounts Total: ${formatCurrency(bankAccountsTotal)}`);
  console.log(`Total Assets: ${formatCurrency(totalAssets)}`);
  console.log(`Liabilities Total: ${formatCurrency(liabilitiesTotal)}`);
  console.log(`Net Worth: ${formatCurrency(netWorth)}`);
  console.log('');
  
  // Use debug utility
  const breakdown = debugNetWorthCalculation(assets, bankAccounts, loans);
  
  // Calculate monthly income and expenses
  const monthlyIncome = incomes.reduce((sum, income) => {
    if (income.frequency === 'MONTHLY') return sum + income.amount;
    return sum;
  }, 0);
  
  const monthlyExpenses = 0; // No expenses provided
  const monthlyEMIs = loans.reduce((sum, loan) => sum + loan.emi, 0);
  
  // Debug forecast calculation
  console.log('===== TESTING FORECAST CALCULATION =====');
  const forecastDebug = debugForecastCalculation(
    netWorth,
    monthlyIncome,
    monthlyExpenses,
    monthlyEMIs,
    settings.defaultSavingsRate,
    settings.defaultInvestmentReturn,
    settings.defaultInflationRate,
    20
  );
  
  return {
    manualCalculation: {
      assetsTotal,
      bankAccountsTotal,
      totalAssets,
      liabilitiesTotal,
      netWorth
    },
    breakdownResult: breakdown,
    forecastResult: forecastDebug
  };
};

// Run the test
testNetWorthCalculation();
