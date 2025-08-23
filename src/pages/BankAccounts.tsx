import React, { useState, useEffect } from 'react';
import { bankAccountsRepository } from '../lib/storage/localDB';
import { BankAccount, BankAccountTypeType } from '../lib/models';
import { formatCurrency } from '../lib/formatters/currency';
// No need for syncBankAccountToAsset anymore

// Bank Account form interface
interface BankAccountFormData {
  name: string;
  accountNumber: string;
  accountType: BankAccountTypeType;
  balance: string;
  interestRate: string;
  isAsset: boolean;
  notes: string;
}

// Empty form initial values
const emptyForm: BankAccountFormData = {
  name: '',
  accountNumber: '',
  accountType: 'SAVINGS',
  balance: '0',
  interestRate: '0',
  isAsset: true,
  notes: ''
};

// Bank Account Type display names
const bankAccountTypeNames: Record<BankAccountTypeType, string> = {
  SAVINGS: 'Savings Account',
  CURRENT: 'Current Account',
  SALARY: 'Salary Account',
  FIXED_DEPOSIT: 'Fixed Deposit',
  RECURRING_DEPOSIT: 'Recurring Deposit',
  NRE: 'NRE Account',
  NRO: 'NRO Account',
  OTHER: 'Other'
};

const BankAccountsPage: React.FC = () => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  // No longer using linkedAssets
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [currentBankAccount, setCurrentBankAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState<BankAccountFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof BankAccountFormData, string>>>({});

  // Load bank accounts and savings account assets
  useEffect(() => {
    const loadData = () => {
      const allBankAccounts = bankAccountsRepository.getAll();
      setBankAccounts(allBankAccounts);
      
      // No longer need to load assets as they're handled separately
    };

    loadData();
  }, []);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name as keyof BankAccountFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BankAccountFormData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Bank name is required';
    }
    
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    }
    
    if (!formData.balance || isNaN(parseFloat(formData.balance))) {
      newErrors.balance = 'Valid balance is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      // Prepare bank account data object
      const bankAccountData = {
        name: formData.name,
        accountNumber: formData.accountNumber,
        accountType: formData.accountType,
        balance: parseFloat(formData.balance),
        interestRate: parseFloat(formData.interestRate),
        isAsset: formData.isAsset,
        notes: formData.notes
      };
      
      if (currentBankAccount) {
        // Update existing bank account
        const updatedBankAccount = bankAccountsRepository.update(currentBankAccount.id, bankAccountData);
        
                  if (updatedBankAccount) {
          setBankAccounts(bankAccounts.map(account => account.id === updatedBankAccount.id ? updatedBankAccount : account));
        }
      } else {
        // Create new bank account
        const newBankAccount = bankAccountsRepository.add(bankAccountData);
        setBankAccounts([...bankAccounts, newBankAccount]);
      }
      
      // Reset form
      setFormData(emptyForm);
      setCurrentBankAccount(null);
      setIsFormVisible(false);
    } catch (error) {
      console.error('Error saving bank account:', error);
    }
  };

  // Edit bank account
  const handleEdit = (bankAccount: BankAccount) => {
    setCurrentBankAccount(bankAccount);
    setFormData({
      name: bankAccount.name,
      accountNumber: bankAccount.accountNumber,
      accountType: bankAccount.accountType,
      balance: bankAccount.balance.toString(),
      interestRate: (bankAccount.interestRate || 0).toString(),
      isAsset: bankAccount.isAsset !== false, // Default to true if undefined
      notes: bankAccount.notes || ''
    });
    setIsFormVisible(true);
  };

  // Delete bank account
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this bank account?')) {
      const deleted = bankAccountsRepository.delete(id);
      if (deleted) {
        setBankAccounts(bankAccounts.filter(account => account.id !== id));
      }
    }
  };

  // Calculate total bank balance
  const totalBalance = bankAccounts.reduce((total, account) => total + account.balance, 0);

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Bank Accounts</h1>
        <button
          onClick={() => {
            setFormData(emptyForm);
            setCurrentBankAccount(null);
            setIsFormVisible(!isFormVisible);
          }}
          className="btn btn-primary"
        >
          {isFormVisible ? 'Cancel' : 'Add Bank Account'}
        </button>
      </div>

      {/* Summary Card */}
      <div className="card mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium">Total Bank Balance</h2>
          <span className="text-2xl font-bold text-blue-600">{formatCurrency(totalBalance)}</span>
        </div>
      </div>

      {/* Bank Account Form */}
      {isFormVisible && (
        <div className="card mb-6">
          <h2 className="text-lg font-medium mb-4">{currentBankAccount ? 'Edit Bank Account' : 'Add New Bank Account'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Bank Name */}
              <div>
                <label htmlFor="name" className="form-label">Bank Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="e.g., HDFC Bank, SBI"
                />
                {errors.name && <p className="form-error">{errors.name}</p>}
              </div>

              {/* Account Number */}
              <div>
                <label htmlFor="accountNumber" className="form-label">Account Number</label>
                <input
                  type="text"
                  id="accountNumber"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleInputChange}
                  className={`form-input ${errors.accountNumber ? 'border-red-500' : ''}`}
                  placeholder="e.g., XXXX XXXX XXXX"
                />
                {errors.accountNumber && <p className="form-error">{errors.accountNumber}</p>}
              </div>

              {/* Account Type */}
              <div>
                <label htmlFor="accountType" className="form-label">Account Type</label>
                <select
                  id="accountType"
                  name="accountType"
                  value={formData.accountType}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  {Object.entries(bankAccountTypeNames).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Balance */}
              <div>
                <label htmlFor="balance" className="form-label">Current Balance (₹)</label>
                <input
                  type="number"
                  id="balance"
                  name="balance"
                  value={formData.balance}
                  onChange={handleInputChange}
                  className={`form-input ${errors.balance ? 'border-red-500' : ''}`}
                  placeholder="e.g., 10000"
                />
                {errors.balance && <p className="form-error">{errors.balance}</p>}
              </div>
              
              {/* Interest Rate */}
              <div>
                <label htmlFor="interestRate" className="form-label">Annual Interest Rate (%)</label>
                <input
                  type="number"
                  id="interestRate"
                  name="interestRate"
                  value={formData.interestRate}
                  onChange={handleInputChange}
                  min="0"
                  max="15"
                  step="0.1"
                  className="form-input"
                  placeholder="e.g., 4.5"
                />
              </div>
              
              {/* Include as Asset */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAsset"
                  name="isAsset"
                  checked={formData.isAsset}
                  onChange={(e) => setFormData(prev => ({ ...prev, isAsset: e.target.checked }))}
                  className="mr-2 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label htmlFor="isAsset" className="form-label mb-0">Include in Net Worth calculation</label>
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label htmlFor="notes" className="form-label">Notes (Optional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="form-input"
                  rows={3}
                  placeholder="Any additional details about this bank account"
                ></textarea>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsFormVisible(false)}
                className="btn btn-secondary mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                {currentBankAccount ? 'Update Bank Account' : 'Add Bank Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bank Account List */}
      {bankAccounts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">You haven't added any bank accounts yet.</p>
          <button
            onClick={() => setIsFormVisible(true)}
            className="btn btn-primary"
          >
            Add Your First Bank Account
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bankAccounts.map(account => (
                  <tr key={account.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{account.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span>{account.accountNumber}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span>{bankAccountTypeNames[account.accountType]}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">{formatCurrency(account.balance)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(account)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankAccountsPage;
