import React from 'react';
import { BankAccount } from '../lib/models';
import { formatCurrency } from '../lib/formatters/currency';
import { calculateBankAccountGrowth } from '../lib/utils/bankAccountUtils';

interface BankAccountAssetViewProps {
  bankAccounts: BankAccount[];
  showInAssetList?: boolean;
}

// Bank Account Type display names
const bankAccountTypeNames: Record<string, string> = {
  SAVINGS: 'Savings Account',
  CURRENT: 'Current Account',
  SALARY: 'Salary Account',
  FIXED_DEPOSIT: 'Fixed Deposit',
  RECURRING_DEPOSIT: 'Recurring Deposit',
  NRE: 'NRE Account',
  NRO: 'NRO Account',
  OTHER: 'Other'
};

const BankAccountAssetView: React.FC<BankAccountAssetViewProps> = ({ 
  bankAccounts,
  showInAssetList = true
}) => {
  // Filter accounts that should be treated as assets
  const assetAccounts = bankAccounts.filter(account => account.isAsset);
  
  if (assetAccounts.length === 0 || !showInAssetList) {
    return null;
  }
  
  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-4">Bank Accounts</h3>
      <div className="table-container">
        <table className="table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Balance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">1Y Projection</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assetAccounts.map(account => (
              <tr key={account.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{account.name}</div>
                  <div className="text-xs text-gray-500">{account.accountNumber.slice(-4)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span>{bankAccountTypeNames[account.accountType]}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-blue-600">{formatCurrency(account.balance)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span>{account.interestRate || 0}%</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(calculateBankAccountGrowth(account, 1))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BankAccountAssetView;
