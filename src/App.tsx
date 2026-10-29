import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider, useTasks } from './context/TaskContext';
import { Header } from './components/Header';
import { RealtimeProgressDashboard } from './components/RealtimeProgressDashboard';
import { TaskList } from './components/TaskList';
import { CarVisualChecklist } from './components/CarVisualChecklist';
import { BudgetsManager } from './components/BudgetsManager';
import { ClientsAndVehicles } from './components/ClientsAndVehicles';
import { TaskModal } from './components/TaskModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { SettingsModal } from './components/SettingsModal';
import { LoginScreen } from './components/LoginScreen';
import { BottomNav } from './components/BottomNav';
import { Task, TaskStatus } from './types';

function MainAppContent() {
  const { user, loading } = useAuth();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'checklist' | 'budgets' | 'clients'>('dashboard');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [tasksFilter, setTasksFilter] = useState<TaskStatus | 'urgentes' | 'todas'>('todas');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginScreen onOpenSupabaseModal={() => setSupabaseModalOpen(true)} />
        <SupabaseConfigModal
          isOpen={supabaseModalOpen}
          onClose={() => setSupabaseModalOpen(false)}
        />
      </>
    );
  }

  const handleOpenNewTask = () => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
  };

  const handleNavigateToTasks = (filter?: TaskStatus | 'urgentes') => {
    if (filter) {
      setTasksFilter(filter);
    } else {
      setTasksFilter('todas');
    }
    setActiveTab('tasks');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewTaskForVehicle = (plate: string, clientName: string) => {
    setEditingTask(null);
    setTaskModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 pb-28 md:pb-12">
      {/* Sticky Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTask={handleOpenNewTask}
        onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
        onOpenSettingsModal={() => setSettingsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'dashboard' && (
          <RealtimeProgressDashboard
            onOpenNewTask={handleOpenNewTask}
            onOpenChecklist={() => setActiveTab('checklist')}
            onNavigateToTasks={handleNavigateToTasks}
          />
        )}

        {activeTab === 'tasks' && (
          <TaskList
            onOpenNewTask={handleOpenNewTask}
            onEditTask={handleEditTask}
            initialFilter={tasksFilter}
          />
        )}

        {activeTab === 'checklist' && (
          <CarVisualChecklist
            onBudgetCreated={() => setActiveTab('budgets')}
            onNavigateToTasks={() => setActiveTab('tasks')}
          />
        )}

        {activeTab === 'budgets' && <BudgetsManager />}

        {activeTab === 'clients' && (
          <ClientsAndVehicles onNewTaskForVehicle={handleNewTaskForVehicle} />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Modals */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        taskToEdit={editingTask}
      />

      <SupabaseConfigModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <MainAppContent />
      </TaskProvider>
    </AuthProvider>
  );
}
