import React from 'react';
import { LayoutDashboard, CheckSquare, Car, FileText, Users } from 'lucide-react';
import { useTasks } from '../context/TaskContext';

interface Props {
  activeTab: 'dashboard' | 'tasks' | 'checklist' | 'budgets' | 'clients';
  setActiveTab: (tab: 'dashboard' | 'tasks' | 'checklist' | 'budgets' | 'clients') => void;
}

export const BottomNav: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  const { stats } = useTasks();
  const pendingCount = stats.pendentes + stats.emAndamento + stats.aguardandoPecas;

  const tabs: { id: Props['activeTab']; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'tasks', label: 'Pendências', icon: CheckSquare, badge: pendingCount },
    { id: 'checklist', label: 'Checklist', icon: Car },
    { id: 'budgets', label: 'Orçamentos', icon: FileText },
    { id: 'clients', label: 'Clientes', icon: Users },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg pb-[env(safe-area-inset-bottom,0px)]">
      <div className="grid grid-cols-5 h-14 sm:h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center relative py-1 transition-colors select-none ${
                isActive ? 'text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110 text-blue-700' : 'text-slate-500'} transition-transform`} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 bg-blue-600 text-white text-[9px] font-black rounded-full shadow-xs">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight font-medium ${isActive ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
