import React, { useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import GeneralStats from '../components/statistics/GeneralStats';
import ProfessionalStats from '../components/statistics/ProfessionalStats';

type StatsTab = 'general' | 'professionals';

const StatisticsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<StatsTab>('general');

    const getTabClassName = (tabName: StatsTab) => {
        return `whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
            activeTab === tabName
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`;
    };

    return (
        <div>
            <PageHeader
                title="Datos y Estadísticas"
                subtitle="Analiza el rendimiento de tu negocio para tomar mejores decisiones."
            />

            <div className="border-b border-gray-200 mb-8">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('general')} className={getTabClassName('general')}>
                        General
                    </button>
                    <button onClick={() => setActiveTab('professionals')} className={getTabClassName('professionals')}>
                        Profesionales
                    </button>
                </nav>
            </div>

            <div>
                {activeTab === 'general' && <GeneralStats />}
                {activeTab === 'professionals' && <ProfessionalStats />}
            </div>
        </div>
    );
};

export default StatisticsPage;
