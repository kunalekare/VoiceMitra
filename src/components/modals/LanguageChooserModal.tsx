import React, { useState, useEffect } from 'react';
import { Volume2, Check, Sparkles, Globe, X } from 'lucide-react';
import { SUPPORTED_LANGUAGES, LanguageOption, speakVernacular, applyDocumentLanguage, useTranslation } from '../../i18n';
import { useAppStore } from '../../store';
import { LanguageCode } from '../../types';

interface LanguageChooserModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  isFirstVisit?: boolean;
}

export const LanguageChooserModal: React.FC<LanguageChooserModalProps> = ({
  isOpen = true,
  onClose,
  isFirstVisit = false
}) => {
  const { currentLang, setLanguage, activeModal, closeModal } = useAppStore();
  const { t } = useTranslation();

  const [selectedLang, setSelectedLang] = useState<LanguageCode>(currentLang);
  const [suggestedLangCode, setSuggestedLangCode] = useState<LanguageCode>('hi');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.navigator) {
      const browserLang = (window.navigator.language || '').toLowerCase();
      const match = SUPPORTED_LANGUAGES.find(
        (l) => browserLang.startsWith(l.code) || browserLang === l.voiceLangCode.toLowerCase()
      );
      if (match) {
        setSuggestedLangCode(match.code);
        if (isFirstVisit && !localStorage.getItem('skillbridge_preferred_language')) {
          setSelectedLang(match.code);
        }
      }
    }
  }, [isFirstVisit]);

  const handleSpeak = (e: React.MouseEvent, lang: LanguageOption) => {
    e.stopPropagation();
    speakVernacular(lang.nativeName, lang.code);
  };

  const handleApply = () => {
    setLanguage(selectedLang);
    applyDocumentLanguage(selectedLang);
    localStorage.setItem('skillbridge_has_chosen_language', 'true');
    if (onClose) {
      onClose();
    } else {
      closeModal();
    }
  };

  if (!isOpen) return null;

  const currentOpt = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lang-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-orange-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 px-6 py-6 sm:py-8 text-white">
          {!isFirstVisit && (
            <button
              onClick={() => (onClose ? onClose() : closeModal())}
              className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition focus:outline-none focus:ring-2 focus:ring-white"
              aria-label={t('common.close')}
            >
              <X className="h-5 w-5" />
            </button>
          )}

          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur shadow-inner">
              <Globe className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold tracking-wide">
                <Sparkles className="h-3 w-3" />
                12 Indian Languages • 12 भारतीय भाषाएँ
              </span>
              <h2 id="lang-modal-title" className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                {t('languageChooser.modalTitle')}
              </h2>
            </div>
          </div>
          <p className="text-orange-100 text-xs sm:text-sm font-medium">
            {t('languageChooser.modalSubtitle')}
          </p>
        </div>

        {/* Language Grid */}
        <div className="p-4 sm:p-6 max-h-[55vh] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = selectedLang === lang.code;
              const isSuggested = suggestedLangCode === lang.code;

              return (
                <div
                  key={lang.code}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedLang(lang.code)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedLang(lang.code);
                    }
                  }}
                  className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border-2 transition text-left cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    isSelected
                      ? 'border-orange-600 bg-orange-50/80 dark:bg-orange-950/40 dark:border-orange-500 shadow-md shadow-orange-500/10'
                      : 'border-slate-200 hover:border-orange-300 bg-white hover:bg-orange-50/30 dark:border-slate-800 dark:bg-slate-800/80 dark:hover:bg-slate-800'
                  }`}
                >
                  {/* Top row: Flag + Speaker audio button */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl sm:text-2xl" aria-hidden="true">
                      {lang.flag}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleSpeak(e, lang)}
                      title={t('languageChooser.listenName')}
                      aria-label={`${t('languageChooser.listenName')} ${lang.name}`}
                      className="h-8 w-8 rounded-full bg-slate-100 hover:bg-orange-100 dark:bg-slate-700 dark:hover:bg-orange-950 flex items-center justify-center text-slate-600 hover:text-orange-600 dark:text-slate-300 dark:hover:text-orange-400 transition"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Native Script Name */}
                  <div className="mt-1">
                    <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
                      {lang.nativeName}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {lang.name}
                    </div>
                  </div>

                  {/* Badges: Suggested or Selected */}
                  <div className="mt-2.5 flex items-center justify-between text-[10px]">
                    {isSuggested ? (
                      <span className="inline-block rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold px-1.5 py-0.5">
                        {t('languageChooser.suggested')}
                      </span>
                    ) : (
                      <span />
                    )}

                    {isSelected && (
                      <div className="h-5 w-5 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-sm">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center sm:text-left">
            <span>{t('languageChooser.selectButton', { language: currentOpt.nativeName })}</span>
          </div>

          <button
            type="button"
            onClick={handleApply}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-sm shadow-lg shadow-orange-500/25 active:scale-98 transition flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" />
            <span>{t('languageChooser.selectButton', { language: currentOpt.nativeName })}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
