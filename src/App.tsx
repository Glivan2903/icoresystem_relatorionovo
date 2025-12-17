import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Toaster } from '@/components/ui/sonner';

import ClientsReport from '@/pages/ClientsReport';
import PriceUpdates from '@/pages/PriceUpdates';

import Dashboard from '@/pages/Dashboard';

import Login from '@/pages/Login';

import ProductsReport from '@/pages/ProductsReport';
import ResaleReport from '@/pages/ResaleReport';
import SalesReport from '@/pages/SalesReport';
import QuotesReport from '@/pages/QuotesReport';

// Placeholder Pages
const Settings = () => <div className="p-4">Settings Page</div>;

const ProtectedRoute = () => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<ClientsReport />} />
            <Route path="/produtos" element={<ProductsReport />} />
            <Route path="/orcamentos" element={<QuotesReport />} />
            <Route path="/vendas" element={<SalesReport />} /> {/* Added route for /vendas */}
            <Route path="/revenda" element={<ResaleReport />} />
            <Route path="/precos" element={<PriceUpdates />} />
            <Route path="/config" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
