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
import { LandingPage } from './components/landing/LandingPage';
import { SignInPage } from './components/auth/SignInPage';
import { SignUpPage } from './components/auth/SignUpPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { AuthService } from './utils/authService';
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
import { FeedbackView } from './components/feedback/FeedbackView';
import { GrowthView } from './components/growth/GrowthView';
import { SettingsView } from './components/settings/SettingsView';
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

  // Sync session with backend on initial load
  useEffect(() => {
    AuthService.checkSession().then(user => {
      if (user) {
        setCurrentUser(user);
      }
    });
  }, []);

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
    } else if (targetUser.role === 'receptionist') {
      setActiveTab('billing');
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
  type PublicViewType = 'landing' | 'signin' | 'signup' | 'forgot-password' | 'reset-password';

  const getInitialPublicView = (): PublicViewType => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      const hasResetToken = new URLSearchParams(window.location.search).has('token');
      if (path.includes('reset-password') || hasResetToken) return 'reset-password';
      if (path.includes('forgot-password') || path.includes('forgot')) return 'forgot-password';
      if (path.includes('signin') || path.includes('login')) return 'signin';
      if (path.includes('signup') || path.includes('register')) return 'signup';
      if (path.includes('book') || path.includes('appointment')) return 'signin';
    }
    return 'landing';
  };

  const [publicView, setPublicView] = useState<PublicViewType>(getInitialPublicView);

  const handleNavigateAuth = (mode: PublicViewType) => {
    setPublicView(mode);
    const path = mode === 'landing' ? '/' : `/${mode}`;
    try {
      window.history.pushState(null, '', path);
    } catch (_) {}
  };

  // Listen to browser back/forward history navigation
  useEffect(() => {
    const handlePopState = () => {
      setPublicView(getInitialPublicView());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const cur = StorageService.getCurrentUser();
    return cur?.role === 'receptionist' ? 'billing' : 'dashboard';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => {
    const cur = StorageService.getCurrentUser();
    if (cur?.role === 'patient') {
      return cur.patientId || cur.id;
    }
    return patients[0]?.id || 'p-1';
  });
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isQueuePortalOpen, setIsQueuePortalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Synchronize patient records whenever current authenticated user changes
  useEffect(() => {
    if (currentUser && currentUser.role === 'patient') {
      const ensured = StorageService.ensurePatientRecord(currentUser);
      setPatients(prev => {
        if (!prev.some(p => p.id === ensured.id)) {
          return [ensured, ...prev];
        }
        return prev;
      });
      setSelectedPatientId(ensured.id);
    }
  }, [currentUser]);

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
    const targetPid = currentUser?.role === 'patient'
      ? (currentUser.patientId || currentUser.id)
      : selectedPatientId;
    const currentPatient = (currentUser?.role === 'patient' && currentUser)
      ? (patients.find(p => p.id === targetPid) || StorageService.ensurePatientRecord(currentUser))
      : (patients.find(p => p.id === targetPid) || patients[0]);
    if (!currentPatient) return;
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
      } else if (newRole === 'receptionist') {
        setActiveTab('billing');
      }
    }
  }, [showToast]);

  const handleRequestSwitchRole = (newRole: UserRole) => {
    if (!currentUser || currentUser.role === newRole) return;

    // Direct switch to patient or receptionist mode is allowed without doctor clearance
    if (newRole === 'patient' || newRole === 'receptionist') {
      executeRoleSwitch(newRole);
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

    let timeoutId: ReturnType<typeof setTimeout>;

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

  // Patient, Receptionist & Doctor RBAC Safety Gate
  const handleNavigateTab = (tab: ActiveTab) => {
    if (currentUser?.role === 'patient') {
      const allowedPatientTabs: ActiveTab[] = ['dashboard', 'appointments', 'chart', 'treatment-plans', 'billing', 'feedback', 'profile'];
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

    if (currentUser?.role === 'receptionist') {
      const allowedReceptionistTabs: ActiveTab[] = ['dashboard', 'billing', 'appointments', 'queue', 'patients', 'profile'];
      if (!allowedReceptionistTabs.includes(tab)) {
        showToast('Access Restricted: Front desk receptionists have clearance for Dashboard, Billing, Appointments, Queue, and Patients.', 'error');
        return;
      }
    }

    if (currentUser?.role === 'doctor') {
      if (tab === 'account-access' || tab === 'settings') {
        SecurityService.logEvent({
          type: 'UNAUTHORIZED_ACCESS_BLOCKED',
          actor: currentUser.name,
          targetRole: 'admin',
          details: `Blocked doctor attempt to access Admin ${tab}`,
          status: 'CRITICAL'
        });
        showToast(`Security Denial: ${tab === 'settings' ? 'Practice Settings' : 'Account Access'} is strictly restricted to Master Admin.`, 'error');
        return;
      }
    }

    setActiveTab(tab);
  };

  const handleLogout = () => {
    AuthService.logout(currentUser);
    setCurrentUser(null);
    handleNavigateAuth('landing');
    showToast('Signed out of DentiFlow', 'info');
  };

  // Determine if the URL or publicView explicitly targets the password reset or recovery flows
  const isResetPasswordRoute = typeof window !== 'undefined' && (
    window.location.pathname.toLowerCase().includes('reset-password') ||
    new URLSearchParams(window.location.search).has('token') ||
    publicView === 'reset-password'
  );

  const isForgotPasswordRoute = typeof window !== 'undefined' && (
    window.location.pathname.toLowerCase().includes('forgot-password') ||
    publicView === 'forgot-password'
  );

  // If user not authenticated, or accessing dedicated public reset flows:
  if (!currentUser || isResetPasswordRoute || isForgotPasswordRoute) {
    return (
      <div className="landing-ecosystem min-h-screen bg-slate-950 text-white">
        {isResetPasswordRoute || publicView === 'reset-password' ? (
          <ResetPasswordPage
            onNavigateSignIn={() => {
              StorageService.clearCurrentUser();
              setCurrentUser(null);
              handleNavigateAuth('signin');
            }}
            onNavigateForgotPassword={() => handleNavigateAuth('forgot-password')}
            onNavigateLanding={() => handleNavigateAuth('landing')}
          />
        ) : isForgotPasswordRoute || publicView === 'forgot-password' ? (
          <ForgotPasswordPage
            onNavigateSignIn={() => handleNavigateAuth('signin')}
            onNavigateLanding={() => handleNavigateAuth('landing')}
          />
        ) : publicView === 'signin' ? (
          <SignInPage
            onLogin={setCurrentUser}
            onNavigateLanding={() => handleNavigateAuth('landing')}
            onNavigateSignUp={() => handleNavigateAuth('signup')}
            onNavigateForgotPassword={() => handleNavigateAuth('forgot-password')}
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
              toothFindings={toothFindings}
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

          {activeTab === 'feedback' && (
            <FeedbackView currentUser={currentUser} />
          )}

          {activeTab === 'growth' && (
            <GrowthView currentUser={currentUser} />
          )}

          {activeTab === 'settings' && (
            <SettingsView currentUser={currentUser} />
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
        currentUser={currentUser}
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
