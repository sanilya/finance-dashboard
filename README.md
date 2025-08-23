# Finance App MVP

A simplified personal finance management application focused on tracking assets, income, expenses, loans, and forecasting wealth growth.

## Features

- **Dashboard:** View net worth, cash flow, and savings rate at a glance
- **Asset Management:** Track different types of assets and their growth
- **Income & Expense Tracking:** Monitor your monthly cash flow
- **Loan Management:** Track loans and EMIs with prepayment analysis
- **Wealth Forecasting:** Project your wealth growth over time

## Technical Details

### Built With

- React with TypeScript
- Tailwind CSS for styling
- Zustand for state management
- Zod for validation
- Recharts for data visualization
- LocalStorage/IndexedDB for data persistence

### Project Structure

```
finance-app-mvp/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and models
│   │   ├── calculations/ # Financial calculations
│   │   ├── formatters/  # Data formatters
│   │   ├── models.ts    # Zod schemas and types
│   │   └── storage/     # Local storage implementation
│   ├── pages/           # Page components
│   ├── store/           # Zustand state stores
│   └── styles/          # Global styles
└── docs/                # Documentation
```

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd finance-app-mvp
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. **Dashboard:** View your overall financial health and summary
2. **Assets:** Add and track your assets like real estate, stocks, gold, etc.
3. **Income:** Record your income sources
4. **Expenses:** Track your monthly and one-time expenses
5. **Loans:** Manage your loans and analyze prepayment options
6. **Forecast:** Project your wealth growth based on current financial data

## Roadmap

Features planned for future versions:
- User authentication and cloud synchronization
- Data encryption for security
- Multi-currency support
- Advanced tax planning
- Mobile app versions
- Data import/export functionality
- Email notifications and alerts

## License

This project is licensed under the MIT License - see the LICENSE file for details.
