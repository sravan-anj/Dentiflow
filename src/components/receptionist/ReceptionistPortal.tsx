import React, { useState, useEffect } from 'react';
import { Invoice, Patient } from '../../types';
import { ReceptionistLogin } from './ReceptionistLogin';
import { ReceptionistDashboard } from './ReceptionistDashboard';

interface ReceptionistPortalProps {
  invoices: Invoice[];
  patients: Patient[];
  onSaveInvoices: (invoices: Invoice[]) => void;
  onSavePatients?: (patients: Patient[]) => void;
  onNavigateHome: () => void;
}

export const ReceptionistPortal: React.FC<ReceptionistPortalProps> = ({
  invoices,
  patients,
  onSaveInvoices,
  onSavePatients,
  onNavigateHome
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('oralix_receptionist_authenticated') === 'true';
    } catch (_) {
      return false;
    }
  });

  const handleLoginSuccess = () => {
    try {
      sessionStorage.setItem('oralix_receptionist_authenticated', 'true');
    } catch (_) {}
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('oralix_receptionist_authenticated');
    } catch (_) {}
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <ReceptionistLogin
        onLoginSuccess={handleLoginSuccess}
        onNavigateHome={onNavigateHome}
      />
    );
  }

  return (
    <ReceptionistDashboard
      invoices={invoices}
      patients={patients}
      onSaveInvoices={onSaveInvoices}
      onSavePatients={onSavePatients}
      onLogout={handleLogout}
      onNavigateHome={onNavigateHome}
    />
  );
};
