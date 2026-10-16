import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Globe,
  Bell,
  Sun,
  Moon,
  MessageSquare,
  PhoneCall,
  User,
  LogOut,
  Download,
  Menu,
  X,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useAppStore } from '../store';
import { SUPPORTED_LANGUAGES, speakVernacular, useTranslation } from '../i18n';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';
import { notificationsRepo } from '../services/db';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate }) => {
  const {
    isAuthenticated,
    userRole,
    currentWorker,
    currentEmployer,
    speechEnabled,
    theme,
    setLanguage,
    setSpeechEnabled,
    toggleTheme,
    logout,
    openModal
  } = useAppStore();

  const { t, currentLang, isRTL } = useTranslation();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  const langDropdownRef = useRef<HTMLDivElement>(null);

  const { isInstallable, install } = usePWAInstall();
  const isOnline = useOnlineStatus();

  // Close language menu on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLangMenuOpen(false);
      }
    };

    if (langMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [langMenuOpen]);

  // Notifications count
  const userId = currentWorker?.id || currentEmployer?.id || 'admin';
  const notifications = notificationsRepo.getByUser(userId);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  const handleSpeechToggle = () => {
    const nextState = !speechEnabled;
    setSpeechEnabled(nextState);
    if (nextState) {
      speakVernacular(t('nav.voiceAssistantEnabled'), currentLang);
    }
  };

  return (
    <>
      {/* Offline banner if disconnected */}
      {!isOnline && (
        <div className="bg-amber-500 py-1 px-4 text-center text-xs font-bold text-white flex items-center justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
          <span>{t('nav.offlineBanner')}</span>
        </div>
      )}

      <header className="sticky top-0 z-40 w-full border-b border-orange-200/80 bg-white/95 backdrop-blur shadow-sm dark:border-slate-800 dark:bg-slate-900/95 transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-2.5">
          {/* Brand Logo & Tagline */}
          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition">
              <span className="font-serif text-xl font-black">SB</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  SkillBridge
                </span>
                <span className="hidden sm:inline-block rounded-md bg-orange-100 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                  India
                </span>
              </div>
              <div className="hidden md:block text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {t('nav.tagline')}
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-1.5 rounded-xl transition ${
                currentTab === 'home'
                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t('nav.dashboard')}
            </button>

            <button
              onClick={() => onNavigate('employer-dashboard')}
              className={`px-3 py-1.5 rounded-xl transition ${
                currentTab === 'employer-dashboard'
                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t('nav.searchWorkers')}
            </button>

            <button
              onClick={() => onNavigate('ai-voice-match')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                currentTab === 'ai-voice-match'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-orange-600 dark:text-orange-400'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t('nav.postJob')}</span>
            </button>

            <button
              onClick={() => onNavigate('voice-register')}
              className={`px-3 py-1.5 rounded-xl transition ${
                currentTab === 'voice-register'
                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t('nav.voiceRegister')}
            </button>

            {/* Contextual links based on user role */}
            {userRole === 'worker' && (
              <>
                <button
                  onClick={() => onNavigate('worker-dashboard')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    currentTab === 'worker-dashboard'
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {t('dashboard.workerWelcome')}
                </button>
              </>
            )}

            {userRole === 'employer' && (
              <button
                onClick={() => onNavigate('employer-jobs')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  currentTab === 'employer-jobs'
                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {t('nav.myJobs')}
              </button>
            )}

            <button
              onClick={() => onNavigate('enterprise')}
              className={`px-3 py-1.5 rounded-xl transition ${
                currentTab === 'enterprise'
                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t('nav.enterprise')}
            </button>

            {userRole === 'admin' && (
              <>
                <button
                  onClick={() => onNavigate('admin-dashboard')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    currentTab === 'admin-dashboard'
                      ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {t('nav.platformKpis')}
                </button>
                <button
                  onClick={() => onNavigate('analytics')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    currentTab === 'analytics'
                      ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {t('nav.analytics')}
                </button>
                <button
                  onClick={() => onNavigate('developer')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    currentTab === 'developer'
                      ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {t('nav.developerApis')}
                </button>
              </>
            )}

            <button
              onClick={() => onNavigate('unit-tests')}
              className={`px-3 py-1.5 rounded-xl transition text-[11px] font-mono ${
                currentTab === 'unit-tests'
                  ? 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300'
                  : 'text-slate-500 hover:text-teal-600'
              }`}
            >
              {t('nav.tests')}
            </button>
          </nav>

          {/* Right Action Icons & Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* WhatsApp Simulator trigger */}
            <button
              type="button"
              onClick={() => openModal('whatsapp')}
              className="hidden sm:flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 transition"
              title={t('nav.whatsappBot')}
            >
              <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
              <span>{t('nav.whatsappBot')}</span>
            </button>

            {/* IVR Dialpad Simulator trigger */}
            <button
              type="button"
              onClick={() => openModal('ivr')}
              className="hidden sm:flex items-center gap-1 rounded-xl bg-orange-50 px-2.5 py-1.5 text-xs font-bold text-orange-700 border border-orange-200 hover:bg-orange-100 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800 transition"
              title={t('nav.phoneIvr')}
            >
              <PhoneCall className="h-3.5 w-3.5 text-orange-600" />
              <span>{t('nav.phoneIvr')}</span>
            </button>

            {/* Speech synthesis audio toggle for low-literacy users */}
            <button
              type="button"
              onClick={handleSpeechToggle}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                speechEnabled
                  ? 'border-orange-300 bg-orange-100 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300'
                  : 'border-slate-200 text-slate-400 dark:border-slate-800'
              }`}
              title={speechEnabled ? t('nav.voiceReaderOn') : t('nav.voiceReaderOff')}
              aria-label={speechEnabled ? t('nav.voiceReaderOn') : t('nav.voiceReaderOff')}
            >
              {speechEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {/* Accessible Language Picker Dropdown */}
            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                aria-haspopup="true"
                aria-expanded={langMenuOpen}
                aria-label={t('nav.language')}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 transition shadow-sm"
              >
                <span>{currentLangObj.flag}</span>
                <span className="font-semibold">{currentLangObj.nativeName}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {langMenuOpen && (
                <div
                  role="menu"
                  aria-orientation="vertical"
                  className={`absolute ${
                    isRTL ? 'left-0' : 'right-0'
                  } top-full mt-2 z-50 w-60 max-h-80 overflow-y-auto rounded-2xl bg-white p-2 text-xs shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 border dark:border-slate-800`}
                >
                  <div className="flex items-center justify-between px-2 py-1 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {t('nav.selectLang')}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setLangMenuOpen(false);
                        openModal('language');
                      }}
                      className="text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:underline"
                    >
                      {t('common.viewAll')}
                    </button>
                  </div>

                  <div className="space-y-0.5">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        role="menuitem"
                        tabIndex={0}
                        onClick={() => {
                          setLanguage(lang.code);
                          setLangMenuOpen(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            setLanguage(lang.code);
                            setLangMenuOpen(false);
                          }
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left font-semibold transition ${
                          currentLang === lang.code
                            ? 'bg-orange-600 text-white font-bold'
                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.nativeName}</span>
                        </span>
                        <span className="text-[10px] opacity-75">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Light/Dark Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              title={t('nav.themeToggle')}
              aria-label={t('nav.themeToggle')}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            {/* PWA Install Button */}
            {isInstallable && (
              <button
                type="button"
                onClick={install}
                className="hidden sm:flex items-center gap-1.5 rounded-xl bg-orange-600 px-3 py-1.5 text-xs font-black text-white shadow hover:bg-orange-500 transition"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Install</span>
              </button>
            )}

            {/* Profile / Login */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 pl-1">
                <button
                  type="button"
                  onClick={() => {
                    if (userRole === 'worker') onNavigate('worker-dashboard');
                    else if (userRole === 'employer') onNavigate('employer-dashboard');
                    else onNavigate('admin-dashboard');
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-orange-100/70 px-2.5 py-1.5 text-xs font-black text-orange-950 dark:bg-orange-950 dark:text-orange-200 border border-orange-200 dark:border-orange-800"
                >
                  <User className="h-3.5 w-3.5 text-orange-600" />
                  <span className="max-w-[80px] truncate">
                    {userRole === 'worker'
                      ? currentWorker?.name.split(' ')[0]
                      : userRole === 'employer'
                      ? currentEmployer?.name.split(' ')[0]
                      : 'Admin'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    onNavigate('home');
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:border-slate-800 dark:hover:bg-red-950/40 transition"
                  title={t('nav.logout')}
                  aria-label={t('nav.logout')}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('auth')}
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-black text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow transition"
              >
                <User className="h-3.5 w-3.5" />
                <span>{t('nav.login')}</span>
              </button>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex lg:hidden h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-200"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-2 text-sm font-semibold">
            <button
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('nav.dashboard')}
            </button>
            <button
              onClick={() => {
                onNavigate('employer-dashboard');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('nav.searchWorkers')}
            </button>
            <button
              onClick={() => {
                onNavigate('ai-voice-match');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-orange-600 font-bold"
            >
              {t('nav.postJob')}
            </button>
            <button
              onClick={() => {
                onNavigate('voice-register');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('nav.voiceRegister')}
            </button>
            <button
              onClick={() => {
                onNavigate('enterprise');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('nav.enterprise')}
            </button>
            <button
              onClick={() => {
                onNavigate('unit-tests');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-mono text-xs text-teal-600"
            >
              {t('nav.tests')}
            </button>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <button
                onClick={() => {
                  openModal('whatsapp');
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="h-4 w-4" />
                <span>{t('nav.whatsappBot')}</span>
              </button>
              <button
                onClick={() => {
                  openModal('ivr');
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <PhoneCall className="h-4 w-4" />
                <span>{t('nav.phoneIvr')}</span>
              </button>
              <button
                onClick={toggleTheme}
                className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                title={t('nav.themeToggle')}
                aria-label={t('nav.themeToggle')}
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
