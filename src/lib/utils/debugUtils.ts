/**
 * Utility functions for debugging financial calculations
 */

import { Asset, BankAccount, Loan } from '../models';
import { formatCurrency } from '../formatters/currency';

/**
 * Debug function to log detailed net worth calculation
 * 
 * @param assets - Array of assets
 * @param bankAccounts - Array of bank accounts
 * @param loans - Array of loans
 * @returns Object with detailed breakdown of net worth calculation
 */
export const debugNetWorthCalculation = (
  assets: Asset[],
  bankAccounts: BankAccount[],
  loans: Loan[]
) => {
  // Calculate assets total
  const assetsTotal = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
  
  // Calculate bank accounts total (only those marked as assets)
  const assetBankAccounts = bankAccounts.filter(account => account.isAsset);
  const bankAccountsTotal = assetBankAccounts.reduce((sum, account) => sum + account.balance, 0);
  
  // Calculate liabilities total
  const liabilitiesTotal = loans.reduce((sum, loan) => sum + loan.principal, 0);
  
  // Calculate net worth
  const totalAssets = assetsTotal + bankAccountsTotal;
  const netWorth = totalAssets - liabilitiesTotal;
  
  // Create detailed breakdown
  const breakdown = {
    assets: {
      total: assetsTotal,
      formatted: formatCurrency(assetsTotal),
      details: assets.map(asset => ({
        name: asset.name,
        category: asset.category,
        value: asset.currentValue,
        formatted: formatCurrency(asset.currentValue)
      }))
    },
    bankAccounts: {
      total: bankAccountsTotal,
      formatted: formatCurrency(bankAccountsTotal),
      details: assetBankAccounts.map(account => ({
        name: account.name,
        accountType: account.accountType,
        isAsset: account.isAsset,
        balance: account.balance,
        formatted: formatCurrency(account.balance)
      }))
    },
    liabilities: {
      total: liabilitiesTotal,
      formatted: formatCurrency(liabilitiesTotal),
      details: loans.map(loan => ({
        name: loan.name,
        type: loan.type,
        principal: loan.principal,
        formatted: formatCurrency(loan.principal)
      }))
    },
    summary: {
      totalAssets: totalAssets,
      totalAssetsFormatted: formatCurrency(totalAssets),
      totalLiabilities: liabilitiesTotal,
      totalLiabilitiesFormatted: formatCurrency(liabilitiesTotal),
      netWorth: netWorth,
      netWorthFormatted: formatCurrency(netWorth)
    }
  };
  
  // Log the breakdown
  console.log('=== NET WORTH CALCULATION DEBUG ===');
  console.log(`Assets Total: ${breakdown.assets.formatted}`);
  console.log(`Bank Accounts Total: ${breakdown.bankAccounts.formatted}`);
  console.log(`Liabilities Total: ${breakdown.liabilities.formatted}`);
  console.log(`Net Worth: ${breakdown.summary.netWorthFormatted}`);
  console.log('=== DETAILED BREAKDOWN ===');
  console.log(breakdown);
  
  return breakdown;
};

/**
 * Debug function to log detailed forecast calculation
 * 
 * @param initialNetWorth - Starting net worth
 * @param monthlyIncome - Total monthly income
 * @param monthlyExpenses - Total monthly expenses
 * @param monthlyEMIs - Total monthly EMIs
 * @param savingsRate - Savings rate percentage
 * @param investmentReturn - Annual investment return percentage
 * @param inflationRate - Annual inflation rate percentage
 * @param years - Number of years for projection
 */
export const debugForecastCalculation = (
  initialNetWorth: number,
  monthlyIncome: number,
  monthlyExpenses: number,
  monthlyEMIs: number,
  savingsRate: number,
  investmentReturn: number,
  inflationRate: number,
  years: number
) => {
  // Calculate available income and savings
  const availableIncome = monthlyIncome - monthlyExpenses - monthlyEMIs;
  const monthlySavings = (availableIncome > 0) ? (availableIncome * savingsRate / 100) : 0;
  const yearlySavings = monthlySavings * 12;
  
  // Project first few years manually for debugging
  let netWorth = initialNetWorth;
  const projection = [];
  
  for (let year = 0; year <= Math.min(5, years); year++) {
    projection.push({
      year,
      netWorth: Math.round(netWorth * 100) / 100,
      netWorthFormatted: formatCurrency(netWorth),
      yearlyGrowth: year > 0 ? Math.round(netWorth * investmentReturn / 100) : 0,
      yearlySavings: year > 0 ? yearlySavings : 0,
    });
    
    // Calculate next year's net worth
    if (year < years) {
      netWorth = netWorth * (1 + investmentReturn / 100) + yearlySavings;
    }
  }
  
  // Log the breakdown
  console.log('=== FORECAST CALCULATION DEBUG ===');
  console.log(`Initial Net Worth: ${formatCurrency(initialNetWorth)}`);
  console.log(`Monthly Income: ${formatCurrency(monthlyIncome)}`);
  console.log(`Monthly Expenses: ${formatCurrency(monthlyExpenses)}`);
  console.log(`Monthly EMIs: ${formatCurrency(monthlyEMIs)}`);
  console.log(`Available Monthly Income: ${formatCurrency(availableIncome)}`);
  console.log(`Monthly Savings (${savingsRate}%): ${formatCurrency(monthlySavings)}`);
  console.log(`Yearly Savings: ${formatCurrency(yearlySavings)}`);
  console.log(`Investment Return: ${investmentReturn}%`);
  console.log(`Inflation Rate: ${inflationRate}%`);
  console.log('=== PROJECTION (First 5 years) ===');
  console.table(projection);
  
  return {
    initialNetWorth,
    monthlyIncome,
    monthlyExpenses,
    monthlyEMIs,
    availableIncome,
    monthlySavings,
    yearlySavings,
    savingsRate,
    investmentReturn,
    inflationRate,
    projection
  };
};
