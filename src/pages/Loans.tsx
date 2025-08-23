import React, { useState, useEffect } from 'react';
import { loansRepository } from '../lib/storage/localDB';
import { Loan, LoanTypeType } from '../lib/models';
import { formatCurrency } from '../lib/formatters/currency';
import { calculateEMI, generateAmortizationSchedule, calculatePrepaymentImpact } from '../lib/calculations/finance';

// Loan form interface
interface LoanFormData {
  name: string;
  type: LoanTypeType;
  principal: string;
  interestRate: string;
  startDate: string;
  tenureMonths: string;
  notes: string;
}

// Empty form initial values
const emptyForm: LoanFormData = {
  name: '',
  type: 'HOME',
  principal: '',
  interestRate: '',
  startDate: new Date().toISOString().split('T')[0],
  tenureMonths: '',
  notes: ''
};

// Loan type display names
const loanTypeNames: Record<LoanTypeType, string> = {
  HOME: 'Home Loan',
  CAR: 'Car Loan',
  PERSONAL: 'Personal Loan',
  EDUCATION: 'Education Loan',
  CREDIT_CARD: 'Credit Card',
  OTHER: 'Other'
};

// Prepayment form interface
interface PrepaymentFormData {
  amount: string;
}

const Loans: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [currentLoan, setCurrentLoan] = useState<Loan | null>(null);
  const [formData, setFormData] = useState<LoanFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof LoanFormData, string>>>({});
  
  // For amortization schedule
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showAmortizationSchedule, setShowAmortizationSchedule] = useState(false);
  
  // For prepayment analysis
  const [showPrepaymentAnalysis, setShowPrepaymentAnalysis] = useState(false);
  const [prepaymentFormData, setPrepaymentFormData] = useState<PrepaymentFormData>({ amount: '' });
  const [prepaymentResult, setPrepaymentResult] = useState<any>(null);

  // Load loans
  useEffect(() => {
    const loadLoans = () => {
      const allLoans = loansRepository.getAll();
      setLoans(allLoans);
    };

    loadLoans();
  }, []);

  // Handle input changes for loan form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name as keyof LoanFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    
    // Auto-calculate EMI when all required fields are filled
    if (
      name === 'principal' || 
      name === 'interestRate' || 
      name === 'tenureMonths'
    ) {
      const principal = name === 'principal' ? parseFloat(value) : parseFloat(formData.principal);
      const interestRate = name === 'interestRate' ? parseFloat(value) : parseFloat(formData.interestRate);
      const tenureMonths = name === 'tenureMonths' ? parseInt(value) : parseInt(formData.tenureMonths);
      
      if (!isNaN(principal) && !isNaN(interestRate) && !isNaN(tenureMonths) && principal > 0 && interestRate > 0 && tenureMonths > 0) {
        const emi = calculateEMI(principal, interestRate, tenureMonths);
        console.log(`Calculated EMI: ${emi}`);
      }
    }
  };

  // Handle input changes for prepayment form
  const handlePrepaymentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPrepaymentFormData(prev => ({ ...prev, [name]: value }));
  };

  // Validate loan form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof LoanFormData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.principal || isNaN(parseFloat(formData.principal))) {
      newErrors.principal = 'Valid principal amount is required';
    } else if (parseFloat(formData.principal) <= 0) {
      newErrors.principal = 'Principal must be positive';
    }
    
    if (!formData.interestRate || isNaN(parseFloat(formData.interestRate))) {
      newErrors.interestRate = 'Valid interest rate is required';
    } else if (parseFloat(formData.interestRate) <= 0 || parseFloat(formData.interestRate) > 40) {
      newErrors.interestRate = 'Interest rate must be between 0 and 40';
    }
    
    if (!formData.tenureMonths || isNaN(parseInt(formData.tenureMonths))) {
      newErrors.tenureMonths = 'Valid tenure is required';
    } else if (parseInt(formData.tenureMonths) <= 0) {
      newErrors.tenureMonths = 'Tenure must be positive';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle loan form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const principal = parseFloat(formData.principal);
      const interestRate = parseFloat(formData.interestRate);
      const tenureMonths = parseInt(formData.tenureMonths);
      const emi = calculateEMI(principal, interestRate, tenureMonths);
      
      // Prepare loan data object
      const loanData = {
        name: formData.name,
        type: formData.type,
        principal,
        interestRate,
        startDate: new Date(formData.startDate),
        tenureMonths,
        emi,
        notes: formData.notes
      };
      
      if (currentLoan) {
        // Update existing loan
        const updatedLoan = loansRepository.update(currentLoan.id, loanData);
        
        if (updatedLoan) {
          setLoans(loans.map(loan => loan.id === updatedLoan.id ? updatedLoan : loan));
        }
      } else {
        // Create new loan
        const newLoan = loansRepository.add(loanData);
        setLoans([...loans, newLoan]);
      }
      
      // Reset form
      setFormData(emptyForm);
      setCurrentLoan(null);
      setIsFormVisible(false);
    } catch (error) {
      console.error('Error saving loan:', error);
    }
  };

  // Edit loan
  const handleEdit = (loan: Loan) => {
    setCurrentLoan(loan);
    setFormData({
      name: loan.name,
      type: loan.type,
      principal: loan.principal.toString(),
      interestRate: loan.interestRate.toString(),
      startDate: new Date(loan.startDate).toISOString().split('T')[0],
      tenureMonths: loan.tenureMonths.toString(),
      notes: loan.notes || ''
    });
    setIsFormVisible(true);
  };

  // Delete loan
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this loan?')) {
      const deleted = loansRepository.delete(id);
      if (deleted) {
        setLoans(loans.filter(loan => loan.id !== id));
      }
    }
  };

  // View amortization schedule
  const handleViewSchedule = (loan: Loan) => {
    setSelectedLoan(loan);
    setShowAmortizationSchedule(true);
    setShowPrepaymentAnalysis(false);
  };

  // View prepayment analysis
  const handleViewPrepayment = (loan: Loan) => {
    setSelectedLoan(loan);
    setPrepaymentFormData({ amount: '' });
    setPrepaymentResult(null);
    setShowPrepaymentAnalysis(true);
    setShowAmortizationSchedule(false);
  };

  // Calculate prepayment impact
  const handleCalculatePrepayment = () => {
    if (!selectedLoan || !prepaymentFormData.amount || isNaN(parseFloat(prepaymentFormData.amount))) return;
    
    const prepaymentAmount = parseFloat(prepaymentFormData.amount);
    const result = calculatePrepaymentImpact(
      selectedLoan.principal, 
      selectedLoan.interestRate, 
      selectedLoan.tenureMonths, 
      prepaymentAmount
    );
    
    setPrepaymentResult(result);
  };

  // Generate amortization schedule
  const getAmortizationSchedule = () => {
    if (!selectedLoan) return [];
    
    return generateAmortizationSchedule(
      selectedLoan.principal,
      selectedLoan.interestRate,
      selectedLoan.tenureMonths
    );
  };

  // Calculate total outstanding loan amount
  const totalOutstandingLoans = loans.reduce((sum, loan) => sum + loan.principal, 0);
  
  // Calculate total monthly EMI
  const totalMonthlyEMI = loans.reduce((sum, loan) => sum + loan.emi, 0);

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Loans</h1>
        <button
          onClick={() => {
            setFormData(emptyForm);
            setCurrentLoan(null);
            setIsFormVisible(!isFormVisible);
            setShowAmortizationSchedule(false);
            setShowPrepaymentAnalysis(false);
          }}
          className="btn btn-primary"
        >
          {isFormVisible ? 'Cancel' : 'Add Loan'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Total Outstanding Loans</h2>
            <span className="text-2xl font-bold text-red-600">{formatCurrency(totalOutstandingLoans)}</span>
          </div>
        </div>
        
        <div className="card">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Total Monthly EMI</h2>
            <span className="text-2xl font-bold text-red-600">{formatCurrency(totalMonthlyEMI)}</span>
          </div>
        </div>
      </div>

      {/* Loan Form */}
      {isFormVisible && (
        <div className="card mb-6">
          <h2 className="text-lg font-medium mb-4">{currentLoan ? 'Edit Loan' : 'Add New Loan'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Name */}
              <div>
                <label htmlFor="name" className="form-label">Loan Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="e.g., Home Loan, Car Loan"
                />
                {errors.name && <p className="form-error">{errors.name}</p>}
              </div>

              {/* Type */}
              <div>
                <label htmlFor="type" className="form-label">Loan Type</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  {Object.entries(loanTypeNames).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Principal */}
              <div>
                <label htmlFor="principal" className="form-label">Principal Amount (₹)</label>
                <input
                  type="number"
                  id="principal"
                  name="principal"
                  value={formData.principal}
                  onChange={handleInputChange}
                  className={`form-input ${errors.principal ? 'border-red-500' : ''}`}
                  placeholder="e.g., 5000000"
                />
                {errors.principal && <p className="form-error">{errors.principal}</p>}
              </div>

              {/* Interest Rate */}
              <div>
                <label htmlFor="interestRate" className="form-label">Interest Rate (% per annum)</label>
                <input
                  type="number"
                  id="interestRate"
                  name="interestRate"
                  value={formData.interestRate}
                  onChange={handleInputChange}
                  className={`form-input ${errors.interestRate ? 'border-red-500' : ''}`}
                  placeholder="e.g., 8.5"
                  step="0.01"
                />
                {errors.interestRate && <p className="form-error">{errors.interestRate}</p>}
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

              {/* Tenure */}
              <div>
                <label htmlFor="tenureMonths" className="form-label">Tenure (months)</label>
                <input
                  type="number"
                  id="tenureMonths"
                  name="tenureMonths"
                  value={formData.tenureMonths}
                  onChange={handleInputChange}
                  className={`form-input ${errors.tenureMonths ? 'border-red-500' : ''}`}
                  placeholder="e.g., 240 for 20 years"
                />
                {errors.tenureMonths && <p className="form-error">{errors.tenureMonths}</p>}
              </div>

              {/* EMI Preview */}
              <div className="md:col-span-2">
                <label className="form-label">Monthly EMI</label>
                <div className="text-lg font-medium text-gray-700">
                  {formData.principal && formData.interestRate && formData.tenureMonths && !isNaN(parseFloat(formData.principal)) && !isNaN(parseFloat(formData.interestRate)) && !isNaN(parseInt(formData.tenureMonths)) && parseFloat(formData.principal) > 0 && parseFloat(formData.interestRate) > 0 && parseInt(formData.tenureMonths) > 0
                    ? formatCurrency(calculateEMI(parseFloat(formData.principal), parseFloat(formData.interestRate), parseInt(formData.tenureMonths)))
                    : '₹ --'
                  }
                </div>
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
                  placeholder="Any additional details about this loan"
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
                {currentLoan ? 'Update Loan' : 'Add Loan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Amortization Schedule */}
      {showAmortizationSchedule && selectedLoan && (
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Amortization Schedule: {selectedLoan.name}</h2>
            <button
              onClick={() => setShowAmortizationSchedule(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <span className="text-sm text-gray-600">Principal</span>
              <p className="text-lg font-medium">{formatCurrency(selectedLoan.principal)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Interest Rate</span>
              <p className="text-lg font-medium">{selectedLoan.interestRate}%</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Tenure</span>
              <p className="text-lg font-medium">{selectedLoan.tenureMonths} months ({Math.floor(selectedLoan.tenureMonths / 12)} years {selectedLoan.tenureMonths % 12} months)</p>
            </div>
          </div>
          
          <div className="table-container max-h-80 overflow-y-auto">
            <table className="table">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EMI</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance Principal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getAmortizationSchedule().map((row) => (
                  <tr key={row.month}>
                    <td className="px-6 py-2 whitespace-nowrap text-sm">{row.month}</td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm">{formatCurrency(row.emi)}</td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm">{formatCurrency(row.principalPayment)}</td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm">{formatCurrency(row.interestPayment)}</td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm">{formatCurrency(row.remainingPrincipal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Prepayment Analysis */}
      {showPrepaymentAnalysis && selectedLoan && (
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Prepayment Analysis: {selectedLoan.name}</h2>
            <button
              onClick={() => setShowPrepaymentAnalysis(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <span className="text-sm text-gray-600">Current Principal</span>
              <p className="text-lg font-medium">{formatCurrency(selectedLoan.principal)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Current EMI</span>
              <p className="text-lg font-medium">{formatCurrency(selectedLoan.emi)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Remaining Tenure</span>
              <p className="text-lg font-medium">{selectedLoan.tenureMonths} months</p>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4 mb-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-1/3">
                <label htmlFor="prepaymentAmount" className="form-label">Prepayment Amount (₹)</label>
                <input
                  type="number"
                  id="prepaymentAmount"
                  name="amount"
                  value={prepaymentFormData.amount}
                  onChange={handlePrepaymentInputChange}
                  className="form-input"
                  placeholder="e.g., 100000"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleCalculatePrepayment}
                  className="btn btn-primary"
                  disabled={!prepaymentFormData.amount || isNaN(parseFloat(prepaymentFormData.amount))}
                >
                  Calculate Impact
                </button>
              </div>
            </div>
          </div>
          
          {prepaymentResult && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-md font-medium mb-3">Prepayment Impact</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium mb-2">Option 1: Reduce Tenure</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">New Tenure</span>
                      <span className="font-medium">{prepaymentResult.reducedTenure} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tenure Saved</span>
                      <span className="font-medium text-green-600">{prepaymentResult.tenureSaved} months</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">EMI</span>
                      <span className="font-medium">Remains {formatCurrency(prepaymentResult.originalEMI)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium mb-2">Option 2: Reduce EMI</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">New EMI</span>
                      <span className="font-medium">{formatCurrency(prepaymentResult.reducedEMI)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">EMI Reduction</span>
                      <span className="font-medium text-green-600">{formatCurrency(prepaymentResult.originalEMI - prepaymentResult.reducedEMI)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tenure</span>
                      <span className="font-medium">Remains {prepaymentResult.originalTenure} months</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-green-50 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-800">Total Interest Saved</span>
                  <span className="text-lg font-bold text-green-700">{formatCurrency(prepaymentResult.interestSaved)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loans List */}
      {loans.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">You haven't added any loans yet.</p>
          <button
            onClick={() => setIsFormVisible(true)}
            className="btn btn-primary"
          >
            Add Your First Loan
          </button>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EMI</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenure</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loans.map(loan => (
                  <tr key={loan.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{loan.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span>{loanTypeNames[loan.type]}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(loan.principal)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span>{loan.interestRate}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-red-600">{formatCurrency(loan.emi)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        {loan.tenureMonths} months
                      </div>
                      <div className="text-xs text-gray-500">
                        ({Math.floor(loan.tenureMonths / 12)} years {loan.tenureMonths % 12} months)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewSchedule(loan)}
                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                      >
                        Schedule
                      </button>
                      <button
                        onClick={() => handleViewPrepayment(loan)}
                        className="text-green-600 hover:text-green-900 mr-2"
                      >
                        Prepayment
                      </button>
                      <button
                        onClick={() => handleEdit(loan)}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(loan.id)}
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

export default Loans;
