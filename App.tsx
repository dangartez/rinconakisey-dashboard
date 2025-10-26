import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import SummaryPage from './pages/SummaryPage';
import AgendaPage from './pages/AgendaPage';
import ClientsPage from './pages/ClientsPage';
import ServicesPage from './pages/ServicesPage';
import ProfessionalsPage from './pages/ProfessionalsPage';
import PromotionsPage from './pages/PromotionsPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import StatisticsPage from './pages/StatisticsPage';
import TpvPage from './pages/TpvPage';
import ContabilidadPage from './pages/ContabilidadPage'; // Import new page

const App: React.FC = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      <Toaster />
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          <Routes>
            <Route path="/" element={<SummaryPage />} />
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/tpv" element={<TpvPage />} />
            <Route path="/clientes" element={<ClientsPage />} />
            <Route path="/servicios" element={<ServicesPage />} />
            <Route path="/profesionales" element={<ProfessionalsPage />} />
            <Route path="/promociones" element={<PromotionsPage />} />
            <Route path="/notificaciones" element={<NotificationsPage />} />
            <Route path="/estadisticas" element={<StatisticsPage />} />
            <Route path="/contabilidad" element={<ContabilidadPage />} />
            <Route path="/ajustes" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;