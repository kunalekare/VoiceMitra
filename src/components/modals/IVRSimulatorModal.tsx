import React, { useState, useEffect } from 'react';
import { X, Phone, PhoneOff, Volume2, Mic, CheckCircle2, RotateCcw } from 'lucide-react';
import { useAppStore } from '../../store';
import { IVR_NODES, IvrNode } from '../../services/ivrExotelService';
import { speakVernacular } from '../../i18n';

export const IVRSimulatorModal: React.FC = () => {
  const { closeModal } = useAppStore();
  const [currentNodeId, setCurrentNodeId] = useState<string>('welcome');
  const [callActive, setCallActive] = useState<boolean>(true);
  const [dtmfLog, setDtmfLog] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [callDurationSeconds, setCallDurationSeconds] = useState<number>(0);

  const node: IvrNode = IVR_NODES[currentNodeId] || IVR_NODES.welcome;

  // Spoken voice prompt on node change
  useEffect(() => {
    if (!callActive) return;

    setIsSpeaking(true);
    speakVernacular(node.spokenPromptHindi, 'hi').then(() => {
      setIsSpeaking(false);
    });
  }, [currentNodeId, callActive]);

  // Call timer
  useEffect(() => {
    if (!callActive) return;
    const interval = setInterval(() => {
      setCallDurationSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callActive]);

  const handleKeyPress = (digit: string) => {
    if (!callActive) return;

    // Beep audio feedback using Web Audio API
    playDtmfTone();
    setDtmfLog((prev) => [...prev, digit]);

    const option = node.dtmfOptions[digit];
    if (option && option.nextNodeId) {
      setCurrentNodeId(option.nextNodeId);
    }
  };

  const playDtmfTone = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(852, audioCtx.currentTime); // DTMF frequency
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // tolerate
    }
  };

  const endCall = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCallActive(false);
  };

  const restartCall = () => {
    setDtmfLog([]);
    setCallDurationSeconds(0);
    setCurrentNodeId('welcome');
    setCallActive(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-sm rounded-[36px] bg-slate-900 p-6 shadow-2xl border-2 border-slate-700 text-white animate-fadeIn">
        <button
          onClick={() => {
            endCall();
            closeModal();
          }}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Telephony Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-3 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-800/60 mb-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Exotel Telephony Simulator (080-47190000)</span>
          </div>

          <h3 className="text-lg font-black tracking-tight">SkillBridge Voice Helpline</h3>
          <p className="font-mono text-xs text-slate-400">
            {callActive ? (
              <span>Call in Progress • 0:{callDurationSeconds.toString().padStart(2, '0')}</span>
            ) : (
              <span className="text-red-400">Call Ended</span>
            )}
          </p>
        </div>

        {/* Spoken Prompt Display */}
        <div className="rounded-2xl bg-slate-800/90 p-3.5 mb-4 border border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
            <div className="flex items-center gap-1.5">
              <Volume2 className={`h-4 w-4 ${isSpeaking ? 'animate-bounce text-orange-400' : ''}`} />
              <span>{isSpeaking ? 'Spoken Voice Prompt Playing...' : 'Voice Prompt:'}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Node: {node.id}</span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-serif">
            "{node.spokenPromptHindi}"
          </p>
          <p className="text-[10px] text-slate-400 italic">
            "{node.spokenPromptEnglish}"
          </p>
        </div>

        {/* Active Key Options */}
        <div className="mb-4 space-y-1">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
            Available Menu Key Options:
          </span>
          <div className="grid grid-cols-1 gap-1">
            {Object.entries(node.dtmfOptions).map(([key, opt]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-xl bg-slate-800/40 px-2.5 py-1 text-[11px] text-slate-300 border border-slate-700/50"
              >
                <span>Press <strong>[{key}]</strong>:</span>
                <span className="font-semibold text-orange-400">{opt.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Phone Keypad Grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={!callActive}
              onClick={() => handleKeyPress(digit)}
              className="flex h-12 flex-col items-center justify-center rounded-2xl bg-slate-800 text-lg font-black text-white hover:bg-slate-700 active:bg-orange-600 active:scale-95 transition disabled:opacity-30 border border-slate-700/80 shadow-md"
            >
              <span>{digit}</span>
            </button>
          ))}
        </div>

        {/* Call Controls */}
        <div className="flex items-center justify-center gap-4">
          {callActive ? (
            <button
              type="button"
              onClick={endCall}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg hover:bg-red-500 active:scale-95 transition"
              title="Hang Up Call"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={restartCall}
              className="flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-xs font-black text-white shadow-lg hover:bg-emerald-500 active:scale-95 transition"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Dial Again (080-47190000)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
