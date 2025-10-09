import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '../icons/Icons';

interface ComboBoxItem {
    id: number | string;
    name: string;
}

interface ComboBoxProps {
    items: ComboBoxItem[];
    selectedValue: ComboBoxItem | null;
    onSelect: (item: ComboBoxItem | null) => void;
    placeholder?: string;
}

const ComboBox: React.FC<ComboBoxProps> = ({ items, selectedValue, onSelect, placeholder = "Selecciona una opción" }) => {
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (selectedValue) {
            setInputValue(selectedValue.name);
        } else {
            setInputValue('');
        }
    }, [selectedValue]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const filteredItems = useMemo(() => {
        if (!inputValue) return items;
        const lowercasedInput = inputValue.toLowerCase();
        return items.filter(item => item.name.toLowerCase().includes(lowercasedInput));
    }, [items, inputValue]);

    const handleSelect = (item: ComboBoxItem) => {
        onSelect(item);
        setInputValue(item.name);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="relative">
                 <input
                    type="text"
                    className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        if (!isOpen) setIsOpen(true);
                        if (selectedValue && e.target.value !== selectedValue.name) {
                            onSelect(null); // Deselect if user types something different
                        }
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                />
                <button type="button" onClick={() => setIsOpen(!isOpen)} className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <ChevronDownIcon className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>
           
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredItems.length > 0 ? (
                        filteredItems.map(item => (
                            <div
                                key={item.id}
                                className="px-4 py-2 hover:bg-pink-100 cursor-pointer"
                                onClick={() => handleSelect(item)}
                            >
                                {item.name}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-2 text-gray-500">No se encontraron resultados</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ComboBox;
