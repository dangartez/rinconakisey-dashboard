import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Client } from '../../types';
import { SearchIcon, UserCircleIcon } from '../icons/Icons';

interface ClientSelectorProps {
  onClientSelect: (client: Client) => void;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({ onClientSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (searchTerm.length < 2) {
            setResults([]);
            setShowResults(false);
            return;
        }

        const fetchClients = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('clients_with_debt_status')
                .select('id, full_name, phone, email, has_debt')
                .or(`full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
                .limit(10);

            if (error) {
                console.error('Error fetching clients:', error);
                setResults([]);
            } else {
                const mappedData = data.map(c => ({ ...c, name: c.full_name })) as Client[];
                setResults(mappedData);
                setShowResults(true);
            }
            setIsLoading(false);
        };

        const debounceFetch = setTimeout(() => {
            fetchClients();
        }, 300);

        return () => clearTimeout(debounceFetch);

    }, [searchTerm]);

    const handleSelect = (client: Client) => {
        setSearchTerm(client.name);
        setShowResults(false);
        onClientSelect(client);
    };

    return (
        <div className="relative w-full max-w-md" ref={searchRef}>
            <label htmlFor="client-search" className="block text-sm font-medium text-gray-700 mb-1">Buscar Cliente</label>
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    id="client-search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => searchTerm.length > 1 && setShowResults(true)}
                    placeholder="Nombre, email o teléfono..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    autoComplete="off"
                />
                {isLoading && <div className="absolute inset-y-0 right-0 flex items-center pr-3"><div className="w-5 h-5 border-t-2 border-pink-500 rounded-full animate-spin"></div></div>}
            </div>

            {showResults && results.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <ul>
                        {results.map(client => (
                            <li 
                                key={client.id}
                                onClick={() => handleSelect(client)}
                                className={`flex items-center p-3 cursor-pointer ${client.has_debt ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-100'}`}>

                                <UserCircleIcon className="h-8 w-8 text-gray-400 mr-3 flex-shrink-0" />
                                <div>
                                    <p className="font-medium text-gray-800">{client.name}</p>
                                    <p className="text-sm text-gray-500">{client.email || client.phone}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
             {showResults && results.length === 0 && !isLoading && searchTerm.length > 1 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                    <p className="text-center text-gray-500">No se encontraron clientes.</p>
                </div>
            )}
        </div>
    );
};

export default ClientSelector;
