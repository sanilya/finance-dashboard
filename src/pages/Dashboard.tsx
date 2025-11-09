import React, { useState, useEffect } from 'react';
import { assetsRepository, incomeRepository, expensesRepository, loansRepository, bankAccountsRepository } from '../lib/storage/localDB';
import { BankAccount } from '../lib/models';
import { formatCurrency } from '../lib/formatters/currency';
import BankAccountAssetView from '../components/BankAccountAssetView';
import { debugNetWorthCalculation } from '../lib/utils/debugUtils';

const Dashboard: React.FC = () => {
  const [netWorth, setNetWorth] = useState<number>(0);
  const [totalAssets, setTotalAssets] = useState<number>(0);
  const [totalLiabilities, setTotalLiabilities] = useState<number>(0);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [assetsTotal, setAssetsTotal] = useState(0);
  const [bankAccountsTotal, setBankAccountsTotal] = useState(0);
  
  useEffect(() => {
    const calculateDashboardData = () => {
      // Get all data
      const fetchedAssets = assetsRepository.getAll();
      
      const fetchedBankAccounts = bankAccountsRepository.getAll();
      setBankAccounts(fetchedBankAccounts);
      
      const loans = loansRepository.getAll();
      const incomes = incomeRepository.getAll();
      const expenses = expensesRepository.getAll();

      // Calculate totals
      const calculatedAssetsTotal = fetchedAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
      setAssetsTotal(calculatedAssetsTotal);
      
      // Only include bank accounts marked as assets
      const calculatedBankAccountsTotal = fetchedBankAccounts
        .filter(account => account.isAsset)
        .reduce((sum, account) => sum + account.balance, 0);
      setBankAccountsTotal(calculatedBankAccountsTotal);
        
      const totalAssetsWithBankAccounts = calculatedAssetsTotal + calculatedBankAccountsTotal;
      const liabilitiesTotal = loans.reduce((sum, loan) => sum + loan.principal, 0);
      
      // Calculate monthly income (simplified - only considering monthly frequency)
      const monthlyIncomeTotal = incomes
        .filter(income => income.frequency === 'MONTHLY')
        .reduce((sum, income) => sum + income.amount, 0);
      
      // Calculate monthly expenses (simplified - only considering monthly frequency)
      const monthlyExpensesTotal = expenses
        .filter(expense => expense.frequency === 'MONTHLY')
        .reduce((sum, expense) => sum + expense.amount, 0);

      // Debug net worth calculation
      console.log('Dashboard - Debug Net Worth Calculation:');
      debugNetWorthCalculation(fetchedAssets, fetchedBankAccounts, loans);
      
      // Update state
      setTotalAssets(totalAssetsWithBankAccounts);
      setTotalLiabilities(liabilitiesTotal);
      setNetWorth(totalAssetsWithBankAccounts - liabilitiesTotal);
      setMonthlyIncome(monthlyIncomeTotal);
      setMonthlyExpenses(monthlyExpensesTotal);
      setLoading(false);
    };

    calculateDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {/* Net Worth Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-700">Net Worth</h2>
          <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(netWorth)}</p>
          <div className="flex justify-between mt-4 text-sm">
            <div>
              <p className="text-gray-500">Assets</p>
              <p className="font-medium text-green-600">{formatCurrency(totalAssets)}</p>
            </div>
            <div>
              <p className="text-gray-500">Liabilities</p>
              <p className="font-medium text-red-600">{formatCurrency(totalLiabilities)}</p>
            </div>
          </div>
        </div>
        
        {/* Monthly Cash Flow Card */}
        <div className="card bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-700">Monthly Cash Flow</h2>
          <p className={`text-3xl font-bold mt-2 ${monthlyIncome - monthlyExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(monthlyIncome - monthlyExpenses)}
          </p>
          <div className="flex justify-between mt-4 text-sm">
            <div>
              <p className="text-gray-500">Income</p>
              <p className="font-medium text-green-600">{formatCurrency(monthlyIncome)}</p>
            </div>
            <div>
              <p className="text-gray-500">Expenses</p>
              <p className="font-medium text-red-600">{formatCurrency(monthlyExpenses)}</p>
            </div>
          </div>
        </div>
        
        {/* Savings Rate Card */}
        <div className="card bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-700">Savings Rate</h2>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {monthlyIncome > 0 ? `${Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100)}%` : '0%'}
          </p>
          <p className="text-sm text-gray-500 mt-4">
            {monthlyIncome - monthlyExpenses > 0 
              ? 'Great job! Keep saving consistently for your goals.' 
              : 'Aim to increase your savings rate to build wealth faster.'}
          </p>
        </div>
      </div>
      
      {/* Quick Summary */}
      <div className="grid grid-cols-1 gap-6">
        <div className="card bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-700 mb-4">Quick Summary</h2>
          
          {/* Bank Accounts Summary */}
          {bankAccounts && bankAccounts.length > 0 && (
            <div className="mb-4">
              <h3 className="text-md font-medium mb-2">Bank Accounts</h3>
              <BankAccountAssetView bankAccounts={bankAccounts} showInAssetList={false} />
            </div>
          )}
          
          {/* Empty state */}
          {totalAssets === 0 && totalLiabilities === 0 && (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">You haven't added any financial data yet.</p>
              <div className="flex justify-center space-x-4">
                <a href="/assets" className="btn btn-primary">Add Assets</a>
                <a href="/income" className="btn btn-secondary">Add Income</a>
              </div>
            </div>
          )}
          
          {/* Summary content */}
          {(totalAssets > 0 || totalLiabilities > 0) && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                You currently have {formatCurrency(totalAssets)} in assets ({formatCurrency(assetsTotal)} in regular assets and {formatCurrency(bankAccountsTotal)} in bank accounts) and {formatCurrency(totalLiabilities)} in liabilities.
              </p>
              <p className="text-sm text-gray-600">
                Your monthly cash flow is {formatCurrency(monthlyIncome - monthlyExpenses)}, with {formatCurrency(monthlyIncome)} in income and {formatCurrency(monthlyExpenses)} in expenses.
              </p>
              <div className="flex justify-end">
                <a href="/forecast" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                  View Wealth Forecast →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
