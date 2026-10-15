import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, FileText, FastForward, RotateCcw } from 'lucide-react';
import { speakVernacular } from '../i18n';
import { useAppStore } from '../store';

interface VoicePlayerProps {
  transcript?: string;
  audioUrl?: string;
  workerName?: string;
  skillName?: string;
  autoPlay?: boolean;
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({
  transcript,
  audioUrl,
  workerName = 'Worker',
  skillName = 'Skill'
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.25 | 1.5>(1);
  const [showTranscript, setShowTranscript] = useState(false);
  const [duration, setDuration] = useState(18); // default estimated seconds
  const currentLang = useAppStore((s) => s.currentLang);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleTogglePlay = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    setIsPlaying(true);
    setProgress(0);

    // Speak transcript if available using browser speechSynthesis
    if (transcript) {
      speakVernacular(transcript, currentLang).then(() => {
        setIsPlaying(false);
        setProgress(100);
        if (intervalRef.current) clearInterval(intervalRef.current);
      });
    }

    const stepMs = 100;
    const totalSteps = (duration * 1000) / stepMs;
    let currentStep = 0;

    intervalRef.current = setInterval(() => {
      currentStep++;
      const currentPct = Math.min(100, Math.round((currentStep / totalSteps) * 100));
      setProgress(currentPct);

      if (currentPct >= 100) {
        setIsPlaying(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, stepMs / playbackRate);
  };

  const toggleSpeed = () => {
    const nextRate = playbackRate === 1 ? 1.25 : playbackRate === 1.25 ? 1.5 : 1;
    setPlaybackRate(nextRate);
  };

  // Generate 28 animated waveform bars
  const bars = [14, 28, 42, 65, 80, 50, 32, 60, 90, 75, 45, 85, 95, 60, 40, 70, 85, 60, 35, 75, 90, 65, 45, 80, 60, 35, 20, 10];

  return (
    <div className="rounded-2xl border border-orange-200/80 bg-gradient-to-br from-amber-50 to-orange-50/40 p-4 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-white shadow">
            <Volume2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-orange-950 dark:text-orange-200">
              Verified Voice Profile
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Listen to {workerName} speaking in native dialect
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleSpeed}
            className="rounded-lg border border-orange-200 bg-white px-2 py-1 text-[11px] font-bold text-orange-800 hover:bg-orange-100 transition dark:border-slate-700 dark:bg-slate-800 dark:text-orange-300"
            title="Change Playback Speed"
          >
            {playbackRate}x
          </button>

          {transcript && (
            <button
              type="button"
              onClick={() => setShowTranscript(!showTranscript)}
              className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${
                showTranscript
                  ? 'border-orange-500 bg-orange-500 text-white'
                  : 'border-orange-200 bg-white text-orange-800 hover:bg-orange-100 dark:border-slate-700 dark:bg-slate-800 dark:text-orange-300'
              }`}
            >
              <FileText className="h-3 w-3" />
              <span>Transcript</span>
            </button>
          )}
        </div>
      </div>

      {/* Waveform Visualizer & Play Controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleTogglePlay}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-600 text-white shadow-md hover:bg-orange-500 active:scale-95 transition"
          aria-label={isPlaying ? 'Pause voice profile' : 'Play voice profile'}
        >
          {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
        </button>

        {/* Dynamic Waveform Bars */}
        <div className="flex-1 flex items-center justify-between gap-[2px] h-10 px-2 py-1 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-orange-100 dark:border-slate-700">
          {bars.map((height, i) => {
            const barPct = (i / bars.length) * 100;
            const isFilled = progress >= barPct;
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isFilled
                    ? 'bg-orange-600'
                    : 'bg-orange-200 dark:bg-slate-700'
                } ${isPlaying && isFilled ? 'scale-y-110' : ''}`}
                style={{ height: `${Math.max(15, height * (isPlaying ? 0.9 : 0.6))}%` }}
              />
            );
          })}
        </div>

        <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-400 shrink-0 w-10 text-right">
          0:{Math.floor((duration * (progress / 100))).toString().padStart(2, '0')}
        </span>
      </div>

      {/* Spoken Transcript Drawer */}
      {showTranscript && transcript && (
        <div className="mt-3 rounded-xl bg-white p-3 text-xs leading-relaxed text-slate-800 border border-orange-200 dark:bg-slate-800/90 dark:text-slate-200 dark:border-slate-700 animate-fadeIn">
          <div className="flex items-center gap-1.5 font-bold text-orange-700 dark:text-orange-400 mb-1">
            <Volume2 className="h-3.5 w-3.5" />
            <span>Spoken Voice Transcript:</span>
          </div>
          <p className="italic font-serif">"{transcript}"</p>
        </div>
      )}
    </div>
  );
};
