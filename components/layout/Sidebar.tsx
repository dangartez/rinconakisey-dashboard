import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  SummaryIcon, AgendaIcon, ClientsIcon, ServicesIcon, 
  ProfessionalsIcon, PromotionsIcon, NotificationsIcon, 
  SettingsIcon, LogoutIcon, StatisticsIcon,
  ChevronDoubleLeftIcon, ChevronDoubleRightIcon, CurrencyEuroIcon, CalculatorIcon
} from '../icons/Icons';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
  const commonClasses = "flex items-center px-4 py-3 text-gray-200 hover:bg-slate-700 hover:text-white rounded-lg transition-colors duration-200";
  const activeClasses = "bg-pink-600 text-white";

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => 
    `${commonClasses} ${isCollapsed ? 'justify-center' : ''} ${isActive ? activeClasses : ''}`;

  return (
    <aside className={`bg-slate-900 text-white flex flex-col p-4 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex items-center mb-10 py-2 transition-all duration-300 ${isCollapsed ? 'px-0' : 'px-2'}`}>
        <div className={`bg-pink-500/20 p-2 rounded-lg ${isCollapsed ? 'mx-auto' : 'mr-3'}`}>
            <svg className="h-6 w-6 text-pink-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z" stroke="currentColor" strokeWidth="1.5"></path><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.5"></path><path d="M12 21c-2.5 0-4-4-4-9s1.5-9 4-9 4 4 4 9-1.5 9-4 9Z" stroke="currentColor" strokeWidth="1.5"></path></svg>
        </div>
        <span className={`font-bold text-2xl whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>Rincon<span className="text-pink-500">Akisey</span></span>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        <NavLink 
          to="/tpv" 
          className={({ isActive }) => `${commonClasses} text-lg border border-green-400/50 ${isCollapsed ? 'justify-center' : ''} ${isActive ? activeClasses : ''}`}>
            <CalculatorIcon className="h-6 w-6 flex-shrink-0" />
            <span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>TPV</span>
        </NavLink>
        <div className="border-t border-slate-700 my-2"></div>
        <NavLink to="/" className={getNavLinkClass}><SummaryIcon className="h-5 w-5 flex-shrink-0" /><span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Resumen</span></NavLink>
        <NavLink to="/agenda" className={getNavLinkClass}><AgendaIcon className="h-5 w-5 flex-shrink-0" /><span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Agenda</span></NavLink>
        <NavLink to="/clientes" className={getNavLinkClass}><ClientsIcon className="h-5 w-5 flex-shrink-0" /><span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Clientes</span></NavLink>
        <NavLink to="/servicios" className={getNavLinkClass}><ServicesIcon className="h-5 w-5 flex-shrink-0" /><span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Servicios</span></NavLink>
        <NavLink to="/profesionales" className={getNavLinkClass}><ProfessionalsIcon className="h-5 w-5 flex-shrink-0" /><span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Profesionales</span></NavLink>
        <NavLink to="/promociones" className={getNavLinkClass}><PromotionsIcon className="h-5 w-5 flex-shrink-0" /><span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Promociones</span></NavLink>
        <NavLink to="/notificaciones" className={getNavLinkClass}><NotificationsIcon className="h-5 w-5 flex-shrink-0" /><span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Notificaciones</span></NavLink>
        <NavLink to="/estadisticas" className={getNavLinkClass}><StatisticsIcon className="h-5 w-5 flex-shrink-0" /><span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Datos y Estadísticas</span></NavLink>
        <NavLink to="/contabilidad" className={getNavLinkClass}><CurrencyEuroIcon className="h-5 w-5 flex-shrink-0" /><span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Contabilidad</span></NavLink>
        <NavLink to="/ajustes" className={getNavLinkClass}><SettingsIcon className="h-5 w-5 flex-shrink-0" /><span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Ajustes</span></NavLink>
      </nav>

      <div className="mt-auto">
        <button onClick={toggleSidebar} className={`${commonClasses} w-full ${isCollapsed ? 'justify-center' : ''}`}>
            {isCollapsed ? 
                <ChevronDoubleRightIcon className="h-5 w-5" /> : 
                <>
                    <ChevronDoubleLeftIcon className="h-5 w-5 mr-3" />
                    <span className="whitespace-nowrap">Colapsar</span>
                </>
            }
        </button>
         <a href="#" className={`${commonClasses} ${isCollapsed ? 'justify-center' : ''}`}>
          <LogoutIcon className="h-5 w-5 flex-shrink-0" />
          <span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>Cerrar Sesión</span>
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;