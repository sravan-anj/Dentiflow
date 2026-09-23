import React, { useState, useEffect, useCallback } from 'react';
import { StorageService } from './utils/storage';
import { BackgroundStorage } from './utils/backgroundStorage';
import { SecurityService } from './utils/security';
import { BackgroundConfig } from './types/background';
import {
  User,
  UserRole,
  Patient,
  Appointment,
  ToothFinding,
  TreatmentPlan,
  ClinicalNote,
  Invoice,
  InventoryItem,
  StaffMember,
  QueueItem,
  ToothConditionType
} from './types';
import { ToastProvider, useToast } from './components/common/Toast';
import { AuthScreen } from './components/auth/AuthScreen';
import { LandingPage } from './components/landing/LandingPage';
import { SignInPage } from './components/auth/SignInPage';
import { SignUpPage } from './components/auth/SignUpPage';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { DentalChart } from './components/odontogram/DentalChart';
import { AppointmentsView } from './components/appointments/AppointmentsView';
import { QueueView } from './components/queue/QueueView';
import { PatientsView } from './components/patients/PatientsView';
import { TreatmentPlansView } from './components/treatment/TreatmentPlansView';
import { ClinicalNotesView } from './components/clinical/ClinicalNotesView';
import { BillingView } from './components/billing/BillingView';
import { InventoryView } from './components/inventory/InventoryView';
import { StaffView } from './components/staff/StaffView';
import { ReportsView } from './components/reports/ReportsView';
import { PublicBookingModal } from './components/portal/PublicBookingModal';
import { PublicQueuePortal } from './components/portal/PublicQueuePortal';
import { AppBackground } from './components/background/AppBackground';
import { BackgroundManagerModal } from './components/background/BackgroundManagerModal';
import { SecurityModal } from './components/security/SecurityModal';
import { LockScreen } from './components/security/LockScreen';
import { SecurityAuditModal } from './components/security/SecurityAuditModal';
import { ProfileView } from './components/profile/ProfileView';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { EditProfileModal } from './components/profile/EditProfileModal';
import { AccountAccessView } from './components/accountAccess/AccountAccessView';
import { ShieldCheck } from 'lucide-react';

