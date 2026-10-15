import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { useAppStore } from './store';
import { Worker } from './types';

// Modals
import { AadhaarKYCModal } from './components/modals/AadhaarKYCModal';
import { SkillQuizModal } from './components/modals/SkillQuizModal';
import { RazorpayCheckoutModal } from './components/modals/RazorpayCheckoutModal';
import { WhatsAppBotModal } from './components/modals/WhatsAppBotModal';
import { IVRSimulatorModal } from './components/modals/IVRSimulatorModal';
import { PrivacyConsentModal } from './components/modals/PrivacyConsentModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { WorkerVoiceRegistrationPage } from './pages/WorkerVoiceRegistrationPage';
import { WorkerDashboard } from './pages/WorkerDashboard';
import { WorkerProfilePage } from './pages/WorkerProfilePage';
import { EmployerDashboard } from './pages/EmployerDashboard';
import { AIVoiceJobMatchPage } from './pages/AIVoiceJobMatchPage';
import { HireFlowPage } from './pages/HireFlowPage';
import { EmployerJobsPage } from './pages/EmployerJobsPage';
import { EnterprisePortal } from './pages/EnterprisePortal';
import { AdminDashboard } from './pages/AdminDashboard';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DeveloperPortal } from './pages/DeveloperPortal';
import { UnitTestsPage } from './pages/UnitTestsPage';
import { LegalCompliancePage } from './pages/LegalCompliancePage';

export default function App() {
  const { activeModal, openModal, theme, userRole, isAuthenticated } = useAppStore();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [legalSubTab, setLegalSubTab] = useState<'terms' | 'privacy' | 'grievance' | 'sandbox-disclaimer'>('privacy');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('w-ngp-01');
  const [hireTargetWorker, setHireTargetWorker] = useState<Worker | undefined>(undefined);

  const openLegalPage = (subTab: 'terms' | 'privacy' | 'grievance' | 'sandbox-disclaimer') => {
    setLegalSubTab(subTab);
    setCurrentTab('legal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (tab: string, data?: unknown) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectWorkerForProfile = (workerId: string) => {
    setSelectedWorkerId(workerId);
    setCurrentTab('worker-profile');
  };

  const handleHireWorker = (worker: Worker) => {
    setHireTargetWorker(worker);
    setCurrentTab('hire');
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="min-h-screen bg-amber-50/25 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
        {/* Navigation Bar */}
        <Navbar currentTab={currentTab} onNavigate={handleNavigate} />

        {/* Main Content View */}
        <main className="flex-1">
          {currentTab === 'home' && <LandingPage onNavigate={handleNavigate} />}

          {currentTab === 'auth' && (
            <AuthPage onSuccessNavigate={(tab) => setCurrentTab(tab)} />
          )}

          {currentTab === 'voice-register' && (
            <WorkerVoiceRegistrationPage onSuccessNavigate={(tab) => setCurrentTab(tab)} />
          )}

          {currentTab === 'worker-dashboard' && (
            <WorkerDashboard onNavigate={handleNavigate} />
          )}

          {currentTab === 'worker-profile' && (
            <WorkerProfilePage
              workerId={selectedWorkerId}
              onBack={() => setCurrentTab('employer-dashboard')}
              onHireWorker={handleHireWorker}
            />
          )}

          {currentTab === 'employer-dashboard' && (
            <EmployerDashboard
              onNavigate={handleNavigate}
              onSelectWorkerForProfile={handleSelectWorkerForProfile}
              onHireWorker={handleHireWorker}
            />
          )}

          {currentTab === 'ai-voice-match' && (
            <AIVoiceJobMatchPage
              onHireWorker={handleHireWorker}
              onSelectWorkerForProfile={handleSelectWorkerForProfile}
            />
          )}

          {currentTab === 'hire' && (
            <HireFlowPage
              initialWorker={hireTargetWorker}
              onBack={() => setCurrentTab('employer-dashboard')}
              onJobCreated={() => setCurrentTab('employer-jobs')}
            />
          )}

          {currentTab === 'employer-jobs' && <EmployerJobsPage />}

          {currentTab === 'enterprise' && <EnterprisePortal />}

          {currentTab === 'admin-dashboard' && <AdminDashboard />}

          {currentTab === 'analytics' && <AnalyticsPage />}

          {currentTab === 'developer' && <DeveloperPortal />}

          {currentTab === 'unit-tests' && <UnitTestsPage />}

          {currentTab === 'legal' && (
            <LegalCompliancePage
              initialTab={legalSubTab}
              onBack={() => setCurrentTab('home')}
            />
          )}
        </main>

        {/* Global Modals */}
        {activeModal === 'aadhaar' && <AadhaarKYCModal />}
        {activeModal === 'quiz' && <SkillQuizModal />}
        {activeModal === 'razorpay' && <RazorpayCheckoutModal />}
        {activeModal === 'whatsapp' && <WhatsAppBotModal />}
        {activeModal === 'ivr' && <IVRSimulatorModal />}
        {activeModal === 'privacy' && <PrivacyConsentModal />}

        {/* Comprehensive Accessible Footer */}
        <footer className="border-t border-orange-200/80 bg-white py-10 dark:border-slate-800 dark:bg-slate-900 text-xs">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-600 text-white font-black text-sm">
                  SB
                </div>
                <div>
                  <div className="font-black text-slate-900 dark:text-white">SkillBridge India</div>
                  <div className="text-[11px] text-slate-500">
                    Voice-Powered Hiring for India's 500 Million Informal Workers
                  </div>
                </div>
              </div>

              {/* Quick Simulator Launchers, Legal & Privacy links */}
              <div className="flex flex-wrap items-center gap-3 font-semibold text-slate-600 dark:text-slate-300 text-[11px]">
                <button
                  onClick={() => openLegalPage('privacy')}
                  className="hover:text-orange-600 transition"
                >
                  DPDP Act Privacy Policy
                </button>
                <span>•</span>
                <button
                  onClick={() => openLegalPage('terms')}
                  className="hover:text-orange-600 transition"
                >
                  Terms of Service
                </button>
                <span>•</span>
                <button
                  onClick={() => openLegalPage('grievance')}
                  className="hover:text-orange-600 transition"
                >
                  Grievance Officer
                </button>
                <span>•</span>
                <button
                  onClick={() => openLegalPage('sandbox-disclaimer')}
                  className="hover:text-amber-600 transition"
                >
                  Sandbox Disclosures
                </button>
                <span>•</span>
                <button
                  onClick={() => openModal('whatsapp')}
                  className="hover:text-emerald-600 transition"
                >
                  WhatsApp Bot
                </button>
                <span>•</span>
                <button
                  onClick={() => openModal('ivr')}
                  className="hover:text-orange-600 transition"
                >
                  IVR Phone
                </button>
                <span>•</span>
                <button
                  onClick={() => setCurrentTab('unit-tests')}
                  className="hover:text-teal-600 font-mono transition"
                >
                  Unit Tests
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
              <p>© 2026 SkillBridge Technologies. Powered by Google Gemini API • Escrow-Style Held Payments (Sandbox Mode - requires RBI-authorized banking partner in production).</p>
              <p>Supports 12 Indian Languages • WCAG AA Accessible • Low-Literacy Voice First</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
