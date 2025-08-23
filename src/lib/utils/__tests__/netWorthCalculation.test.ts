import { debugNetWorthCalculation } from '../debugUtils';
import { formatCurrency } from '../../formatters/currency';

// Mock data from user with proper type conversion
const bankAccounts = [
  {
    "name": "Axis",
    "accountNumber": "XXXXXXXX",
    "accountType": "SAVINGS" as const,
    "balance": 4645000,
    "interestRate": 3,
    "isAsset": true,
    "notes": "",
    "id": "953e81da-e213-4ed8-b734-2ef95679f9eb",
    "createdAt": new Date("2025-08-16T11:08:48.511Z"),
    "updatedAt": new Date("2025-08-16T11:09:42.173Z")
  },
  {
    "name": "KCCB",
    "accountNumber": "XXXXXXXX1",
    "accountType": "SAVINGS" as const,
    "balance": 950000,
    "interestRate": 4.5,
    "isAsset": true,
    "notes": "",
    "id": "478abc64-adf7-4c90-8388-01fdbdfb4363",
    "createdAt": new Date("2025-08-16T11:09:04.350Z"),
    "updatedAt": new Date("2025-08-16T11:09:04.350Z")
  }
];

const loans = [
  {
    "name": "House",
    "type": "HOME" as const,
    "principal": 10000000,
    "interestRate": 8.5,
    "startDate": new Date("2025-08-16T00:00:00.000Z"),
    "tenureMonths": 300,
    "emi": 80522.71,
    "notes": "",
    "id": "6fe24266-23f5-4173-9981-20716f40beea",
    "createdAt": new Date("2025-08-16T11:11:44.750Z"),
    "updatedAt": new Date("2025-08-16T11:12:04.609Z")
  }
];

describe('Net Worth Calculation Tests', () => {
  test('should correctly calculate net worth with provided data', () => {
    // Empty assets array since none were provided
    const assets: any[] = [];
    
    // Calculate net worth manually
    const assetsTotal = assets.reduce((sum, asset) => sum + asset.currentValue, 0);
    const bankAccountsTotal = bankAccounts
      .filter(account => account.isAsset)
      .reduce((sum, account) => sum + account.balance, 0);
    const totalAssets = assetsTotal + bankAccountsTotal;
    const liabilitiesTotal = loans.reduce((sum, loan) => sum + loan.principal, 0);
    const netWorth = totalAssets - liabilitiesTotal;
    
    // Expected values based on provided data
    expect(assetsTotal).toBe(0);
    expect(bankAccountsTotal).toBe(5595000); // 4645000 + 950000
    expect(totalAssets).toBe(5595000);
    expect(liabilitiesTotal).toBe(10000000);
    expect(netWorth).toBe(-4405000); // 5595000 - 10000000
    
    // Use debug utility and verify its calculations
    const breakdown = debugNetWorthCalculation(assets, bankAccounts, loans);
    
    // Verify the breakdown results
    expect(breakdown.assets.total).toBe(0);
    expect(breakdown.bankAccounts.total).toBe(5595000);
    expect(breakdown.liabilities.total).toBe(10000000);
    expect(breakdown.summary.netWorth).toBe(-4405000);
    
    // Verify the formatted values
    expect(breakdown.summary.netWorthFormatted).toBe(formatCurrency(-4405000));
  });
  
  test('should handle bank accounts not marked as assets', () => {
    const assets: any[] = [];
    
    // Create a copy of bank accounts with one not marked as asset
    const modifiedBankAccounts = [
      { ...bankAccounts[0] },
      { ...bankAccounts[1], isAsset: false }
    ];
    
    const breakdown = debugNetWorthCalculation(assets, modifiedBankAccounts, loans);
    
    // Only the first bank account should be counted
    expect(breakdown.bankAccounts.total).toBe(4645000);
    expect(breakdown.summary.netWorth).toBe(-5355000); // 4645000 - 10000000
  });
  
  test('should handle empty bank accounts', () => {
    const assets: any[] = [];
    const emptyBankAccounts: any[] = [];
    
    const breakdown = debugNetWorthCalculation(assets, emptyBankAccounts, loans);
    
    expect(breakdown.bankAccounts.total).toBe(0);
    expect(breakdown.summary.netWorth).toBe(-10000000); // 0 - 10000000
  });
  
  test('should handle no loans', () => {
    const assets: any[] = [];
    const emptyLoans: any[] = [];
    
    const breakdown = debugNetWorthCalculation(assets, bankAccounts, emptyLoans);
    
    expect(breakdown.liabilities.total).toBe(0);
    expect(breakdown.summary.netWorth).toBe(5595000); // 5595000 - 0
  });
  
  test('should handle both assets and bank accounts', () => {
    // Add some assets
    const assets = [
      {
        id: "asset-1",
        name: "Stock Portfolio",
        category: "STOCK" as const,
        purchaseDate: new Date("2025-01-01"),
        purchaseAmount: 500000,
        currentValue: 750000,
        growthRate: 10,
        notes: "",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "asset-2",
        name: "Gold",
        category: "GOLD" as const,
        purchaseDate: new Date("2024-01-01"),
        purchaseAmount: 300000,
        currentValue: 350000,
        growthRate: 8,
        notes: "",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const breakdown = debugNetWorthCalculation(assets, bankAccounts, loans);
    
    expect(breakdown.assets.total).toBe(1100000); // 750000 + 350000
    expect(breakdown.bankAccounts.total).toBe(5595000);
    expect(breakdown.summary.totalAssets).toBe(6695000); // 1100000 + 5595000
    expect(breakdown.summary.netWorth).toBe(-3305000); // 6695000 - 10000000
  });
});
