# Net Worth Calculation Analysis

## Issue Summary

The net worth calculation was showing a negative value despite having substantial bank account balances. After analyzing the data and calculations, we identified that the issue was due to the loan principal amount (₹10,000,000) exceeding the total assets (bank accounts totaling ₹5,595,000).

## Data Analysis

### Bank Accounts
```json
[
  {
    "name": "Axis",
    "balance": 4645000,
    "isAsset": true
  },
  {
    "name": "KCCB",
    "balance": 950000,
    "isAsset": true
  }
]
```
Total Bank Account Balance: ₹5,595,000

### Loans
```json
[
  {
    "name": "House",
    "principal": 10000000,
    "emi": 80522.71
  }
]
```
Total Loan Principal: ₹10,000,000

### Net Worth Calculation
```
Assets:
  - Regular Assets: ₹0 (none provided)
  - Bank Accounts: ₹5,595,000
  Total Assets: ₹5,595,000

Liabilities:
  - Loans: ₹10,000,000
  Total Liabilities: ₹10,000,000

Net Worth = Total Assets - Total Liabilities
Net Worth = ₹5,595,000 - ₹10,000,000 = -₹4,405,000
```

## Findings

1. **Calculation is Correct**: The net worth calculation is mathematically correct. Net worth is defined as total assets minus total liabilities.

2. **Negative Net Worth is Valid**: It's entirely possible and normal to have a negative net worth, especially when you have a large loan (like a home loan) that exceeds your current assets.

3. **Data Reflects Reality**: The data shows:
   - Bank accounts with a combined balance of ₹5,595,000
   - A home loan with a principal of ₹10,000,000
   - This naturally results in a negative net worth of -₹4,405,000

4. **Forecast Impact**: The negative net worth affects the forecast because it starts with this negative value and projects growth from there.

## Solution

Since the calculation is correct and the negative net worth reflects the actual financial situation based on the provided data, no "fix" is needed for the calculation itself. However, we've implemented the following improvements:

1. **Added Debug Utilities**:
   - Created `debugUtils.ts` with detailed logging functions
   - Added `debugNetWorthCalculation()` to provide transparent breakdown of calculations
   - Added `debugForecastCalculation()` to show detailed projection steps

2. **Added Logging**:
   - Integrated debug logging in Dashboard and Forecast components
   - Created a standalone test script to verify calculations with the provided data

3. **Enhanced Documentation**:
   - Created this analysis document to explain the net worth calculation
   - Added comments in the code to clarify the calculation process

## Expected Behavior

With the current data:
- The net worth will show as -₹4,405,000
- The forecast will start from this negative value
- As monthly savings accumulate and the investment return is applied, the net worth will eventually become positive

This is the correct financial representation of someone who has:
- Recently taken a large home loan (₹10M)
- Has significant bank balances (₹5.6M)
- Has a good monthly income (₹145,000)

Over time, as the loan principal decreases and assets grow, the net worth will become positive.

## Recommendations

If you want to see a positive net worth in the forecast:

1. **Add More Assets**: Enter any other assets you own (property, investments, etc.)
2. **Adjust Loan Principal**: If the home loan has already been partially paid off, update the principal amount
3. **Mark Bank Accounts**: Ensure all bank accounts have the `isAsset` flag set to `true` if they should count toward your assets

The forecast will automatically update to reflect these changes.
