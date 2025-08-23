import { v4 as uuidv4 } from 'uuid';
import { Asset, Income, Expense, Loan, BankAccount, Settings } from '../models';

// Define storage keys
const STORAGE_KEYS = {
  ASSETS: 'finance_app_assets',
  INCOME: 'finance_app_income',
  EXPENSES: 'finance_app_expenses',
  LOANS: 'finance_app_loans',
  BANK_ACCOUNTS: 'finance_app_bank_accounts',
  SETTINGS: 'finance_app_settings',
};

// Generic data repository
export class LocalRepository<T extends { id: string }> {
  private storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  // Get all items
  getAll(): T[] {
    try {
      const dataString = localStorage.getItem(this.storageKey);
      return dataString ? JSON.parse(dataString) : [];
    } catch (error) {
      console.error(`Error retrieving data from ${this.storageKey}:`, error);
      return [];
    }
  }

  // Get single item by id
  getById(id: string): T | null {
    const items = this.getAll();
    return items.find(item => item.id === id) || null;
  }

  // Add new item
  add(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T {
    const items = this.getAll();
    const now = new Date();
    const newItem: T = {
      ...(item as any),
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    
    items.push(newItem);
    this.saveAll(items);
    return newItem;
  }

  // Update existing item
  update(id: string, updates: Partial<Omit<T, 'id' | 'createdAt'>>): T | null {
    const items = this.getAll();
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) return null;
    
    const updatedItem = {
      ...items[index],
      ...updates,
      updatedAt: new Date(),
    };
    
    items[index] = updatedItem;
    this.saveAll(items);
    return updatedItem;
  }

  // Delete an item
  delete(id: string): boolean {
    const items = this.getAll();
    const newItems = items.filter(item => item.id !== id);
    
    if (newItems.length === items.length) return false;
    
    this.saveAll(newItems);
    return true;
  }

  // Save all items
  private saveAll(items: T[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch (error) {
      console.error(`Error saving data to ${this.storageKey}:`, error);
    }
  }

  // Clear all items
  clear(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error(`Error clearing data from ${this.storageKey}:`, error);
    }
  }
}

// Export specific repositories
export const assetsRepository = new LocalRepository<Asset>(STORAGE_KEYS.ASSETS);
export const incomeRepository = new LocalRepository<Income>(STORAGE_KEYS.INCOME);
export const expensesRepository = new LocalRepository<Expense>(STORAGE_KEYS.EXPENSES);
export const loansRepository = new LocalRepository<Loan>(STORAGE_KEYS.LOANS);
export const bankAccountsRepository = new LocalRepository<BankAccount>(STORAGE_KEYS.BANK_ACCOUNTS);

// Settings is handled specially since there's only one settings object
export const settingsRepository = {
  getSettings(): Settings {
    try {
      const settingsString = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (settingsString) {
        return JSON.parse(settingsString);
      } else {
        // Default settings
        const defaultSettings: Settings = {
          defaultSavingsRate: 30,
          defaultInflationRate: 7,
          defaultInvestmentReturn: 20,
          currency: 'INR',
          theme: 'light'
        };
        this.saveSettings(defaultSettings);
        return defaultSettings;
      }
    } catch (error) {
      console.error('Error retrieving settings:', error);
      return {
        defaultSavingsRate: 30,
        defaultInflationRate: 7,
        defaultInvestmentReturn: 20,
        currency: 'INR',
        theme: 'light'
      };
    }
  },

  saveSettings(settings: Settings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },

  updateSettings(updates: Partial<Settings>): Settings {
    const currentSettings = this.getSettings();
    const updatedSettings = { ...currentSettings, ...updates };
    this.saveSettings(updatedSettings);
    return updatedSettings;
  }
};
