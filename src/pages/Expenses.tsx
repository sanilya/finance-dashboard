import React, { useState, useEffect } from 'react';
import { expensesRepository } from '../lib/storage/localDB';
import { Expense, ExpenseCategoryType, FrequencyType } from '../lib/models';
import { formatCurrency } from '../lib/formatters/currency';
import { createNavigationEvent } from '../lib/utils/navigation';

// Expense form interface
interface ExpenseFormData {
  name: string;
  category: ExpenseCategoryType;
  amount: string;
  frequency: FrequencyType;
  startDate: string;
  endDate: string;
  notes: string;
}

// Empty form initial values
const emptyForm: ExpenseFormData = {
  name: '',
  category: 'HOUSING',
  amount: '',
  frequency: 'MONTHLY',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  notes: ''
};

// Category display names
const categoryNames: Record<ExpenseCategoryType, string> = {
  HOUSING: 'Housing',
  TRANSPORTATION: 'Transportation',
  FOOD: 'Food',
  UTILITIES: 'Utilities',
  INSURANCE: 'Insurance',
  HEALTHCARE: 'Healthcare',
  ENTERTAINMENT: 'Entertainment',
  EDUCATION: 'Education',
  PERSONAL: 'Personal',
  DEBT: 'Debt',
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

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseFormData, string>>>({});

  // Load expenses
  useEffect(() => {
    const loadExpenses = () => {
      const allExpenses = expensesRepository.getAll();
      setExpenses(allExpenses);
    };

    loadExpenses();
  }, []);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name as keyof ExpenseFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ExpenseFormData, string>> = {};
    
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
      // Prepare expense data object
      const expenseData = {
        name: formData.name,
        category: formData.category,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        notes: formData.notes
      };
      
      if (currentExpense) {
        // Update existing expense
        const updatedExpense = expensesRepository.update(currentExpense.id, expenseData);
        
        if (updatedExpense) {
          setExpenses(expenses.map(expense => expense.id === updatedExpense.id ? updatedExpense : expense));
        }
      } else {
        // Create new expense
        const newExpense = expensesRepository.add(expenseData);
        setExpenses([...expenses, newExpense]);
      }
      
      // Reset form
      setFormData(emptyForm);
      setCurrentExpense(null);
      setIsFormVisible(false);
      
      // Notify other components about the expense change
      createNavigationEvent('expenses', { action: 'update' });
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  // Edit expense
  const handleEdit = (expense: Expense) => {
    setCurrentExpense(expense);
    setFormData({
      name: expense.name,
      category: expense.category,
      amount: expense.amount.toString(),
      frequency: expense.frequency,
      startDate: new Date(expense.startDate).toISOString().split('T')[0],
      endDate: expense.endDate ? new Date(expense.endDate).toISOString().split('T')[0] : '',
      notes: expense.notes || ''
    });
    setIsFormVisible(true);
  };

  // Delete expense
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      const deleted = expensesRepository.delete(id);
      if (deleted) {
        setExpenses(expenses.filter(expense => expense.id !== id));
        
        // Notify other components about the expense change
        createNavigationEvent('expenses', { action: 'delete' });
      }
    }
  };

  // Calculate total monthly expenses (simplified approach)
  const calculateMonthlyExpenses = () => {
    return expenses.reduce((total, expense) => {
      let monthlyAmount = 0;
      
      switch(expense.frequency) {
        case 'ONE_TIME':
          // Ignore one-time expenses in monthly calculation
          return total;
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
      
      return total + monthlyAmount;
    }, 0);
  };

  // Calculate expenses by category
  const calculateExpensesByCategory = () => {
    const categoryTotals: Record<ExpenseCategoryType, number> = {
      HOUSING: 0,
      TRANSPORTATION: 0,
      FOOD: 0,
      UTILITIES: 0,
      INSURANCE: 0,
      HEALTHCARE: 0,
      ENTERTAINMENT: 0,
      EDUCATION: 0,
      PERSONAL: 0,
      DEBT: 0,
      OTHER: 0
    };
    
    expenses.forEach(expense => {
      if (expense.frequency === 'MONTHLY') {
        categoryTotals[expense.category] += expense.amount;
      } else if (expense.frequency === 'WEEKLY') {
        categoryTotals[expense.category] += expense.amount * 4.33;
      } else if (expense.frequency === 'QUARTERLY') {
        categoryTotals[expense.category] += expense.amount / 3;
      } else if (expense.frequency === 'HALF_YEARLY') {
        categoryTotals[expense.category] += expense.amount / 6;
      } else if (expense.frequency === 'YEARLY') {
        categoryTotals[expense.category] += expense.amount / 12;
      }
      // ONE_TIME expenses ignored for monthly category calculation
    });
    
    return categoryTotals;
  };

  const totalMonthlyExpenses = calculateMonthlyExpenses();
  const expensesByCategory = calculateExpensesByCategory();

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <button
          onClick={() => {
            setFormData(emptyForm);
            setCurrentExpense(null);
            setIsFormVisible(!isFormVisible);
          }}
          className="btn btn-primary"
        >
          {isFormVisible ? 'Cancel' : 'Add Expense'}
        </button>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Total Monthly Expenses</h2>
            <span className="text-2xl font-bold text-red-600">{formatCurrency(totalMonthlyExpenses)}</span>
          </div>
        </div>
        
        <div className="card">
          <h2 className="text-lg font-medium mb-4">Top Categories</h2>
          {expenses.length === 0 ? (
            <p className="text-gray-500 text-center py-2">No expenses to analyze</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(expensesByCategory)
                .filter(([_, amount]) => amount > 0)
                .sort(([_, a], [__, b]) => b - a)
                .slice(0, 3)
                .map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span>{categoryNames[category as ExpenseCategoryType]}</span>
                    <span className="font-medium">{formatCurrency(amount)}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Expense Form */}
      {isFormVisible && (
        <div className="card mb-6">
          <h2 className="text-lg font-medium mb-4">{currentExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Name */}
              <div>
                <label htmlFor="name" className="form-label">Expense Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="e.g., Rent, Groceries"
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
                  placeholder="e.g., 5000"
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
                  placeholder="Any additional details about this expense"
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
                {currentExpense ? 'Update Expense' : 'Add Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">You haven't added any expenses yet.</p>
          <button
            onClick={() => setIsFormVisible(true)}
            className="btn btn-primary"
          >
            Add Your First Expense
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
                {expenses.map(expense => (
                  <tr key={expense.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{expense.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span>{categoryNames[expense.category]}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-red-600">{formatCurrency(expense.amount)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span>{frequencyNames[expense.frequency]}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        Start: {new Date(expense.startDate).toLocaleDateString()}
                      </div>
                      {expense.endDate && (
                        <div className="text-xs text-gray-500">
                          End: {new Date(expense.endDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
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

export default Expenses;
