# Finance App MVP Testing Strategy

This document outlines the testing approach for the Finance App MVP, focusing on ensuring the accuracy of financial calculations and the reliability of the forecast functionality.

## Testing Approach

The testing strategy consists of three main layers:

1. **Unit Tests**: Testing individual calculation functions in isolation
2. **Integration Tests**: Testing components with their dependencies mocked
3. **End-to-End Tests**: Testing complete user flows (future implementation)

## Test Coverage

### Core Financial Calculation Tests

The core financial calculations are tested in `src/lib/calculations/__tests__/finance.test.ts` and cover:

- **EMI Calculation**: Testing loan EMI calculations with various parameters
- **Amortization Schedule**: Testing the generation of loan payment schedules
- **Investment Growth**: Testing compound growth calculations with and without regular contributions
- **Wealth Projection**: Testing the forecast algorithm with different scenarios
- **Prepayment Impact**: Testing loan prepayment calculations
- **Goal-based Savings**: Testing calculations for reaching financial goals

### Component Tests

The Forecast component is tested in `src/pages/__tests__/Forecast.test.tsx` and covers:

- **Initial Rendering**: Testing that the component renders correctly with initial data
- **Settings Updates**: Testing that changing forecast settings updates the projection
- **Data Refresh**: Testing that the refresh button works as expected
- **Edge Cases**: Testing scenarios with no income, expenses exceeding income, etc.
- **Frequency Conversions**: Testing that different income/expense frequencies are correctly converted to monthly amounts

## Test Cases

### Financial Calculation Test Cases

1. **Standard Scenarios**
   - Calculate EMI for standard loan parameters
   - Generate investment growth with typical market returns
   - Project wealth with positive savings and returns

2. **Edge Cases**
   - Zero interest rates
   - Very short loan tenures
   - Negative investment returns
   - Zero initial net worth
   - Prepayment exceeding loan principal

3. **Integration Scenarios**
   - Loan and investment combined scenarios
   - Wealth projection with loan payoff events

### Forecast Component Test Cases

1. **Data Loading**
   - Verify repositories are called correctly
   - Verify initial state is set correctly

2. **Calculation Accuracy**
   - Net worth calculation (assets + bank accounts - liabilities)
   - Monthly income calculation (all frequencies converted to monthly)
   - Monthly expense calculation (all frequencies converted to monthly)
   - Monthly savings calculation (based on available income and savings rate)

3. **UI Interaction**
   - Settings changes update the projection
   - Refresh button reloads data and recalculates

4. **Special Scenarios**
   - No income or expenses
   - Expenses exceeding income
   - Various frequency combinations

## Running Tests

The following npm scripts are available for running tests:

- `npm test`: Run all tests in watch mode
- `npm run test:coverage`: Run all tests with coverage report
- `npm run test:calculations`: Run only financial calculation tests
- `npm run test:components`: Run only component tests

## Fixed Issues

During testing, we identified and fixed the following issues:

1. **Monthly Savings Calculation**: Fixed the issue where monthly savings were showing as 0 in the forecast by:
   - Updating income and expense calculations to consider all frequency types, not just monthly
   - Converting weekly, quarterly, half-yearly, and yearly amounts to their monthly equivalents

2. **Default Settings**: Updated the default settings to match requirements:
   - Savings Rate: 30%
   - Inflation Rate: 7%
   - Investment Return: 20%

## Future Improvements

1. **Expanded Test Coverage**
   - Add tests for other components (Dashboard, Income, Expenses, etc.)
   - Add end-to-end tests for complete user flows

2. **Performance Testing**
   - Test the application with large datasets
   - Measure and optimize rendering performance

3. **Accessibility Testing**
   - Test keyboard navigation
   - Test screen reader compatibility
   - Ensure color contrast meets WCAG guidelines
