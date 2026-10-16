import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Phone,
  PhoneOff,
  Volume2,
  VolumeX,
  Mic,
  RotateCcw,
  Terminal,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';
import { useAppStore } from '../../store';
import { ivrApiClient, IvrActionResponse } from '../../services/ivrExotelService';
import { speakVernacular, SUPPORTED_LANGUAGES } from '../../i18n';

interface WebhookLogEntry {
  timestamp: string;
  endpoint: string;
  request: Record<string, any>;
  response: Record<string, any>;
}

// Preset phone numbers to simulate returning worker, employer or new guest
const PRESET_CALLERS = [
  { label: 'Rameshwar Patil (Worker - Electrician)', phone: '+919822012345', lang: 'hi' },
  { label: 'Sunil Deshmukh (Worker - Plumber)', phone: '+919822099999', lang: 'mr' },
  { label: 'K. Rajan (Worker - Mason)', phone: '+919822044444', lang: 'ta' },
  { label: 'Sharma Builders (Employer)', phone: '+919822088888', lang: 'hi' },
  { label: 'New Guest Caller', phone: '+919876543210', lang: 'hi' }
];

export const IVRSimulatorModal: React.FC = () => {
  const { closeModal } = useAppStore();

  const [callerPhone, setCallerPhone] = useState<string>(PRESET_CALLERS[0].phone);
  const [callId, setCallId] = useState<string>(`call_sim_${Date.now()}`);
  const [callActive, setCallActive] = useState<boolean>(false);
  const [callConnecting, setCallConnecting] = useState<boolean>(false);
  const [callDurationSeconds, setCallDurationSeconds] = useState<number>(0);
  const [activePromptText, setActivePromptText] = useState<string>('Press Green Call button or "Give Missed Call" to start.');
  const [activeLang, setActiveLang] = useState<string>('hi');
  const [currentNodeId, setCurrentNodeId] = useState<string>('consent_notice');
  const [isRecordingPrompt, setIsRecordingPrompt] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showEnglishTranslation, setShowEnglishTranslation] = useState<boolean>(false);
  const [englishTranslationText, setEnglishTranslationText] = useState<string>('');
  const [showDevInspector, setShowDevInspector] = useState<boolean>(false);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLogEntry[]>([]);
  const [lastActions, setLastActions] = useState<any[]>([]);

  // Missed Call / Callback state
  const [missedCallActive, setMissedCallActive] = useState<boolean>(false);
  const [callbackCountdown, setCallbackCountdown] = useState<number>(30);
  const [incomingRing, setIncomingRing] = useState<boolean>(false);

  // Audio Context for DTMF synthesis
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Dual Tone Multi-Frequency standard frequencies (Hz)
  const DTMF_FREQS: Record<string, [number, number]> = {
    '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
    '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
    '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
    '*': [941, 1209], '0': [941, 1336], '#': [941, 1477]
  };

  const playDtmfTone = (digit: string) => {
    try {
      const freqs = DTMF_FREQS[digit];
      if (!freqs) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.setValueAtTime(freqs[0], ctx.currentTime);
      osc2.frequency.setValueAtTime(freqs[1], ctx.currentTime);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.16);
      osc2.stop(ctx.currentTime + 0.16);
    } catch {}
  };

  // Call duration timer
  useEffect(() => {
    if (!callActive) return;
    const interval = setInterval(() => {
      setCallDurationSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callActive]);

  // Callback countdown timer after missed call
  useEffect(() => {
    if (!missedCallActive || callbackCountdown <= 0) return;
    const interval = setInterval(() => {
      setCallbackCountdown((c) => {
        if (c <= 1) {
          setMissedCallActive(false);
          triggerIncomingRing();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [missedCallActive, callbackCountdown]);

  // Start Call Handler (calls backend POST /api/v1/ivr/incoming)
  const handleStartInboundCall = async () => {
    try {
      setCallConnecting(true);
      const newCallId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      setCallId(newCallId);
      setCallDurationSeconds(0);
      setIncomingRing(false);
      setMissedCallActive(false);

      const res = await ivrApiClient.startCall(callerPhone, newCallId);

      addLog('/api/v1/ivr/incoming', { CallSid: newCallId, From: callerPhone }, res);
      applyActions(res, newCallId);
      setCallActive(true);
    } catch (err: any) {
      console.error('Call start error:', err);
      setActivePromptText('Error connecting to IVR service. Please check backend connection.');
    } finally {
      setCallConnecting(false);
    }
  };

  // Handle Missed Call (calls backend POST /api/v1/ivr/missed-call)
  const handleTriggerMissedCall = async () => {
    try {
      setMissedCallActive(true);
      setCallbackCountdown(5); // fast demo: 5s instead of full 30s
      setActivePromptText('Missed call received at 1800-889-2026. Callback scheduled within seconds.');

      const res = await ivrApiClient.triggerMissedCall(callerPhone);
      addLog('/api/v1/ivr/missed-call', { From: callerPhone }, res);
    } catch (err: any) {
      console.error('Missed call error:', err);
    }
  };

  const triggerIncomingRing = () => {
    setIncomingRing(true);
    setActivePromptText('INCOMING CALL: SkillBridge Helpline (1800-889-2026). Press Green Call button to answer!');
    playDtmfTone('1');
  };

  // DTMF Keypad Click (calls backend POST /api/v1/ivr/dtmf)
  const handleKeyClick = async (digit: string) => {
    if (!callActive) return;

    playDtmfTone(digit);

    try {
      const res = await ivrApiClient.sendDtmf(callId, digit);
      addLog('/api/v1/ivr/dtmf', { CallSid: callId, Digits: digit }, res);
      applyActions(res, callId);
    } catch (err: any) {
      console.error('DTMF error:', err);
    }
  };

  // Voice recording simulate or submit (calls backend POST /api/v1/ivr/recording)
  const handleSendVoiceRecording = async () => {
    if (!callActive) return;
    try {
      const sample = 'नमस्ते, मेरा नाम राजेश कुमार है, मैं नागपुर से हूँ और ७ साल से इलेक्ट्रीशियन का काम कर रहा हूँ।';
      const res = await ivrApiClient.sendRecording(
        callId,
        'https://assets.skillbridge.in/recordings/sample_worker_voice.wav',
        18,
        sample
      );
      addLog('/api/v1/ivr/recording', { CallSid: callId, durationSeconds: 18, transcript: sample }, res);
      applyActions(res, callId);
    } catch (err: any) {
      console.error('Recording submit error:', err);
    }
  };

  // Process returned action commands from provider adapter
  const applyActions = (response: IvrActionResponse, currentCallId: string) => {
    const actions = response.actions || [];
    setLastActions(actions);

    for (const a of actions) {
      if (a.type === 'hangup') {
        endCallCleanly(currentCallId, 'completed');
        setActivePromptText('Call Ended. Thank you for calling SkillBridge.');
        return;
      }

      if (a.type === 'record') {
        setIsRecordingPrompt(true);
      } else {
        setIsRecordingPrompt(false);
      }

      if (a.text) {
        setActivePromptText(a.text);
        if (a.lang) setActiveLang(a.lang);

        // Play voice aloud if not muted
        if (!isMuted && typeof window !== 'undefined') {
          speakVernacular(a.text, (a.lang || 'hi') as any).catch(() => {});
        }
      }
    }
  };

  const endCallCleanly = (cId: string, disposition = 'completed') => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCallActive(false);
    setIncomingRing(false);
    setMissedCallActive(false);
    ivrApiClient.endCall(cId, callDurationSeconds, disposition);
  };

  const addLog = (endpoint: string, request: Record<string, any>, response: Record<string, any>) => {
    setWebhookLogs((prev) => [
      {
        timestamp: new Date().toLocaleTimeString(),
        endpoint,
        request,
        response
      },
      ...prev.slice(0, 19)
    ]);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-[40px] bg-slate-950 p-4 sm:p-6 shadow-2xl border-2 border-slate-800 text-white animate-fadeIn flex flex-col lg:flex-row gap-6 max-h-[92vh] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => {
            if (callActive) endCallCleanly(callId, 'cancelled');
            closeModal();
          }}
          className="absolute right-5 top-5 z-20 rounded-full bg-slate-800 p-2 text-slate-400 hover:text-white hover:bg-slate-700"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* ============================================================
            LEFT PANEL: Keypad Phone Hardware Simulation
           ============================================================ */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Phone Chasis */}
          <div className="w-[310px] sm:w-[330px] rounded-[48px] bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 p-5 shadow-2xl border-4 border-slate-700/80 relative">
            {/* Top Speaker Slit & Brand */}
            <div className="flex flex-col items-center mb-3">
              <div className="h-1.5 w-14 rounded-full bg-slate-700 mb-1" />
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                SkillBridge 4G
              </span>
            </div>

            {/* Retro Backlit Feature-Phone Screen */}
            <div className="rounded-2xl bg-[#1b2f28] p-3 border-2 border-[#2b4c40] text-[#a4efc8] font-mono shadow-inner mb-4 min-h-[170px] flex flex-col justify-between relative overflow-hidden">
              {/* Screen Top Status Bar */}
              <div className="flex items-center justify-between text-[10px] border-b border-[#2b4c40] pb-1 font-bold text-[#83d8ad]">
                <div className="flex items-center gap-1">
                  <span>📶 Jio 4G</span>
                </div>
                <span>{formatTimer(callDurationSeconds)}</span>
                <div className="flex items-center gap-1">
                  <span>🔋 85%</span>
                </div>
              </div>

              {/* Call State Headline */}
              <div className="my-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                  <span>{callActive ? '● CALL IN PROGRESS' : incomingRing ? '🔔 INCOMING CALL...' : 'HELPLINE STANDBY'}</span>
                  <span className="uppercase text-[9px] px-1 rounded bg-[#2b4c40] text-emerald-200">
                    {activeLang}
                  </span>
                </div>

                {/* Spoken Prompt Display (Pure vernacular without bilingual slashes) */}
                <p className="mt-1.5 text-xs text-[#d6ffeb] font-sans leading-relaxed line-clamp-4 font-semibold">
                  "{activePromptText}"
                </p>

                {/* Optional English Translation Subtitle */}
                {showEnglishTranslation && (
                  <p className="mt-1 text-[10px] text-[#8dddb7] italic font-sans border-t border-[#2b4c40] pt-1">
                    [EN Translation Mode Active]
                  </p>
                )}
              </div>

              {/* Recording indicator if on voice recording step */}
              {isRecordingPrompt && (
                <div className="flex items-center justify-between rounded bg-red-950/80 px-2 py-1 text-[10px] text-red-300 font-bold border border-red-800 animate-pulse">
                  <div className="flex items-center gap-1">
                    <Mic className="h-3 w-3 text-red-400" />
                    <span>REC AUDIO (45s max)</span>
                  </div>
                  <button
                    onClick={handleSendVoiceRecording}
                    className="underline text-white hover:text-red-200"
                  >
                    Simulate Finish (#)
                  </button>
                </div>
              )}

              {/* Screen Bottom Bar */}
              <div className="flex justify-between items-center text-[10px] text-[#83d8ad] pt-1 border-t border-[#2b4c40]">
                <span>Menu [0]</span>
                <span>Back [*]</span>
                <span>Ok [#]</span>
              </div>
            </div>

            {/* D-Pad / Softkeys */}
            <div className="flex items-center justify-between px-2 mb-3">
              <button
                type="button"
                onClick={() => handleKeyClick('*')}
                className="rounded-xl bg-slate-800 px-3 py-1.5 text-[10px] font-black text-slate-300 hover:bg-slate-700 active:scale-95 border border-slate-700"
              >
                BACK
              </button>
              <div className="h-9 w-9 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-xs font-bold text-slate-400">
                OK
              </div>
              <button
                type="button"
                onClick={() => handleKeyClick('#')}
                className="rounded-xl bg-slate-800 px-3 py-1.5 text-[10px] font-black text-slate-300 hover:bg-slate-700 active:scale-95 border border-slate-700"
              >
                SELECT
              </button>
            </div>

            {/* Call Action Softkeys (Green Dial / Red End) */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                disabled={callActive}
                onClick={handleStartInboundCall}
                className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black shadow-lg transition active:scale-95 ${
                  callActive
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 animate-pulse'
                }`}
              >
                <Phone className="h-4 w-4" />
                <span>{incomingRing ? 'ANSWER' : 'DIAL 1800'}</span>
              </button>

              <button
                type="button"
                disabled={!callActive && !incomingRing}
                onClick={() => endCallCleanly(callId, 'user_hangup')}
                className={`flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black shadow-lg transition active:scale-95 ${
                  callActive || incomingRing
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/40'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <PhoneOff className="h-4 w-4" />
                <span>END CALL</span>
              </button>
            </div>

            {/* Physical 3D Tactile Number Pad (1-9, *, 0, #) */}
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { digit: '1', sub: '.,' },
                { digit: '2', sub: 'ABC' },
                { digit: '3', sub: 'DEF' },
                { digit: '4', sub: 'GHI' },
                { digit: '5', sub: 'JKL' },
                { digit: '6', sub: 'MNO' },
                { digit: '7', sub: 'PQRS' },
                { digit: '8', sub: 'TUV' },
                { digit: '9', sub: 'WXYZ' },
                { digit: '*', sub: 'BACK' },
                { digit: '0', sub: 'REPEAT' },
                { digit: '#', sub: 'CONFIRM' }
              ].map(({ digit, sub }) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeyClick(digit)}
                  className="flex flex-col items-center justify-center h-12 rounded-2xl bg-gradient-to-b from-slate-700 to-slate-800 text-white hover:from-slate-600 hover:to-slate-700 active:from-orange-600 active:to-orange-700 active:scale-95 border-b-2 border-slate-900 shadow-md transition select-none"
                >
                  <span className="text-base font-black leading-none">{digit}</span>
                  <span className="text-[8px] font-bold text-slate-400 leading-tight mt-0.5">{sub}</span>
                </button>
              ))}
            </div>

            {/* Bottom Mic Opening */}
            <div className="flex justify-center mt-3">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-700" />
            </div>
          </div>
        </div>

        {/* ============================================================
            RIGHT PANEL: Telephony Controls & Developer Inspector
           ============================================================ */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto space-y-4 pr-1">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="text-lg font-black tracking-tight text-white">
                  SkillBridge Telephony Gateway
                </h3>
              </div>
              <span className="rounded-full bg-orange-950 px-2.5 py-1 text-[11px] font-black text-orange-400 border border-orange-800/60">
                1800-889-2026 (DID Toll-Free)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Production webhook-driven telephony engine for feature phones & any keypad phone without internet.
            </p>
          </div>

          {/* Caller Identity Preset Selector */}
          <div className="rounded-2xl bg-slate-900 p-3.5 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Simulate Caller Phone (ANI):</label>
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white"
              >
                {isMuted ? <VolumeX className="h-3.5 w-3.5 text-red-400" /> : <Volume2 className="h-3.5 w-3.5 text-emerald-400" />}
                <span>{isMuted ? 'Muted' : 'Voice Aloud'}</span>
              </button>
            </div>

            <select
              value={callerPhone}
              disabled={callActive}
              onChange={(e) => setCallerPhone(e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 p-2.5 text-xs text-white font-medium focus:outline-none focus:border-orange-500"
            >
              {PRESET_CALLERS.map((p) => (
                <option key={p.phone} value={p.phone}>
                  {p.label} ({p.phone})
                </option>
              ))}
            </select>

            {/* Missed Call Feature */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                disabled={callActive || missedCallActive}
                onClick={handleTriggerMissedCall}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-600/50 py-2.5 text-xs font-black transition disabled:opacity-50"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Give Missed Call (Free Callback)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowEnglishTranslation(!showEnglishTranslation)}
                className={`rounded-xl px-3 py-2 text-xs font-bold border transition ${
                  showEnglishTranslation
                    ? 'border-orange-500 bg-orange-950/60 text-orange-300'
                    : 'border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {showEnglishTranslation ? 'English Subtitles: ON' : 'English Subtitles: OFF'}
              </button>
            </div>

            {/* Missed call countdown banner */}
            {missedCallActive && (
              <div className="flex items-center justify-between rounded-xl bg-emerald-950/80 border border-emerald-700 p-2 text-xs text-emerald-300 animate-pulse">
                <span>Missed Call Registered. Callback in {callbackCountdown}s...</span>
                <span className="font-mono font-bold">00:{callbackCountdown.toString().padStart(2, '0')}</span>
              </div>
            )}
          </div>

          {/* Key Standard DTMF Navigation Guide */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-medium text-slate-400">
            <div className="rounded-xl bg-slate-900 p-2 border border-slate-800">
              <span className="font-bold text-orange-400">[0]</span> Repeat Prompt
            </div>
            <div className="rounded-xl bg-slate-900 p-2 border border-slate-800">
              <span className="font-bold text-orange-400">[*]</span> Previous / Back
            </div>
            <div className="rounded-xl bg-slate-900 p-2 border border-slate-800">
              <span className="font-bold text-orange-400">[8]</span> Change Language
            </div>
            <div className="rounded-xl bg-slate-900 p-2 border border-slate-800">
              <span className="font-bold text-orange-400">[9]</span> Support Agent
            </div>
          </div>

          {/* Live Developer Telephony Inspector */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex-1 flex flex-col">
            <button
              type="button"
              onClick={() => setShowDevInspector(!showDevInspector)}
              className="flex items-center justify-between w-full px-4 py-2.5 bg-slate-850 hover:bg-slate-800 text-xs font-bold text-slate-300 border-b border-slate-800"
            >
              <div className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-teal-400" />
                <span>Live Developer Telephony Inspector ({webhookLogs.length} events)</span>
              </div>
              {showDevInspector ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {showDevInspector && (
              <div className="p-3 text-[11px] font-mono space-y-2 max-h-48 overflow-y-auto">
                {webhookLogs.length === 0 ? (
                  <p className="text-slate-500 italic">No webhook requests logged yet. Start a call to observe live traffic.</p>
                ) : (
                  webhookLogs.map((log, i) => (
                    <div key={i} className="rounded-lg bg-slate-950 p-2 border border-slate-800 space-y-1">
                      <div className="flex justify-between text-slate-400 font-bold">
                        <span className="text-teal-400">{log.endpoint}</span>
                        <span>{log.timestamp}</span>
                      </div>
                      <div className="text-slate-400">
                        <span className="text-orange-400">REQ:</span> {JSON.stringify(log.request)}
                      </div>
                      <div className="text-slate-300">
                        <span className="text-emerald-400">RESP:</span> {JSON.stringify(log.response)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
