import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import Loans from './pages/Loans';
import Forecast from './pages/Forecast';
import BankAccounts from './pages/BankAccounts';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/income" element={<Income />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/bank-accounts" element={<BankAccounts />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
