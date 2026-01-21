import React from 'react';
import { Settings, Percent, Calculator, Eye, Server, History, GitCompare } from 'lucide-react';

export type TabInfo = 'params' | 'coef' | 'matrix' | 'visual' | 'system' | 'history' | 'compare';

interface Props {
  activeTab: TabInfo;
  onTabChange: (tab: TabInfo) => void;
}

const SheetTabs: React.FC<Props> = ({ activeTab, onTabChange }) => {
  const tabs: { id: TabInfo; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'params', label: '1. Parámetros', icon: <Settings size={16} />, color: 'border-orange-500' },
    { id: 'coef', label: '2. Coeficientes', icon: <Percent size={16} />, color: 'border-yellow-500' },
    { id: 'matrix', label: '3. Matriz', icon: <Calculator size={16} />, color: 'border-blue-500' },
    { id: 'visual', label: '4. Tarifario', icon: <Eye size={16} />, color: 'border-green-500' },
    { id: 'system', label: '5. Sistema', icon: <Server size={16} />, color: 'border-purple-500' },
    { id: 'history', label: 'Histórico', icon: <History size={16} />, color: 'border-gray-500' },
    { id: 'compare', label: 'Comparar', icon: <GitCompare size={16} />, color: 'border-castor-red' },
  ];

  return (
    <div className="bg-gray-100 border-b border-gray-200 px-4 pt-2 flex space-x-1 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            group flex items-center px-4 py-2 text-sm font-medium rounded-t-lg border-t-2 border-l border-r whitespace-nowrap
            ${activeTab === tab.id 
              ? `bg-white text-gray-900 ${tab.color} border-b-transparent` 
              : 'bg-gray-50 text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-100'}
          `}
        >
          <span className={`mr-2 ${activeTab === tab.id ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-500'}`}>
            {tab.icon}
          </span>
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default SheetTabs;