import React, { useState, useEffect } from 'react';
import { assetsRepository, bankAccountsRepository } from '../lib/storage/localDB';
import { Asset, AssetCategoryType, BankAccount } from '../lib/models';
import { formatCurrency } from '../lib/formatters/currency';
import BankAccountAssetView from '../components/BankAccountAssetView';

// Asset form interface
interface AssetFormData {
  name: string;
  category: AssetCategoryType;
  purchaseDate: string;
  purchaseAmount: string;
  currentValue: string;
  growthRate: string;
  notes: string;
}

// Empty form initial values
const emptyForm: AssetFormData = {
  name: '',
  category: 'OTHER',
  purchaseDate: new Date().toISOString().split('T')[0],
  purchaseAmount: '',
  currentValue: '',
  growthRate: '',
  notes: ''
};

// Asset category display names
const categoryNames: Record<AssetCategoryType, string> = {
  REAL_ESTATE: 'Real Estate',
  GOLD: 'Gold',
  MUTUAL_FUND: 'Mutual Fund',
  STOCK: 'Stock',
  FIXED_DEPOSIT: 'Fixed Deposit',
  PPF: 'PPF',
  EPF: 'EPF',
  CASH: 'Cash',
  OTHER: 'Other'
};

const Assets: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState<AssetFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof AssetFormData, string>>>({});


  // Load assets and bank accounts
  useEffect(() => {
    const loadData = () => {
      const allAssets = assetsRepository.getAll();
      setAssets(allAssets);
      
      const allBankAccounts = bankAccountsRepository.getAll();
      setBankAccounts(allBankAccounts);
    };

    loadData();
  }, []);
  


  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name as keyof AssetFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AssetFormData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.purchaseAmount || isNaN(parseFloat(formData.purchaseAmount))) {
      newErrors.purchaseAmount = 'Valid purchase amount is required';
    } else if (parseFloat(formData.purchaseAmount) <= 0) {
      newErrors.purchaseAmount = 'Amount must be positive';
    }
    
    if (!formData.currentValue || isNaN(parseFloat(formData.currentValue))) {
      newErrors.currentValue = 'Valid current value is required';
    } else if (parseFloat(formData.currentValue) <= 0) {
      newErrors.currentValue = 'Value must be positive';
    }
    
    if (!formData.growthRate || isNaN(parseFloat(formData.growthRate))) {
      newErrors.growthRate = 'Valid growth rate is required';
    } else if (parseFloat(formData.growthRate) < -10 || parseFloat(formData.growthRate) > 30) {
      newErrors.growthRate = 'Growth rate must be between -10 and 30';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      if (currentAsset) {
        // Update existing asset
        const updatedAsset = assetsRepository.update(currentAsset.id, {
          name: formData.name,
          category: formData.category,
          purchaseDate: new Date(formData.purchaseDate),
          purchaseAmount: parseFloat(formData.purchaseAmount),
          currentValue: parseFloat(formData.currentValue),
          growthRate: parseFloat(formData.growthRate),
          notes: formData.notes
        });
        
        if (updatedAsset) {
          setAssets(assets.map(asset => asset.id === updatedAsset.id ? updatedAsset : asset));
        }
      } else {
        // Create new asset
        const newAsset = assetsRepository.add({
          name: formData.name,
          category: formData.category,
          purchaseDate: new Date(formData.purchaseDate),
          purchaseAmount: parseFloat(formData.purchaseAmount),
          currentValue: parseFloat(formData.currentValue),
          growthRate: parseFloat(formData.growthRate),
          notes: formData.notes
        });
        
        setAssets([...assets, newAsset]);
      }
      
      // Reset form
      setFormData(emptyForm);
      setCurrentAsset(null);
      setIsFormVisible(false);
    } catch (error) {
      console.error('Error saving asset:', error);
    }
  };

  // Edit asset
  const handleEdit = (asset: Asset) => {
    setCurrentAsset(asset);
    setFormData({
      name: asset.name,
      category: asset.category,
      purchaseDate: new Date(asset.purchaseDate).toISOString().split('T')[0],
      purchaseAmount: asset.purchaseAmount.toString(),
      currentValue: asset.currentValue.toString(),
      growthRate: asset.growthRate.toString(),
      notes: asset.notes || ''
    });
    setIsFormVisible(true);
  };

  // Delete asset
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      const deleted = assetsRepository.delete(id);
      if (deleted) {
        setAssets(assets.filter(asset => asset.id !== id));
      }
    }
  };

  // Calculate total asset value
  const totalAssetValue = assets.reduce((sum, asset) => sum + asset.currentValue, 0);

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Assets</h1>
        <button
          onClick={() => {
            setFormData(emptyForm);
            setCurrentAsset(null);
            setIsFormVisible(!isFormVisible);
          }}
          className="btn btn-primary"
        >
          {isFormVisible ? 'Cancel' : 'Add Asset'}
        </button>
      </div>

      {/* Summary Card */}
      <div className="card mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium">Total Asset Value</h2>
          <span className="text-2xl font-bold text-gray-900">{formatCurrency(totalAssetValue)}</span>
        </div>
      </div>

      {/* Asset Form */}
      {isFormVisible && (
        <div className="card mb-6">
          <h2 className="text-lg font-medium mb-4">{currentAsset ? 'Edit Asset' : 'Add New Asset'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Name */}
              <div>
                <label htmlFor="name" className="form-label">Asset Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="e.g., Apartment, Gold Coin"
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

              {/* Purchase Date */}
              <div>
                <label htmlFor="purchaseDate" className="form-label">Purchase Date</label>
                <input
                  type="date"
                  id="purchaseDate"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              {/* Purchase Amount */}
              <div>
                <label htmlFor="purchaseAmount" className="form-label">Purchase Amount (₹)</label>
                <input
                  type="number"
                  id="purchaseAmount"
                  name="purchaseAmount"
                  value={formData.purchaseAmount}
                  onChange={handleInputChange}
                  className={`form-input ${errors.purchaseAmount ? 'border-red-500' : ''}`}
                  placeholder="e.g., 50000"
                />
                {errors.purchaseAmount && <p className="form-error">{errors.purchaseAmount}</p>}
              </div>

              {/* Current Value */}
              <div>
                <label htmlFor="currentValue" className="form-label">Current Value (₹)</label>
                <input
                  type="number"
                  id="currentValue"
                  name="currentValue"
                  value={formData.currentValue}
                  onChange={handleInputChange}
                  className={`form-input ${errors.currentValue ? 'border-red-500' : ''}`}
                  placeholder="e.g., 60000"
                />
                {errors.currentValue && <p className="form-error">{errors.currentValue}</p>}
              </div>

              {/* Growth Rate */}
              <div>
                <label htmlFor="growthRate" className="form-label">Expected Annual Growth Rate (%)</label>
                <input
                  type="number"
                  id="growthRate"
                  name="growthRate"
                  value={formData.growthRate}
                  onChange={handleInputChange}
                  className={`form-input ${errors.growthRate ? 'border-red-500' : ''}`}
                  placeholder="e.g., 8"
                />
                {errors.growthRate && <p className="form-error">{errors.growthRate}</p>}
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
                  placeholder="Any additional details about this asset"
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
                {currentAsset ? 'Update Asset' : 'Add Asset'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assets List */}
      {/* Show bank accounts as assets */}
      <BankAccountAssetView bankAccounts={bankAccounts} />
      
      {/* Regular Assets */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Other Assets</h2>
      {assets.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">You haven't added any assets yet.</p>
          <button
            onClick={() => setIsFormVisible(true)}
            className="btn btn-primary"
          >
            Add Your First Asset
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.map(asset => (
                  <tr key={asset.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{asset.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span>{categoryNames[asset.category]}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(asset.purchaseAmount)}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(asset.purchaseDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {formatCurrency(asset.currentValue)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${
                        asset.growthRate >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {asset.growthRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(asset)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id)}
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

export default Assets;
