import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import SummaryPage from './pages/SummaryPage';
import AgendaPage from './pages/AgendaPage';
import TpvPage from './pages/TpvPage';
import ClientsPage from './pages/ClientsPage';
import ServicesPage from './pages/ServicesPage';
import ProfessionalsPage from './pages/ProfessionalsPage';
import PromotionsPage from './pages/PromotionsPage';
import BonosPage from './pages/BonosPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import StatisticsPage from './pages/StatisticsPage';
import ContabilidadPage from './pages/ContabilidadPage';
import { ChevronLeftIcon, ChevronRightIcon } from './components/icons/Icons';

const App: React.FC = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Ancho del sidebar en px para el cálculo de la posición del botón
  const collapsedWidth = 80; // w-20
  const expandedWidth = 256; // w-64

  return (
    <div className="relative flex h-screen bg-gray-50 text-gray-800">
      <Toaster />
      
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      {/* Botón "agarrador" como hermano, posicionado dinámicamente */}
      <button
        onClick={toggleSidebar}
        className="absolute top-1/2 transform -translate-y-1/2 text-white w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 z-50"
        style={{ 
          left: isSidebarCollapsed ? `${collapsedWidth - 19.2}px` : `${expandedWidth - 19.2}px`,
          background: `linear-gradient(to right, transparent 0%, transparent 60%, #0f172a 60%, #0f172a 100%)`
        }}
        aria-label={isSidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
      >
        {isSidebarCollapsed ? <ChevronRightIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
      </button>

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
            <Route path="/bonos" element={<BonosPage />} />
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