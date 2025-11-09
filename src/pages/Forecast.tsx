import React, { useState, useEffect, useCallback } from 'react';
import { assetsRepository, incomeRepository, expensesRepository, loansRepository, bankAccountsRepository, settingsRepository } from '../lib/storage/localDB';
import { Asset, BankAccount } from '../lib/models';
import { formatCurrency } from '../lib/formatters/currency';
import { generateWealthProjection } from '../lib/calculations/finance';
import { listenToNavigationEvents } from '../lib/utils/navigation';
import { debugNetWorthCalculation, debugForecastCalculation } from '../lib/utils/debugUtils';

// Mock recharts import - in a real app, you'd use the actual Recharts library
const LineChart = ({ data, width, height, children }: any) => (
  <div className="h-64 w-full bg-gray-100 rounded flex items-center justify-center">
    <p className="text-gray-500">[Line Chart Placeholder - Install Recharts for real charts]</p>
  </div>
);

const XAxis = ({ dataKey }: any) => <></>;
const YAxis = () => <></>;
const Tooltip = () => <></>;
const Legend = () => <></>;
const Line = ({ type, dataKey, stroke, name }: any) => <></>;

interface ForecastSettings {
  years: number;
  savingsRate: number;
  inflationRate: number;
  investmentReturn: number;
}

