import { z } from 'zod';

// Base schema with common fields
const BaseSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Asset Categories
export const AssetCategory = z.enum([
  'REAL_ESTATE',
  'GOLD',
  'MUTUAL_FUND',
  'STOCK',
  'FIXED_DEPOSIT',
  'PPF',
  'EPF',
  'CASH',
  'OTHER'
]);

// Bank Account Types
export const BankAccountType = z.enum([
  'SAVINGS',
  'CURRENT',
  'SALARY',
  'FIXED_DEPOSIT',
  'RECURRING_DEPOSIT',
  'NRE',
  'NRO',
  'OTHER'
]);

// Asset Schema
export const AssetSchema = BaseSchema.extend({
  name: z.string().min(1, 'Name is required'),
  category: AssetCategory,
  purchaseDate: z.date(),
  purchaseAmount: z.number().positive('Amount must be positive'),
  currentValue: z.number().positive('Value must be positive'),
  growthRate: z.number().min(-10).max(30),
  notes: z.string().optional()
});

// Income Categories
export const IncomeCategory = z.enum([
  'SALARY',
  'BUSINESS',
  'RENTAL',
  'INVESTMENT',
  'DIVIDEND',
  'INTEREST',
  'OTHER'
]);

// Income Frequency
export const Frequency = z.enum([
  'ONE_TIME',
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'HALF_YEARLY',
  'YEARLY'
]);

// Bank Account Schema
export const BankAccountSchema = BaseSchema.extend({
  name: z.string().min(1, 'Bank name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  accountType: BankAccountType,
  balance: z.number().default(0),
  interestRate: z.number().min(0).max(15).default(0), // Annual interest rate percentage
  isAsset: z.boolean().default(true), // Flag to include in assets calculation
  notes: z.string().optional()
});

// Income Schema
export const IncomeSchema = BaseSchema.extend({
  name: z.string().min(1, 'Name is required'),
  category: IncomeCategory,
  amount: z.number().positive('Amount must be positive'),
  frequency: Frequency,
  bankAccountId: z.string().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  notes: z.string().optional()
});

// Expense Categories
export const ExpenseCategory = z.enum([
  'HOUSING',
  'TRANSPORTATION',
  'FOOD',
  'UTILITIES',
  'INSURANCE',
  'HEALTHCARE',
  'ENTERTAINMENT',
  'EDUCATION',
  'PERSONAL',
  'DEBT',
  'OTHER'
]);

// Expense Schema
export const ExpenseSchema = BaseSchema.extend({
  name: z.string().min(1, 'Name is required'),
  category: ExpenseCategory,
  amount: z.number().positive('Amount must be positive'),
  frequency: Frequency,
  startDate: z.date(),
  endDate: z.date().optional(),
  notes: z.string().optional()
});

// Loan Types
export const LoanType = z.enum([
  'HOME',
  'CAR',
  'PERSONAL',
  'EDUCATION',
  'CREDIT_CARD',
  'OTHER'
]);

// Loan Schema
export const LoanSchema = BaseSchema.extend({
  name: z.string().min(1, 'Name is required'),
  type: LoanType,
  principal: z.number().positive('Principal must be positive'),
  interestRate: z.number().min(0).max(40),
  startDate: z.date(),
  tenureMonths: z.number().int().positive('Tenure must be positive'),
  emi: z.number().positive('EMI must be positive'),
  notes: z.string().optional()
});

// Settings Schema
export const SettingsSchema = z.object({
  defaultSavingsRate: z.number().min(0).max(100),
  defaultInflationRate: z.number().min(0).max(20),
  defaultInvestmentReturn: z.number().min(-10).max(30),
  currency: z.enum(['INR']).default('INR'),
  theme: z.enum(['light', 'dark']).default('light')
});

// Type Exports
export type Asset = z.infer<typeof AssetSchema>;
export type Income = z.infer<typeof IncomeSchema>;
export type Expense = z.infer<typeof ExpenseSchema>;
export type Loan = z.infer<typeof LoanSchema>;
export type BankAccount = z.infer<typeof BankAccountSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type AssetCategoryType = z.infer<typeof AssetCategory>;
export type IncomeCategoryType = z.infer<typeof IncomeCategory>;
export type ExpenseCategoryType = z.infer<typeof ExpenseCategory>;
export type LoanTypeType = z.infer<typeof LoanType>;
export type BankAccountTypeType = z.infer<typeof BankAccountType>;
export type FrequencyType = z.infer<typeof Frequency>;
