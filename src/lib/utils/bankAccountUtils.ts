import { bankAccountsRepository } from '../storage/localDB';
import { BankAccount } from '../models';

/**
 * Updates a bank account's balance
 * @param bankAccountId The ID of the bank account to update
 * @param amount The amount to add to the balance (can be negative for withdrawals)
 * @returns The updated bank account or null if not found
 */
export const updateBankAccountBalance = (
  bankAccountId: string, 
  amount: number
): BankAccount | null => {
  // Get the bank account
  const bankAccount = bankAccountsRepository.getById(bankAccountId);
  if (!bankAccount) {
    return null;
  }
  
  // Calculate new balance
  const newBalance = bankAccount.balance + amount;
  if (newBalance < 0) {
    // Prevent negative balance
    console.error("Cannot update bank account balance: negative balance would result");
    return null;
  }
  
  // Update bank account balance
  const updatedBankAccount = bankAccountsRepository.update(bankAccount.id, {
    balance: newBalance
  });
  
  return updatedBankAccount;
};

/**
 * Calculate the projected growth of a bank account based on its interest rate
 * @param bankAccount The bank account to project growth for
 * @param years Number of years to project
 * @returns The projected balance after the specified years
 */
export const calculateBankAccountGrowth = (
  bankAccount: BankAccount,
  years: number
): number => {
  if (!bankAccount || years <= 0) return bankAccount?.balance || 0;
  
  // Calculate using compound interest formula: A = P(1 + r/n)^(nt)
  // Where:
  // A = Final amount
  // P = Principal (initial deposit)
  // r = Annual interest rate (decimal)
  // n = Number of times interest is compounded per year
  // t = Time (in years)
  
  const principal = bankAccount.balance;
  const rate = (bankAccount.interestRate || 0) / 100; // Convert percentage to decimal
  const compoundingPerYear = 4; // Quarterly compounding
  
  const finalAmount = principal * Math.pow(
    1 + (rate / compoundingPerYear), 
    compoundingPerYear * years
  );
  
  return finalAmount;
};