const Forecast: React.FC = () => {
  const [netWorth, setNetWorth] = useState<number>(0);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(0);
  const [monthlyEMIs, setMonthlyEMIs] = useState<number>(0);
  const [projectionData, setProjectionData] = useState<Array<{ year: number; netWorth: number; netWorthAfterInflation: number }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [showRefreshMessage, setShowRefreshMessage] = useState<boolean>(false);

  // Settings for forecast
  const [settings, setSettings] = useState<ForecastSettings>({
    years: 20,
    savingsRate: 20, // Default 20%
    inflationRate: 6, // Default 6%
    investmentReturn: 12, // Default 12%
  });

  // Function to refresh data and recalculate
  const refreshData = useCallback(() => {
    setLoading(true);
    
    // Show refresh message when explicitly refreshed
    if (lastRefresh > 0) {
      setShowRefreshMessage(true);
      setTimeout(() => setShowRefreshMessage(false), 3000);
    }
    
    // We'll call this inside useEffect and from refresh button
    const loadData = () => {
      const fetchedAssets = assetsRepository.getAll();
      setAssets(fetchedAssets);
      
      const fetchedBankAccounts = bankAccountsRepository.getAll();
      setBankAccounts(fetchedBankAccounts);
      
      const loans = loansRepository.getAll();
      const incomes = incomeRepository.getAll();
      const expenses = expensesRepository.getAll();
      const appSettings = settingsRepository.getSettings();

      // Calculate net worth
      const assetsTotal = fetchedAssets.reduce((sum, asset) => sum + asset.currentValue, 0);
      
      // Only include bank accounts marked as assets
      const bankAccountsTotal = fetchedBankAccounts
        .filter(account => account.isAsset)
        .reduce((sum, account) => sum + account.balance, 0);
        
      const totalAssetsWithBankAccounts = assetsTotal + bankAccountsTotal;
      const liabilitiesTotal = loans.reduce((sum, loan) => sum + loan.principal, 0);
      const currentNetWorth = totalAssetsWithBankAccounts - liabilitiesTotal;
      
      // Debug net worth calculation
      console.log('DEBUG: Net Worth Calculation');
      debugNetWorthCalculation(fetchedAssets, fetchedBankAccounts, loans);
      
      // Calculate monthly income (considering all frequencies)
      const monthlyIncomeTotal = incomes.reduce((sum, income) => {
        let monthlyAmount = 0;
        
        switch(income.frequency) {
          case 'ONE_TIME':
            // Ignore one-time incomes in monthly calculation
            return sum;
          case 'WEEKLY':
            monthlyAmount = income.amount * 4.33; // Average weeks in a month
            break;
          case 'MONTHLY':
            monthlyAmount = income.amount;
            break;
          case 'QUARTERLY':
            monthlyAmount = income.amount / 3;
            break;
          case 'HALF_YEARLY':
            monthlyAmount = income.amount / 6;
            break;
          case 'YEARLY':
            monthlyAmount = income.amount / 12;
            break;
          default:
            monthlyAmount = 0;
        }
        
        return sum + monthlyAmount;
      }, 0);
      
      // Calculate monthly expenses (considering all frequencies)
      const monthlyExpensesTotal = expenses.reduce((sum, expense) => {
        let monthlyAmount = 0;
        
        switch(expense.frequency) {
          case 'ONE_TIME':
            // Ignore one-time expenses in monthly calculation
            return sum;
          case 'WEEKLY':
            monthlyAmount = expense.amount * 4.33; // Average weeks in a month
            break;
          case 'MONTHLY':
            monthlyAmount = expense.amount;
            break;
          case 'QUARTERLY':
            monthlyAmount = expense.amount / 3;
            break;
          case 'HALF_YEARLY':
            monthlyAmount = expense.amount / 6;
            break;
          case 'YEARLY':
            monthlyAmount = expense.amount / 12;
            break;
          default:
            monthlyAmount = 0;
        }
        
        return sum + monthlyAmount;
      }, 0);
      
      // Calculate monthly EMIs
      const monthlyEMIsTotal = loans.reduce((sum, loan) => sum + loan.emi, 0);

      // Set initial values from application settings
      setSettings({
        years: 20,
        savingsRate: appSettings.defaultSavingsRate,
        inflationRate: appSettings.defaultInflationRate,
        investmentReturn: appSettings.defaultInvestmentReturn
      });

      // Update state
      setNetWorth(currentNetWorth);
      setMonthlyIncome(monthlyIncomeTotal);
      setMonthlyExpenses(monthlyExpensesTotal);
      setMonthlyEMIs(monthlyEMIsTotal);
      
      // Debug forecast calculation
      console.log('DEBUG: Forecast Calculation');
      debugForecastCalculation(
        currentNetWorth,
        monthlyIncomeTotal,
        monthlyExpensesTotal,
        monthlyEMIsTotal,
        appSettings.defaultSavingsRate,
        appSettings.defaultInvestmentReturn,
        appSettings.defaultInflationRate,
        20
      );
      
      // Generate initial projection
      generateProjection(
        currentNetWorth,
        monthlyIncomeTotal,
        monthlyExpensesTotal,
        monthlyEMIsTotal,
        20,
        appSettings.defaultSavingsRate,
        appSettings.defaultInflationRate,
        appSettings.defaultInvestmentReturn
      );

      setLoading(false);
    };

    loadData();
  }, [lastRefresh]);
  
  // Listen for navigation events that should trigger refresh
  useEffect(() => {
    // Set up listener for navigation events
    const cleanup = listenToNavigationEvents((event: CustomEvent) => {
      const { source } = event.detail;
      
      // If event came from expenses, income, assets, or loans, refresh the forecast
      if (['expenses', 'income', 'assets', 'loans', 'bankAccounts'].includes(source)) {
        setLastRefresh(Date.now());
      }
    });
    
    return cleanup;
  }, []);
  
  // Load data and calculate initial projection
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Generate wealth projection data
  const generateProjection = (
    initialNetWorth: number,
    monthlyIncome: number,
    monthlyExpenses: number,
    monthlyEMIs: number,
    years: number,
    savingsRate: number,
    inflationRate: number,
    investmentReturn: number
  ) => {
    // Calculate monthly savings (either percentage of income or fixed amount)
    const availableIncome = monthlyIncome - monthlyExpenses - monthlyEMIs;
    const monthlySavings = (availableIncome > 0) ? (availableIncome * savingsRate / 100) : 0;
    const yearlySavings = monthlySavings * 12;
    
    // Generate projection
    const projection = generateWealthProjection(initialNetWorth, yearlySavings, investmentReturn, years);
    
    // Add inflation-adjusted values
    const projectionWithInflation = projection.map(year => {
      const inflationFactor = Math.pow(1 + inflationRate / 100, year.year);
      return {
        ...year,
        netWorthAfterInflation: year.netWorth / inflationFactor
      };
    });
    
    setProjectionData(projectionWithInflation);
  };

  // Handle settings changes
  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = parseFloat(value);
    
    if (!isNaN(numericValue)) {
      setSettings(prev => ({ ...prev, [name]: numericValue }));
    }
  };

  // Update projection when settings change
  useEffect(() => {
    if (!loading) {
      generateProjection(
        netWorth,
        monthlyIncome,
        monthlyExpenses,
        monthlyEMIs,
        settings.years,
        settings.savingsRate,
        settings.inflationRate,
        settings.investmentReturn
      );
    }
  }, [settings, loading, netWorth, monthlyIncome, monthlyExpenses, monthlyEMIs]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Wealth Forecast</h1>
          <button
            onClick={() => setLastRefresh(Date.now())}
            className="btn btn-secondary flex items-center space-x-1"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            <span>Refresh Data</span>
          </button>
        </div>
        
        {/* Refresh notification */}
        {showRefreshMessage && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-2 rounded">
            <p className="text-sm flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Data refreshed. Forecast has been updated with the latest financial data.
            </p>
          </div>
        )}
      </div>
      
      {/* Settings Card */}
      <div className="card mb-6">
        <h2 className="text-lg font-medium mb-4">Forecast Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label htmlFor="years" className="form-label">Forecast Years</label>
            <input
              type="number"
              id="years"
              name="years"
              value={settings.years}
              onChange={handleSettingsChange}
              min="1"
              max="40"
              className="form-input"
            />
          </div>
          <div>
            <label htmlFor="savingsRate" className="form-label">Savings Rate (%)</label>
            <input
              type="number"
              id="savingsRate"
              name="savingsRate"
              value={settings.savingsRate}
              onChange={handleSettingsChange}
              min="0"
              max="100"
              className="form-input"
            />
          </div>
          <div>
            <label htmlFor="inflationRate" className="form-label">Inflation Rate (%)</label>
            <input
              type="number"
              id="inflationRate"
              name="inflationRate"
              value={settings.inflationRate}
              onChange={handleSettingsChange}
              min="0"
              max="20"
              step="0.1"
              className="form-input"
            />
          </div>
          <div>
            <label htmlFor="investmentReturn" className="form-label">Investment Return (%)</label>
            <input
              type="number"
              id="investmentReturn"
              name="investmentReturn"
              value={settings.investmentReturn}
              onChange={handleSettingsChange}
              min="-10"
              max="30"
              step="0.1"
              className="form-input"
            />
          </div>
        </div>
      </div>
      
      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <h3 className="text-base font-medium mb-2">Current Net Worth</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(netWorth)}</p>
          <div className="text-xs text-gray-500 mt-1">
            Assets: {formatCurrency(assets.reduce((sum, asset) => sum + asset.currentValue, 0))}
            <br />
            Bank Accounts: {formatCurrency(bankAccounts.filter(acc => acc.isAsset).reduce((sum, acc) => sum + acc.balance, 0))}
          </div>
        </div>
        <div className="card">
          <h3 className="text-base font-medium mb-2">Monthly Savings</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(Math.max(0, (monthlyIncome - monthlyExpenses - monthlyEMIs) * settings.savingsRate / 100))}
          </p>
          <p className="text-xs text-gray-500">
            {settings.savingsRate}% of available income ({formatCurrency(Math.max(0, monthlyIncome - monthlyExpenses - monthlyEMIs))})
          </p>
        </div>
        <div className="card">
          <h3 className="text-base font-medium mb-2">Projected Net Worth in {settings.years} years</h3>
          <p className="text-2xl font-bold text-indigo-600">
            {formatCurrency(projectionData[projectionData.length - 1]?.netWorth || 0)}
          </p>
          <p className="text-xs text-gray-500">
            {formatCurrency(projectionData[projectionData.length - 1]?.netWorthAfterInflation || 0)} after inflation
          </p>
        </div>
      </div>
      
      {/* Chart */}
      <div className="card">
        <h2 className="text-lg font-medium mb-4">Wealth Growth Projection</h2>
        <div className="mb-6">
          <LineChart
            width={800}
            height={400}
            data={projectionData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="netWorth" stroke="#4F46E5" name="Net Worth" />
            <Line type="monotone" dataKey="netWorthAfterInflation" stroke="#10B981" name="Inflation Adjusted" />
          </LineChart>
        </div>
        
        {/* Projection Table */}
        <div className="table-container max-h-96 overflow-y-auto">
          <table className="table">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Worth</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">After Inflation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year-on-Year Growth</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projectionData.map((year, index) => (
                <tr key={year.year} className={index % 5 === 0 ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-2 whitespace-nowrap text-sm">
                    {year.year === 0 ? 'Now' : `Year ${year.year}`}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm font-medium">
                    {formatCurrency(year.netWorth)}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm">
                    {formatCurrency(year.netWorthAfterInflation)}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm">
                    {index > 0 
                      ? <span className={year.netWorth > projectionData[index - 1].netWorth ? 'text-green-600' : 'text-red-600'}>
                          {((year.netWorth / projectionData[index - 1].netWorth - 1) * 100).toFixed(1)}%
                        </span>
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      <div className="card mt-6">
        <h2 className="text-lg font-medium mb-2">Notes About This Forecast</h2>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
          <li>This is a simplified projection based on your current financial data and assumptions.</li>
          <li>Monthly expenses directly impact your savings potential: Available for saving = Income - Expenses - EMIs.</li>
          <li>Your savings rate (30%) is applied to your available income to calculate monthly contributions.</li>
          <li>The forecast assumes consistent savings rate (30%), inflation (7%), and investment returns (20%) over time.</li>
          <li>Inflation-adjusted values show purchasing power in today's money.</li>
          <li>Future loans, income changes, and major life events are not factored in.</li>
          <li>For a more detailed financial plan, consider consulting a financial advisor.</li>
        </ul>
      </div>
    </div>
  );
};

export default Forecast;
