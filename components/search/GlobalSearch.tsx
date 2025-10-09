
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { clients, services, professionals } from '../../data/mockData';
import { SearchIcon } from '../icons/Icons';
import { Client, Service, Professional } from '../../types';

interface SearchResults {
    clients: Client[];
    services: Service[];
    professionals: Professional[];
}

const GlobalSearch: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults>({ clients: [], services: [], professionals: [] });
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const searchRef = useRef<HTMLDivElement>(null);

    const hasResults = useMemo(() => 
        results.clients.length > 0 || results.services.length > 0 || results.professionals.length > 0,
        [results]
    );

    useEffect(() => {
        if (query.length < 2) {
            setResults({ clients: [], services: [], professionals: [] });
            setIsOpen(false);
            return;
        }

        const lowerQuery = query.toLowerCase();

        const foundClients = clients.filter(c =>
            c.name.toLowerCase().includes(lowerQuery) ||
            c.phone.includes(lowerQuery)
        ).slice(0, 3);

        const foundServices = services.filter(s =>
            s.name.toLowerCase().includes(lowerQuery) ||
            s.category.toLowerCase().includes(lowerQuery)
        ).slice(0, 3);

        const foundProfessionals = professionals.filter(p =>
            p.name.toLowerCase().includes(lowerQuery) ||
            p.email.toLowerCase().includes(lowerQuery)
        ).slice(0, 3);
        
        const anyResults = foundClients.length > 0 || foundServices.length > 0 || foundProfessionals.length > 0;

        setResults({
            clients: foundClients,
            services: foundServices,
            professionals: foundProfessionals
        });
        setIsOpen(anyResults);

    }, [query]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (path: string) => {
        setQuery('');
        setIsOpen(false);
        navigate(path);
    };

    const renderResultItem = (text: string, subtext: string, path: string, key: string) => (
        <li
            key={key}
            onClick={() => handleSelect(path)}
            className="px-4 py-2.5 hover:bg-pink-50 cursor-pointer rounded-md transition-colors"
        >
            <p className="font-medium text-sm text-gray-800">{text}</p>
            <p className="text-xs text-gray-500">{subtext}</p>
        </li>
    );

    return (
        <div className="relative w-full" ref={searchRef}>
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar cliente, servicio, profesional..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length > 1 && hasResults && setIsOpen(true)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border-2 border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:bg-white transition-all"
                />
            </div>

            {isOpen && hasResults && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-40 p-2 max-h-96 overflow-y-auto animate-fadeIn">
                    <ul className="space-y-1">
                        {results.clients.length > 0 && (
                            <>
                                <li className="px-4 pt-2 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Clientes</li>
                                {results.clients.map(client => renderResultItem(client.name, client.phone, '/clientes', `client-${client.id}`))}
                            </>
                        )}
                        {results.services.length > 0 && (
                            <>
                                <li className="px-4 pt-3 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wider border-t border-gray-100 mt-2">Servicios</li>
                                {results.services.map(service => renderResultItem(service.name, `${service.duration} min - ${service.price}€`, '/servicios', `service-${service.id}`))}
                            </>
                        )}
                        {results.professionals.length > 0 && (
                            <>
                                <li className="px-4 pt-3 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wider border-t border-gray-100 mt-2">Profesionales</li>
                                {results.professionals.map(pro => renderResultItem(pro.name, pro.email, '/profesionales', `pro-${pro.id}`))}
                            </>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
