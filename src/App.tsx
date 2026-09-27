import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './components/LoginPage';
import { GlobalDashboard } from './modules/GlobalDashboard';
import { CollegesModule } from './modules/CollegesModule';
import { UsersModule } from './modules/UsersModule';
import { CollegeDashboard } from './modules/CollegeDashboard';
import { StudentsModule } from './modules/StudentsModule';
import { GradesModule } from './modules/GradesModule';
import { TeachersModule } from './modules/TeachersModule';
import { SubjectsModule } from './modules/SubjectsModule';
import { TasksExamsModule } from './modules/TasksExamsModule';
import { IncidentsModule } from './modules/IncidentsModule';
import { PsychologyModule } from './modules/PsychologyModule';
import { LibraryModule } from './modules/LibraryModule';
import { NoticesModule } from './modules/NoticesModule';
import { PlansBillingModule } from './modules/PlansBillingModule';
import { CollegeCustomizerModule } from './modules/CollegeCustomizerModule';
import { SuperuserCredentialsModal } from './components/SuperuserCredentialsModal';
import { QuickLoginModal } from './components/QuickLoginModal';

const AppContent: React.FC = () => {
  const { selectedCollegeId, setSelectedCollegeId, activeCollege } = useApp();

  // Authentication state: user starts logged out and must enter credentials
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Navigation tab state
  const [currentTab, setCurrentTab] = useState<string>('dashboard_general');
  const [isSuperuserModalOpen, setIsSuperuserModalOpen] = useState(false);
  const [isQuickLoginOpen, setIsQuickLoginOpen] = useState(false);

  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSelectedCollegeId(null);
  };

  // If user is not authenticated, show strictly the login page
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  // Render main dashboard view when authenticated
  const renderCurrentView = () => {
    if (selectedCollegeId === null) {
      // Global View (Superusuario Maestro)
      switch (currentTab) {
        case 'dashboard_general':
          return (
            <GlobalDashboard
              onNavigateTab={handleSelectTab}
              onOpenAddCollegeModal={() => {
                setCurrentTab('colegios');
              }}
            />
          );
        case 'colegios':
          return <CollegesModule onNavigateTab={handleSelectTab} />;
        case 'usuarios_globales':
          return <UsersModule />;
        case 'planes_modulos':
          return <PlansBillingModule />;
        default:
          return (
            <GlobalDashboard
              onNavigateTab={handleSelectTab}
              onOpenAddCollegeModal={() => setCurrentTab('colegios')}
            />
          );
      }
    } else {
      // College-specific scoped view
      switch (currentTab) {
        case 'colegio_resumen':
          return <CollegeDashboard onNavigateTab={handleSelectTab} />;
        case 'estudiantes':
        case 'control_escolar':
          return <StudentsModule />;
        case 'calificaciones':
        case 'reportes':
          return <GradesModule />;
        case 'docentes':
        case 'actividades_docentes':
          return <TeachersModule />;
        case 'materias':
          return <SubjectsModule />;
        case 'tareas_examenes':
          return <TasksExamsModule />;
        case 'incidencias':
          return <IncidentsModule />;
        case 'psicologia':
          return <PsychologyModule />;
        case 'biblioteca':
          return <LibraryModule />;
        case 'comunicados':
          return <NoticesModule />;
        case 'usuarios_colegio':
          return <UsersModule collegeIdFilter={activeCollege?.id || null} />;
        case 'personalizar':
        case 'personalizacion':
          return <CollegeCustomizerModule />;
        default:
          return <CollegeDashboard onNavigateTab={handleSelectTab} />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Top Header with direct Logout action */}
      <Header
        onOpenSuperuserModal={() => setIsSuperuserModalOpen(true)}
        onOpenQuickLogin={() => setIsQuickLoginOpen(true)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar with direct Logout action */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          onLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderCurrentView()}
        </main>
      </div>

      {/* Global Modals */}
      <SuperuserCredentialsModal
        isOpen={isSuperuserModalOpen}
        onClose={() => setIsSuperuserModalOpen(false)}
      />

      <QuickLoginModal
        isOpen={isQuickLoginOpen}
        onClose={() => setIsQuickLoginOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
