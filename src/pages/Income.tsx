import React, { useState, useEffect } from 'react';
import { incomeRepository, bankAccountsRepository } from '../lib/storage/localDB';
import { Income, IncomeCategoryType, FrequencyType, BankAccount } from '../lib/models';
import { formatCurrency } from '../lib/formatters/currency';
import { updateBankAccountBalance } from '../lib/utils/bankAccountUtils';
import { createNavigationEvent } from '../lib/utils/navigation';

// Income form interface
interface IncomeFormData {
  name: string;
  category: IncomeCategoryType;
  amount: string;
  frequency: FrequencyType;
  bankAccountId: string;
  startDate: string;
  endDate: string;
  notes: string;
}

// Empty form initial values
const emptyForm: IncomeFormData = {
  name: '',
  category: 'SALARY',
  amount: '',
  frequency: 'MONTHLY',
  bankAccountId: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  notes: ''
};

// Category display names
const categoryNames: Record<IncomeCategoryType, string> = {
  SALARY: 'Salary',
  BUSINESS: 'Business',
  RENTAL: 'Rental',
  INVESTMENT: 'Investment',
  DIVIDEND: 'Dividend',
  INTEREST: 'Interest',
  OTHER: 'Other'
};

// Frequency display names
const frequencyNames: Record<FrequencyType, string> = {
  ONE_TIME: 'One Time',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  HALF_YEARLY: 'Half Yearly',
  YEARLY: 'Yearly'
};

