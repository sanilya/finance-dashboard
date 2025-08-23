import React, { useState, useEffect } from 'react';
import { settingsRepository } from '../lib/storage/localDB';
import { Settings } from '../lib/models';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    defaultSavingsRate: 20,
    defaultInflationRate: 6,
    defaultInvestmentReturn: 12,
    currency: 'INR',
    theme: 'light'
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load current settings
  useEffect(() => {
    const loadSettings = () => {
      const currentSettings = settingsRepository.getSettings();
      setSettings(currentSettings);
    };

    loadSettings();
  }, []);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle numeric values
    if (type === 'number') {
      setSettings(prev => ({ ...prev, [name]: parseFloat(value) }));
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  // Save settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSaving(true);
    
    try {
      settingsRepository.saveSettings(settings);
      setSaveMessage('Settings saved successfully!');
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setSaveMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="card mb-6">
        <h2 className="text-lg font-medium mb-4">Default Values</h2>
        <form onSubmit={handleSaveSettings}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Default Savings Rate */}
            <div>
              <label htmlFor="defaultSavingsRate" className="form-label">Default Savings Rate (%)</label>
              <input
                type="number"
                id="defaultSavingsRate"
                name="defaultSavingsRate"
                value={settings.defaultSavingsRate}
                onChange={handleInputChange}
                className="form-input"
                min="0"
                max="100"
              />
              <p className="text-xs text-gray-500 mt-1">Used for forecasting when no specific rate is provided</p>
            </div>

            {/* Default Inflation Rate */}
            <div>
              <label htmlFor="defaultInflationRate" className="form-label">Default Inflation Rate (%)</label>
              <input
                type="number"
                id="defaultInflationRate"
                name="defaultInflationRate"
                value={settings.defaultInflationRate}
                onChange={handleInputChange}
                className="form-input"
                min="0"
                max="20"
                step="0.1"
              />
              <p className="text-xs text-gray-500 mt-1">Used for inflation-adjusted forecasting</p>
            </div>

            {/* Default Investment Return */}
            <div>
              <label htmlFor="defaultInvestmentReturn" className="form-label">Default Investment Return (%)</label>
              <input
                type="number"
                id="defaultInvestmentReturn"
                name="defaultInvestmentReturn"
                value={settings.defaultInvestmentReturn}
                onChange={handleInputChange}
                className="form-input"
                min="-10"
                max="30"
                step="0.1"
              />
              <p className="text-xs text-gray-500 mt-1">Default annual return rate for investments</p>
            </div>

            {/* Currency */}
            <div>
              <label htmlFor="currency" className="form-label">Currency</label>
              <select
                id="currency"
                name="currency"
                value={settings.currency}
                onChange={handleInputChange}
                className="form-input"
                disabled
              >
                <option value="INR">INR (₹)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Multi-currency support coming in future updates</p>
            </div>

            {/* Theme */}
            <div>
              <label htmlFor="theme" className="form-label">Theme</label>
              <select
                id="theme"
                name="theme"
                value={settings.theme}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Choose your preferred app theme</p>
            </div>
          </div>

          <div className="mt-6 flex items-center">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
            {saveMessage && (
              <span className={`ml-4 text-sm ${saveMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                {saveMessage}
              </span>
            )}
          </div>
        </form>
      </div>
      
      <div className="card mb-6">
        <h2 className="text-lg font-medium mb-4">Data Management</h2>
        <div className="space-y-4">
          <div>
            <button
              onClick={() => {
                if (window.confirm('This will reset all your data. Are you sure?')) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="btn btn-secondary"
            >
              Reset All Data
            </button>
            <p className="text-xs text-gray-500 mt-2">
              This will delete all your financial data and reset the app to its initial state.
            </p>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h2 className="text-lg font-medium mb-2">About</h2>
        <div className="text-sm text-gray-700">
          <p className="mb-2">Finance App MVP</p>
          <p className="mb-2">Version 0.1.0</p>
          <p>A personal finance management tool for tracking assets, income, expenses, and forecasting wealth growth.</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
