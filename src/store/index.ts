import { create } from 'zustand';
import { Worker, Employer, UserRole, LanguageCode } from '../types';
import { workersRepo, employersRepo, initDatabase } from '../services/db';

interface AppState {
  // Auth
  isAuthenticated: boolean;
  userRole: UserRole | null;
  currentWorker: Worker | null;
  currentEmployer: Employer | null;
  adminEmail: string | null;

  // Language & Accessibility
  currentLang: LanguageCode;
  speechEnabled: boolean;
  theme: 'light' | 'dark';

  // Filters & Search
  searchQuery: string;
  selectedCity: string;
  selectedSkill: string;
  radiusKm: number;
  minRating: number;
  verifiedOnly: boolean;
  availableOnly: boolean;
  viewMode: 'grid' | 'map';

  // Modals & Simulators
  activeModal: 'aadhaar' | 'quiz' | 'whatsapp' | 'ivr' | 'privacy' | 'razorpay' | null;
  modalData: unknown;

  // Actions
  loginAsWorker: (workerId: string) => void;
  loginAsEmployer: (employerId: string) => void;
  loginAsAdmin: () => void;
  loginWithPhone: (phone: string, role: UserRole) => void;
  logout: () => void;
  setLanguage: (lang: LanguageCode) => void;
  setSpeechEnabled: (enabled: boolean) => void;
  toggleTheme: () => void;

  setSearchQuery: (query: string) => void;
  setSelectedCity: (city: string) => void;
  setSelectedSkill: (skill: string) => void;
  setRadiusKm: (radius: number) => void;
  setMinRating: (rating: number) => void;
  setVerifiedOnly: (val: boolean) => void;
  setAvailableOnly: (val: boolean) => void;
  setViewMode: (mode: 'grid' | 'map') => void;

  openModal: (modal: AppState['activeModal'], data?: unknown) => void;
  closeModal: () => void;
  refreshUserData: () => void;
}

// Ensure database seeded
initDatabase();

export const useAppStore = create<AppState>((set, get) => ({
  // Defaults
  isAuthenticated: false,
  userRole: null,
  currentWorker: null,
  currentEmployer: null,
  adminEmail: null,

  currentLang: 'hi', // default Indian vernacular (Hindi), switcher available everywhere
  speechEnabled: true,
  theme: 'light',

  searchQuery: '',
  selectedCity: 'Nagpur',
  selectedSkill: 'All Skills',
  radiusKm: 25,
  minRating: 0,
  verifiedOnly: false,
  availableOnly: false,
  viewMode: 'grid',

  activeModal: null,
  modalData: null,

  loginAsWorker: (workerId: string) => {
    const worker = workersRepo.getById(workerId) || workersRepo.getAll()[0];
    set({
      isAuthenticated: true,
      userRole: 'worker',
      currentWorker: worker,
      currentEmployer: null,
      adminEmail: null
    });
  },

  loginAsEmployer: (employerId: string) => {
    const employer = employersRepo.getById(employerId) || employersRepo.getAll()[0];
    set({
      isAuthenticated: true,
      userRole: 'employer',
      currentEmployer: employer,
      currentWorker: null,
      adminEmail: null
    });
  },

  loginAsAdmin: () => {
    set({
      isAuthenticated: true,
      userRole: 'admin',
      adminEmail: 'admin@skillbridge.gov.in',
      currentWorker: null,
      currentEmployer: null
    });
  },

  loginWithPhone: (phone: string, role: UserRole) => {
    const clean = phone.replace(/\D/g, '');
    if (role === 'worker') {
      let worker = workersRepo.getByPhone(phone);
      if (!worker) {
        // Create new worker profile placeholder
        worker = {
          id: `w-new-${Date.now()}`,
          phone: `+91 ${clean.slice(-10)}`,
          name: 'नया कारीगर (New Worker)',
          primarySkill: 'Electrician',
          secondarySkills: [],
          experienceYears: 1,
          languagesSpoken: ['Hindi'],
          district: 'Nagpur',
          state: 'Maharashtra',
          pincode: '440001',
          lat: 21.1458,
          lng: 79.0882,
          aadhaarVerified: false,
          reputationScore: 5.0,
          totalJobs: 0,
          isAvailable: true,
          status: 'pending_kyc',
          verifiedSkillBadges: [],
          createdAt: new Date().toISOString(),
          dailyWageExpected: 750
        };
        workersRepo.save(worker);
      }
      set({
        isAuthenticated: true,
        userRole: 'worker',
        currentWorker: worker,
        currentEmployer: null,
        adminEmail: null
      });
    } else if (role === 'employer') {
      let employer = employersRepo.getByPhone(phone);
      if (!employer) {
        employer = {
          id: `emp-new-${Date.now()}`,
          phone: `+91 ${clean.slice(-10)}`,
          email: 'employer@skillbridge.in',
          name: 'नया नियोक्ता (New Employer)',
          employerType: 'household',
          district: 'Nagpur',
          state: 'Maharashtra',
          lat: 21.1458,
          lng: 79.0882,
          plan: 'free',
          totalHires: 0,
          walletBalanceInr: 2000
        };
        employersRepo.save(employer);
      }
      set({
        isAuthenticated: true,
        userRole: 'employer',
        currentEmployer: employer,
        currentWorker: null,
        adminEmail: null
      });
    } else {
      get().loginAsAdmin();
    }
  },

  logout: () => {
    set({
      isAuthenticated: false,
      userRole: null,
      currentWorker: null,
      currentEmployer: null,
      adminEmail: null,
      activeModal: null
    });
  },

  setLanguage: (lang: LanguageCode) => set({ currentLang: lang }),
  setSpeechEnabled: (enabled: boolean) => set({ speechEnabled: enabled }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSelectedCity: (city: string) => set({ selectedCity: city }),
  setSelectedSkill: (skill: string) => set({ selectedSkill: skill }),
  setRadiusKm: (radius: number) => set({ radiusKm: radius }),
  setMinRating: (rating: number) => set({ minRating: rating }),
  setVerifiedOnly: (val: boolean) => set({ verifiedOnly: val }),
  setAvailableOnly: (val: boolean) => set({ availableOnly: val }),
  setViewMode: (mode: 'grid' | 'map') => set({ viewMode: mode }),

  openModal: (modal, data) => set({ activeModal: modal, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  refreshUserData: () => {
    const { currentWorker, currentEmployer } = get();
    if (currentWorker) {
      const fresh = workersRepo.getById(currentWorker.id);
      if (fresh) set({ currentWorker: fresh });
    }
    if (currentEmployer) {
      const fresh = employersRepo.getById(currentEmployer.id);
      if (fresh) set({ currentEmployer: fresh });
    }
  }
}));