const IncomePage: React.FC = () => {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  // No longer using linkedAssets
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [currentIncome, setCurrentIncome] = useState<Income | null>(null);
  const [formData, setFormData] = useState<IncomeFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof IncomeFormData, string>>>({});

  // Load incomes, bank accounts, and savings assets
  useEffect(() => {
    const loadData = () => {
      const allIncomes = incomeRepository.getAll();
      setIncomes(allIncomes);
      
      const allBankAccounts = bankAccountsRepository.getAll();
      setBankAccounts(allBankAccounts);
      
      // No longer need to track assets
    };

    loadData();
  }, []);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name as keyof IncomeFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof IncomeFormData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.amount || isNaN(parseFloat(formData.amount))) {
      newErrors.amount = 'Valid amount is required';
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be positive';
    }
    
    if (formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      // Prepare income data object
      const incomeData = {
        name: formData.name,
        category: formData.category,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        bankAccountId: formData.bankAccountId || undefined,
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        notes: formData.notes
      };
      
      // Calculate amount change for bank account update
      let amountToAdd = parseFloat(formData.amount);
      
      if (currentIncome) {
        // Update existing income
        const updatedIncome = incomeRepository.update(currentIncome.id, incomeData);
        
        if (updatedIncome) {
          setIncomes(incomes.map(income => income.id === updatedIncome.id ? updatedIncome : income));
          
          // If bank account changed, remove amount from old account and add to new one
          if (currentIncome.bankAccountId && currentIncome.bankAccountId !== formData.bankAccountId) {
            // Remove from old account
            updateBankAccountBalance(currentIncome.bankAccountId, -currentIncome.amount);
          }
        }
      } else {
        // Create new income
        const newIncome = incomeRepository.add(incomeData);
        setIncomes([...incomes, newIncome]);
      }
      
      // If bank account selected, update its balance
      if (formData.bankAccountId) {
        // For recurring income, we only update bank balance once (not for every future occurrence)
        const updatedBankAccount = updateBankAccountBalance(formData.bankAccountId, amountToAdd);
        
        // Update UI if the bank account was updated
        if (updatedBankAccount) {
          setBankAccounts(prevAccounts => {
            return prevAccounts.map(acc => 
              acc.id === updatedBankAccount.id ? updatedBankAccount : acc
            );
          });
        }
      }
      
      // Reset form
      setFormData(emptyForm);
      setCurrentIncome(null);
      setIsFormVisible(false);
      
      // Notify other components about the income change
      createNavigationEvent('income', { action: 'update' });
    } catch (error) {
      console.error('Error saving income:', error);
    }
  };

  // Edit income
  const handleEdit = (income: Income) => {
    setCurrentIncome(income);
    setFormData({
      name: income.name,
      category: income.category,
      amount: income.amount.toString(),
      frequency: income.frequency,
      bankAccountId: income.bankAccountId || '',
      startDate: new Date(income.startDate).toISOString().split('T')[0],
      endDate: income.endDate ? new Date(income.endDate).toISOString().split('T')[0] : '',
      notes: income.notes || ''
    });
    setIsFormVisible(true);
  };

  // Delete income
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this income?')) {
      const deleted = incomeRepository.delete(id);
      if (deleted) {
        setIncomes(incomes.filter(income => income.id !== id));
        
        // Notify other components about the income deletion
        createNavigationEvent('income', { action: 'delete' });
      }
    }
  };

  // Calculate total monthly income (simplified approach)
  const calculateMonthlyIncome = () => {
    return incomes.reduce((total, income) => {
      let monthlyAmount = 0;
      
      switch(income.frequency) {
        case 'ONE_TIME':
          // Ignore one-time incomes in monthly calculation
          return total;
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
      
      return total + monthlyAmount;
    }, 0);
  };

  const totalMonthlyIncome = calculateMonthlyIncome();

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Income</h1>
        <button
          onClick={() => {
            setFormData(emptyForm);
            setCurrentIncome(null);
            setIsFormVisible(!isFormVisible);
          }}
          className="btn btn-primary"
        >
          {isFormVisible ? 'Cancel' : 'Add Income'}
        </button>
      </div>

      {/* Summary Card */}
      <div className="card mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium">Total Monthly Income</h2>
          <span className="text-2xl font-bold text-green-600">{formatCurrency(totalMonthlyIncome)}</span>
        </div>
      </div>

      {/* Income Form */}
      {isFormVisible && (
        <div className="card mb-6">
          <h2 className="text-lg font-medium mb-4">{currentIncome ? 'Edit Income' : 'Add New Income'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Name */}
              <div>
                <label htmlFor="name" className="form-label">Income Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="e.g., Monthly Salary, Rent from Property"
                />
                {errors.name && <p className="form-error">{errors.name}</p>}
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="form-label">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  {Object.entries(categoryNames).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label htmlFor="amount" className="form-label">Amount (₹)</label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className={`form-input ${errors.amount ? 'border-red-500' : ''}`}
                  placeholder="e.g., 50000"
                />
                {errors.amount && <p className="form-error">{errors.amount}</p>}
              </div>

              {/* Frequency */}
              <div>
                <label htmlFor="frequency" className="form-label">Frequency</label>
                <select
                  id="frequency"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  {Object.entries(frequencyNames).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              
              {/* Bank Account */}
              <div>
                <label htmlFor="bankAccountId" className="form-label">Bank Account</label>
                <select
                  id="bankAccountId"
                  name="bankAccountId"
                  value={formData.bankAccountId}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="">-- Select Bank Account --</option>
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - {account.accountNumber.slice(-4)}
                    </option>
                  ))}
                </select>
                {bankAccounts.length === 0 && (
                  <p className="text-yellow-600 text-sm mt-1">
                    No bank accounts added. <a href="/bank-accounts" className="text-blue-600 hover:underline">Add a bank account</a>
                  </p>
                )}
              </div>

              {/* Start Date */}
              <div>
                <label htmlFor="startDate" className="form-label">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              {/* End Date (Optional) */}
              <div>
                <label htmlFor="endDate" className="form-label">End Date (Optional)</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className={`form-input ${errors.endDate ? 'border-red-500' : ''}`}
                />
                {errors.endDate && <p className="form-error">{errors.endDate}</p>}
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
                  placeholder="Any additional details about this income"
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
                {currentIncome ? 'Update Income' : 'Add Income'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Income List */}
      {incomes.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">You haven't added any income sources yet.</p>
          <button
            onClick={() => setIsFormVisible(true)}
            className="btn btn-primary"
          >
            Add Your First Income
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {incomes.map(income => (
                  <tr key={income.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{income.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span>{categoryNames[income.category]}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">{formatCurrency(income.amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span>{frequencyNames[income.frequency]}</span>
                      {income.bankAccountId && (
                        <div className="text-xs text-gray-500 mt-1">
                          {bankAccounts.find(acc => acc.id === income.bankAccountId)?.name || 'Unknown Bank'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        Start: {new Date(income.startDate).toLocaleDateString()}
                      </div>
                      {income.endDate && (
                        <div className="text-xs text-gray-500">
                          End: {new Date(income.endDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(income)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(income.id)}
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

export default IncomePage;