function MainApp() {
  const { showToast } = useToast();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageService.getCurrentUser());
  const [adminOriginalUser, setAdminOriginalUser] = useState<User | null>(null);

  const handleAccessAccountFromAdmin = (targetUser: User) => {
    const isMasterAdmin = currentUser?.role === 'admin' || adminOriginalUser?.role === 'admin';
    if (!isMasterAdmin) {
      showToast('Security Denial: Accessing accounts is strictly restricted to Master Admin.', 'error');
      return;
    }
    if (!adminOriginalUser && currentUser) {
      setAdminOriginalUser(currentUser);
    }
    setCurrentUser(targetUser);
    if (targetUser.role === 'patient') {
      setActiveTab('dashboard');
    } else if (targetUser.role === 'doctor') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('account-access');
    }
    showToast(`Admin View Mode Active: Currently inspecting context for ${targetUser.name} (${targetUser.role.toUpperCase()})`, 'info');
  };

  const handleReturnToAdmin = () => {
    if (adminOriginalUser) {
      setCurrentUser(adminOriginalUser);
      setAdminOriginalUser(null);
      setActiveTab('account-access');
      showToast('Returned to Master Admin Account', 'success');
    }
  };

  // Pending Booking Intent State for Unauthenticated Visitors
  const [pendingBookingIntent, setPendingBookingIntent] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('book') || path.includes('appointment')) return true;
    }
    return false;
  });

  // Public View Routing (Landing Page vs Dedicated Auth Pages)
  const [publicView, setPublicView] = useState<'landing' | 'signin' | 'signup'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('signin') || path.includes('login')) return 'signin';
      if (path.includes('signup') || path.includes('register')) return 'signup';
      if (path.includes('book') || path.includes('appointment')) return 'signin';
    }
    return 'landing';
  });

  const handleNavigateAuth = (mode: 'landing' | 'signin' | 'signup') => {
    setPublicView(mode);
    const path = mode === 'landing' ? '/' : `/${mode}`;
    try {
      window.history.pushState(null, '', path);
    } catch (_) {}
  };

  // Booking CTA Handler: Enforces authentication gate for appointment booking
  const handleOpenBookingRequest = useCallback(() => {
    if (!currentUser) {
      setPendingBookingIntent(true);
      handleNavigateAuth('signin');
      showToast('Authentication Required: Please sign in or register to book an appointment.', 'info');
      return;
    }

    if (currentUser.role === 'patient') {
      setActiveTab('appointments');
    }
    setIsBookingModalOpen(true);
  }, [currentUser, showToast]);

  // Auto-resume appointment booking flow after successful sign in or sign up
  useEffect(() => {
    if (currentUser && pendingBookingIntent) {
      setPendingBookingIntent(false);
      if (currentUser.role === 'patient') {
        setActiveTab('appointments');
      }
      setIsBookingModalOpen(true);
      showToast(`Welcome back, ${currentUser.name}! Resuming your appointment booking.`, 'success');
    }
  }, [currentUser, pendingBookingIntent, showToast]);

  // Background Visual Theme State
  const [backgroundConfig, setBackgroundConfig] = useState<BackgroundConfig>(() => BackgroundStorage.getConfig());
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);

  // Security States
  const [isTerminalLocked, setIsTerminalLocked] = useState<boolean>(() => SecurityService.isTerminalLocked());
  const [isSecurityAuditOpen, setIsSecurityAuditOpen] = useState(false);
  const [securityModalTarget, setSecurityModalTarget] = useState<'doctor' | 'admin' | null>(null);

  // Domain Datasets from LocalStorage
  const [patients, setPatients] = useState<Patient[]>(() => StorageService.getPatients());
  const [appointments, setAppointments] = useState<Appointment[]>(() => StorageService.getAppointments());
  const [toothFindings, setToothFindings] = useState<ToothFinding[]>(() => StorageService.getToothFindings());
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>(() => StorageService.getTreatmentPlans());
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>(() => StorageService.getClinicalNotes());
  const [invoices, setInvoices] = useState<Invoice[]>(() => StorageService.getInvoices());
  const [inventory, setInventory] = useState<InventoryItem[]>(() => StorageService.getInventory());
  const [staff, setStaff] = useState<StaffMember[]>(() => StorageService.getStaff());
  const [queue, setQueue] = useState<QueueItem[]>(() => StorageService.getQueue());

  // UI Navigation & Modal states
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => patients[0]?.id || 'p-1');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isQueuePortalOpen, setIsQueuePortalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Update current user details and sync with persistent storage
  const handleUpdateCurrentUser = (updated: User) => {
    setCurrentUser(updated);
    StorageService.updateUser(updated);
  };

  // Sync state helpers to persistent StorageService
  const handleSaveAppointments = (updated: Appointment[]) => {
    if (!currentUser) {
      showToast('Security Violation (401 Unauthenticated): Appointment creation rejected.', 'error');
      SecurityService.logEvent({
        type: 'UNAUTHORIZED_ACCESS_BLOCKED',
        actor: 'Unauthenticated Visitor',
        targetRole: 'patient',
        details: 'Blocked unauthenticated attempt to save appointment booking.',
        status: 'CRITICAL'
      });
      return;
    }
    setAppointments(updated);
    StorageService.saveAppointments(updated);
  };

  const handleSavePatients = (updated: Patient[]) => {
    setPatients(updated);
    StorageService.savePatients(updated);
  };

  const handleSaveQueue = (updated: QueueItem[]) => {
    setQueue(updated);
    StorageService.saveQueue(updated);
  };

  const handleSaveToothFindings = (updated: ToothFinding[]) => {
    setToothFindings(updated);
    StorageService.saveToothFindings(updated);
  };

  const handleSaveTreatmentPlans = (updated: TreatmentPlan[]) => {
    setTreatmentPlans(updated);
    StorageService.saveTreatmentPlans(updated);
  };

  const handleSaveClinicalNotes = (updated: ClinicalNote[]) => {
    setClinicalNotes(updated);
    StorageService.saveClinicalNotes(updated);
  };

  const handleSaveInvoices = (updated: Invoice[]) => {
    setInvoices(updated);
    StorageService.saveInvoices(updated);
  };

  const handleSaveInventory = (updated: InventoryItem[]) => {
    setInventory(updated);
    StorageService.saveInventory(updated);
  };

  const handleSaveStaff = (updated: StaffMember[]) => {
    setStaff(updated);
    StorageService.saveStaff(updated);
  };

  // Add finding and sync to plan
  const handleUpdateFinding = (newFinding: ToothFinding) => {
    const existingIndex = toothFindings.findIndex(
      f => f.patientId === newFinding.patientId && f.toothNumber === newFinding.toothNumber
    );
    let updated: ToothFinding[];
    if (existingIndex >= 0) {
      updated = [...toothFindings];
      updated[existingIndex] = newFinding;
    } else {
      updated = [...toothFindings, newFinding];
    }
    handleSaveToothFindings(updated);
  };

  const handleAddToTreatmentPlan = (
    toothNumber: number,
    diagnosis: string,
    condition: ToothConditionType
  ) => {
    const currentPatient = patients.find(p => p.id === selectedPatientId) || patients[0];
    const existingPlan = treatmentPlans.find(p => p.patientId === currentPatient.id);

    const procName =
      condition === 'root_canal'
        ? `Molar Endodontic Therapy (Tooth #${toothNumber})`
        : condition === 'crown'
        ? `Zirconia Full Crown (Tooth #${toothNumber})`
        : condition === 'cavity'
        ? `Composite Resin Restoration (Tooth #${toothNumber})`
        : `Clinical Procedure (Tooth #${toothNumber})`;

    const procFee = condition === 'root_canal' ? 9500 : condition === 'crown' ? 8500 : 3500;

    if (existingPlan) {
      const updatedPlan: TreatmentPlan = {
        ...existingPlan,
        totalCost: existingPlan.totalCost + procFee,
        patientPortion: existingPlan.patientPortion + procFee,
        procedures: [
          ...existingPlan.procedures,
          {
            id: `proc-${Date.now()}`,
            toothNumber: toothNumber,
            code: 'D2391',
            name: procName,
            fee: procFee,
            status: 'pending'
          }
        ]
      };
      const updatedPlans = treatmentPlans.map(p =>
        p.id === existingPlan.id ? updatedPlan : p
      );
      handleSaveTreatmentPlans(updatedPlans);
    } else {
      const newPlan: TreatmentPlan = {
        id: `plan-${Date.now()}`,
        patientId: currentPatient.id,
        patientName: currentPatient.name,
        doctorName: currentUser?.name || 'Dr. Ananya Sharma',
        dateCreated: new Date().toISOString().split('T')[0],
        status: 'proposed',
        title: `Restorative Care Plan - Tooth #${toothNumber}`,
        phase: 'Phase 1: Urgent Relief',
        totalCost: procFee,
        discount: 0,
        insuranceCovered: 0,
        patientPortion: procFee,
        procedures: [
          {
            id: `proc-${Date.now()}`,
            toothNumber: toothNumber,
            code: 'D2391',
            name: procName,
            fee: procFee,
            status: 'pending'
          }
        ]
      };
      handleSaveTreatmentPlans([newPlan, ...treatmentPlans]);
    }
  };

  // Secure Role Switching with Security Clearance Enforcement
  const executeRoleSwitch = useCallback((newRole: UserRole) => {
    const users = StorageService.getUsers();
    const targetUser = users.find(u => u.role === newRole);
    if (targetUser) {
      setCurrentUser(targetUser);
      StorageService.saveCurrentUser(targetUser);
      showToast(`Security Clearance Verified: Switched to ${newRole.toUpperCase()} portal`, 'success');
      if (newRole === 'patient') {
        setActiveTab('dashboard');
      }
    }
  }, [showToast]);

  const handleRequestSwitchRole = (newRole: UserRole) => {
    if (!currentUser || currentUser.role === newRole) return;

    // Direct switch to patient mode is allowed without doctor clearance
    if (newRole === 'patient') {
      executeRoleSwitch('patient');
      return;
    }

    // Switching to Doctor or Admin REQUIRES security clearance PIN!
    setSecurityModalTarget(newRole);
  };

  // Workstation Lock Handling
  const handleLockTerminal = () => {
    if (!currentUser) return;
    SecurityService.setTerminalLocked(true, currentUser.name);
    setIsTerminalLocked(true);
    showToast('Workstation locked to prevent unauthorized tampering', 'info');
  };

  const handleUnlockTerminal = () => {
    setIsTerminalLocked(false);
    showToast('Workstation unlocked. Welcome back.', 'success');
  };

  // Inactivity Auto-Lock Listener
  useEffect(() => {
    if (!currentUser || isTerminalLocked) return;

    const creds = SecurityService.getCredentials();
    if (creds.autoLockMinutes <= 0) return;

    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        SecurityService.setTerminalLocked(true, `${currentUser.name} (Idle Auto-Lock)`);
        setIsTerminalLocked(true);
      }, creds.autoLockMinutes * 60 * 1000);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [currentUser, isTerminalLocked]);

  // Patient & Doctor RBAC Safety Gate
  const handleNavigateTab = (tab: ActiveTab) => {
    if (currentUser?.role === 'patient') {
      const allowedPatientTabs: ActiveTab[] = ['dashboard', 'appointments', 'chart', 'treatment-plans', 'billing', 'profile'];
      if (!allowedPatientTabs.includes(tab)) {
        SecurityService.logEvent({
          type: 'UNAUTHORIZED_ACCESS_BLOCKED',
          actor: currentUser.name,
          targetRole: 'staff',
          details: `Blocked unauthorized patient attempt to navigate to '${tab}' section`,
          status: 'CRITICAL'
        });
        showToast('Unauthorized Access Denied: Staff clearance required.', 'error');
        return;
      }
    }

    if (currentUser?.role === 'doctor') {
      if (tab === 'account-access') {
        SecurityService.logEvent({
          type: 'UNAUTHORIZED_ACCESS_BLOCKED',
          actor: currentUser.name,
          targetRole: 'admin',
          details: `Blocked doctor attempt to access Admin Account Access`,
          status: 'CRITICAL'
        });
        showToast('Security Denial: Account Access is strictly restricted to Master Admin.', 'error');
        return;
      }
    }

    setActiveTab(tab);
  };

  const handleLogout = () => {
    SecurityService.logEvent({
      type: 'AUTH_LOGOUT',
      actor: currentUser?.name || 'User',
      targetRole: currentUser?.role || 'user',
      details: 'User voluntarily signed out of terminal',
      status: 'SUCCESS'
    });
    StorageService.clearCurrentUser();
    setCurrentUser(null);
    handleNavigateAuth('landing');
    showToast('Signed out of DentiFlow', 'info');
  };

  // If user not authenticated, render Level 10 Public Ecosystem (Landing, Sign-in, or Sign-up)
  if (!currentUser) {
    return (
      <div className="landing-ecosystem min-h-screen bg-slate-950 text-white">
        {publicView === 'signin' ? (
          <SignInPage
            onLogin={setCurrentUser}
            onNavigateLanding={() => handleNavigateAuth('landing')}
            onNavigateSignUp={() => handleNavigateAuth('signup')}
          />
        ) : publicView === 'signup' ? (
          <SignUpPage
            onLogin={setCurrentUser}
            onNavigateLanding={() => handleNavigateAuth('landing')}
            onNavigateSignIn={() => handleNavigateAuth('signin')}
          />
        ) : (
          <LandingPage
            onOpenBooking={handleOpenBookingRequest}
            onOpenPortal={() => setIsQueuePortalOpen(true)}
            onNavigateAuth={handleNavigateAuth}
          />
        )}

        {isQueuePortalOpen && (
          <PublicQueuePortal
            queue={queue}
            onClose={() => setIsQueuePortalOpen(false)}
          />
        )}
      </div>
    );
  }

  // If terminal is locked, render LockScreen
  if (isTerminalLocked) {
    return (
      <LockScreen
        currentUser={currentUser}
        onUnlock={handleUnlockTerminal}
        backgroundUrl={backgroundConfig.activeUrl}
      />
    );
  }

  return (
    <div className="workstation-mode min-h-screen relative flex flex-col font-sans text-white antialiased selection:bg-white/20 selection:text-white">
      {/* Interactive Cinematic Background with Presets (Denti 1 to 7) and Custom Uploads */}
      <AppBackground config={backgroundConfig} />

      {/* Sidebar Navigation */}
      <Sidebar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        onOpenBackgroundManager={() => setIsBackgroundModalOpen(true)}
        onOpenSecurityAudit={() => setIsSecurityAuditOpen(true)}
        onLockTerminal={handleLockTerminal}
      />

      {/* Main Content Area */}
      <div className="md:pl-60 flex flex-col min-h-screen relative z-10">
        {/* Top Navbar */}
        <Navbar
          currentUser={currentUser}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onRequestSwitchRole={handleRequestSwitchRole}
          searchQuery={globalSearch}
          setSearchQuery={setGlobalSearch}
          onOpenSearch={() => setIsSearchModalOpen(true)}
          onOpenBooking={() => setIsBookingModalOpen(true)}
          onOpenPortal={() => setIsQueuePortalOpen(true)}
          onOpenBackgroundManager={() => setIsBackgroundModalOpen(true)}
          onOpenSecurityAudit={() => setIsSecurityAuditOpen(true)}
          onLockTerminal={handleLockTerminal}
          onNavigateToProfile={() => handleNavigateTab('profile')}
          onOpenEditProfile={() => setIsEditProfileOpen(true)}
          onLogout={handleLogout}
        />

        {/* Admin View Mode Banner */}
        {adminOriginalUser && (
          <div className="bg-[#EDE8DE] border-b border-[#C8B58D]/40 px-4 py-2 text-xs font-bold text-[#252525] flex items-center justify-between shadow-xs z-20 relative">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C8B58D]" />
              <span>🔑 Admin Controlled View Mode: Active context for <strong>{currentUser.name}</strong> ({currentUser.role.toUpperCase()})</span>
            </div>
            <button
              onClick={handleReturnToAdmin}
              className="px-3 py-1 bg-[#252525] hover:bg-black text-white rounded-lg text-xs font-extrabold transition-all cursor-pointer shadow-xs"
            >
              Return to Master Admin
            </button>
          </div>
        )}

        {/* Dynamic Route View */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              patients={patients}
              appointments={appointments}
              queue={queue}
              invoices={invoices}
              treatmentPlans={treatmentPlans}
              onNavigate={handleNavigateTab}
              onOpenNewAppointment={() => setIsBookingModalOpen(true)}
              onSelectPatient={id => setSelectedPatientId(id)}
            />
          )}

          {activeTab === 'chart' && (
            <DentalChart
              currentUser={currentUser}
              patients={patients}
              selectedPatientId={selectedPatientId}
              onSelectPatient={id => setSelectedPatientId(id)}
              toothFindings={toothFindings}
              onUpdateFinding={handleUpdateFinding}
              onAddToTreatmentPlan={handleAddToTreatmentPlan}
            />
          )}

          {activeTab === 'appointments' && (
            <AppointmentsView
              currentUser={currentUser}
              appointments={appointments}
              patients={patients}
              onSaveAppointments={handleSaveAppointments}
              onSelectPatient={id => setSelectedPatientId(id)}
              onNavigateToChart={() => handleNavigateTab('chart')}
              isBookingModalOpen={isBookingModalOpen}
              setIsBookingModalOpen={setIsBookingModalOpen}
            />
          )}

          {activeTab === 'queue' && (
            <QueueView
              queue={queue}
              patients={patients}
              onSaveQueue={handleSaveQueue}
              onSelectPatient={id => setSelectedPatientId(id)}
              onNavigateToChart={() => handleNavigateTab('chart')}
            />
          )}

          {activeTab === 'patients' && (
            <PatientsView
              currentUser={currentUser}
              patients={patients}
              onSavePatients={handleSavePatients}
              onSelectPatient={id => setSelectedPatientId(id)}
              onNavigateToChart={() => handleNavigateTab('chart')}
            />
          )}

          {activeTab === 'treatment-plans' && (
            <TreatmentPlansView
              currentUser={currentUser}
              treatmentPlans={treatmentPlans}
              patients={patients}
              onSaveTreatmentPlans={handleSaveTreatmentPlans}
              onSelectPatient={id => setSelectedPatientId(id)}
              onNavigateToChart={() => handleNavigateTab('chart')}
            />
          )}

          {activeTab === 'clinical' && (
            <ClinicalNotesView
              currentUser={currentUser}
              notes={clinicalNotes}
              patients={patients}
              onSaveNotes={handleSaveClinicalNotes}
              onSelectPatient={id => setSelectedPatientId(id)}
              onNavigateToChart={() => handleNavigateTab('chart')}
            />
          )}

          {activeTab === 'billing' && (
            <BillingView
              currentUser={currentUser}
              invoices={invoices}
              patients={patients}
              onSaveInvoices={handleSaveInvoices}
              onSelectPatient={id => setSelectedPatientId(id)}
              onNavigateToChart={() => handleNavigateTab('chart')}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              items={inventory}
              onSaveItems={handleSaveInventory}
            />
          )}

          {activeTab === 'staff' && (
            <StaffView
              staff={staff}
              onSaveStaff={handleSaveStaff}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              invoices={invoices}
              appointments={appointments}
              patients={patients}
            />
          )}

          {activeTab === 'account-access' && (
            <AccountAccessView
              currentUser={currentUser}
              patients={patients}
              onAccessAccount={handleAccessAccountFromAdmin}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              currentUser={currentUser}
              patients={patients}
              appointments={appointments}
              treatmentPlans={treatmentPlans}
              onUpdateUser={handleUpdateCurrentUser}
              onLockTerminal={handleLockTerminal}
              onOpenSecurityAudit={() => setIsSecurityAuditOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentUser={currentUser}
        onSaveUser={handleUpdateCurrentUser}
      />

      {/* Interactive Clinic Background Themes Modal */}
      <BackgroundManagerModal
        isOpen={isBackgroundModalOpen}
        onClose={() => setIsBackgroundModalOpen(false)}
        config={backgroundConfig}
        onUpdateConfig={setBackgroundConfig}
      />

      {/* Security Clearance Modal for Protected Role Switching */}
      <SecurityModal
        isOpen={Boolean(securityModalTarget)}
        onClose={() => setSecurityModalTarget(null)}
        targetRole={securityModalTarget || 'doctor'}
        targetFeatureName={securityModalTarget === 'admin' ? 'Clinic Administrator Portal' : 'Dentist & Clinician Terminal'}
        actorName={currentUser.name}
        onSuccess={() => {
          if (securityModalTarget) {
            executeRoleSwitch(securityModalTarget);
          }
        }}
      />

      {/* Security Operations & Audit Modal */}
      <SecurityAuditModal
        isOpen={isSecurityAuditOpen}
        onClose={() => setIsSecurityAuditOpen(false)}
        currentUserRole={currentUser.role}
      />

      {/* Public Online Booking Modal */}
      <PublicBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        existingPatients={patients}
        onBookAppointment={newApt => {
          handleSaveAppointments([newApt, ...appointments]);
        }}
      />

      {/* Public TV Queue Board Display */}
      {isQueuePortalOpen && (
        <PublicQueuePortal
          queue={queue}
          onClose={() => setIsQueuePortalOpen(false)}
        />
      )}

      {/* Global Doctor Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        searchQuery={globalSearch}
        setSearchQuery={setGlobalSearch}
        patients={patients}
        appointments={appointments}
        toothFindings={toothFindings}
        invoices={invoices}
        currentUser={currentUser}
        onSelectPatient={id => setSelectedPatientId(id)}
        onNavigate={handleNavigateTab}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
