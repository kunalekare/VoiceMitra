import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Mic,
  Square,
  Play,
  CheckCheck,
  Check,
  Phone,
  ArrowLeft,
  Volume2,
  VolumeX,
  RotateCcw,
  Briefcase,
  Wallet,
  Award,
  ShieldCheck,
  Globe,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../../store';
import {
  whatsappService,
  WhatsAppBotSession,
  WhatsAppMessage
} from '../../services/whatsappService';

const AVAILABLE_LANGUAGES = [
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'en', label: 'English' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'ur', label: 'اردو (Urdu)' }
];

export const WhatsAppBotModal: React.FC = () => {
  const { closeModal, currentWorker } = useAppStore();
  const phone = currentWorker?.phone || '+91 98220 11201';

  const [session, setSession] = useState<WhatsAppBotSession>(() =>
    whatsappService.startSession(phone, 'hi')
  );
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isRecordingRealMic, setIsRecordingRealMic] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages, isTyping]);

  useEffect(() => {
    return () => {
      whatsappService.stopSpeaking();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleSendMessage = async (
    textToSend: string,
    actionPayload?: string,
    isVoice = false,
    audioBlobUrl?: string,
    voiceDuration = 12
  ) => {
    if (!textToSend.trim() && !actionPayload && !isVoice) return;

    const userMessageId = `wa-u-${Date.now()}`;
    const userMsg: WhatsAppMessage = {
      id: userMessageId,
      sender: 'user',
      text: isVoice ? `🎤 [Voice Note: ${voiceDuration}s]` : (textToSend || actionPayload || ''),
      isVoice,
      voiceDurationSeconds: isVoice ? voiceDuration : undefined,
      audioBlobUrl,
      status: 'sending',
      timestamp: new Date().toISOString()
    };

    // Immediate optimistic update for user message
    const updatedMessages = [...session.messages, userMsg];
    setSession((prev) => ({
      ...prev,
      messages: updatedMessages
    }));
    setInputText('');
    setIsTyping(true);

    // Update user status tick to 'sent' after 200ms and 'read' after 500ms
    setTimeout(() => {
      setSession((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === userMessageId ? { ...m, status: 'delivered' as const } : m
        )
      }));
    }, 300);

    try {
      const response = await whatsappService.sendWebhookMessage(
        session.phone,
        textToSend,
        actionPayload,
        isVoice,
        session.language
      );

      const botMessageId = `wa-b-${Date.now()}`;
      const botMsg: WhatsAppMessage = {
        id: botMessageId,
        sender: 'bot',
        text: response.reply,
        buttons: response.buttons,
        mediaCard: response.mediaCard,
        status: 'read' as const,
        timestamp: new Date().toISOString()
      };

      setSession((prev) => ({
        ...prev,
        state: response.nextState,
        language: response.language || prev.language,
        messages: prev.messages.map((m) =>
          m.id === userMessageId ? { ...m, status: 'read' as const } : m
        ).concat(botMsg)
      }));

      // Read bot reply with speech synthesis if enabled
      if (ttsEnabled && response.reply) {
        whatsappService.speakText(response.reply, response.language || session.language);
      }
    } catch (err) {
      console.error('WhatsApp bot message error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  // Real Microphone Recording Handler
  const startRealMicRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        // Fallback simulation if no browser media support
        simulateVoiceNote();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const blobUrl = URL.createObjectURL(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
        handleSendMessage('मेरा नाम राजेश कुमार है, मैं नागपुर से 8 साल से इलेक्ट्रीशियन का काम कर रहा हूँ।', undefined, true, blobUrl, Math.max(1, recordingSeconds));
        setRecordingSeconds(0);
      };

      mediaRecorder.start();
      setIsRecordingRealMic(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission not granted or unsupported, falling back to simulated audio:', err);
      simulateVoiceNote();
    }
  };

  const stopRealMicRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecordingRealMic(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const simulateVoiceNote = () => {
    setIsRecordingRealMic(true);
    let sec = 0;
    const interval = setInterval(() => {
      sec += 1;
      setRecordingSeconds(sec);
      if (sec >= 3) {
        clearInterval(interval);
        setIsRecordingRealMic(false);
        setRecordingSeconds(0);
        handleSendMessage('मेरा नाम राजेश कुमार है, मैं नागपुर से हूँ और 8 साल से इलेक्ट्रीशियन का काम कर रहा हूँ।', undefined, true, undefined, 14);
      }
    }, 600);
  };

  const handleResetSession = () => {
    whatsappService.stopSpeaking();
    const fresh = whatsappService.startSession(phone, session.language);
    setSession(fresh);
  };

  const handleSelectLanguage = (langCode: string) => {
    setShowLanguagePicker(false);
    handleSendMessage('', `SET_LANG_${langCode}`);
  };

  // Helper to format WhatsApp markdown (*bold*)
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*[^*]+\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return <strong key={idx} className="font-bold text-white">{part.slice(1, -1)}</strong>;
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-sm rounded-[40px] bg-[#0b141a] p-2 shadow-2xl border-4 border-slate-700 animate-fadeIn">
        {/* Phone Notch */}
        <div className="mx-auto mb-1.5 h-4 w-32 rounded-full bg-slate-800 flex items-center justify-center">
          <div className="h-1.5 w-10 rounded-full bg-slate-900" />
        </div>

        {/* WhatsApp Header */}
        <div className="flex items-center justify-between rounded-t-2xl bg-[#202c33] px-3 py-2 text-white shadow-md">
          <div className="flex items-center gap-2">
            <button
              onClick={closeModal}
              className="text-slate-300 hover:text-white p-1 rounded-full hover:bg-slate-700/50 transition"
              title="Close"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white font-black text-xs shadow-inner">
              SB
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#202c33]" />
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-1 leading-tight">
                <span>SkillBridge Pro</span>
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#00a884] text-[9px] text-white">✓</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-medium">
                {isTyping ? 'typing…' : 'Online • Verified Business'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-slate-300">
            {/* Audio Read-Aloud Toggle */}
            <button
              onClick={() => {
                setTtsEnabled(!ttsEnabled);
                if (ttsEnabled) whatsappService.stopSpeaking();
              }}
              className={`p-1.5 rounded-full transition ${ttsEnabled ? 'text-emerald-400 bg-emerald-950/40' : 'text-slate-400 hover:text-white'}`}
              title={ttsEnabled ? 'Voice Readout Enabled' : 'Voice Readout Muted'}
            >
              {ttsEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            {/* Language Selector Button */}
            <button
              onClick={() => setShowLanguagePicker(!showLanguagePicker)}
              className="p-1.5 rounded-full hover:bg-slate-700/50 hover:text-white text-slate-300 transition"
              title="Change Language"
            >
              <Globe className="h-4 w-4" />
            </button>

            {/* Reset Chat */}
            <button
              onClick={handleResetSession}
              className="p-1.5 rounded-full hover:bg-slate-700/50 hover:text-white text-slate-300 transition"
              title="Restart Flow"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            <button onClick={closeModal} className="p-1 text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Language Picker Dropdown */}
        {showLanguagePicker && (
          <div className="absolute top-16 left-4 right-4 z-20 rounded-2xl bg-[#202c33] border border-slate-700 p-2 shadow-2xl animate-fadeIn">
            <div className="text-[11px] font-bold text-emerald-400 mb-1.5 px-2 flex items-center justify-between">
              <span>Select Language / भाषा चुनें</span>
              <button onClick={() => setShowLanguagePicker(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-1">
              {AVAILABLE_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleSelectLanguage(l.code)}
                  className={`text-left text-xs px-2.5 py-1.5 rounded-xl transition ${session.language === l.code ? 'bg-[#00a884] text-white font-bold' : 'text-slate-200 hover:bg-slate-700/60'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Action Drawer */}
        <div className="bg-[#111b21] px-2 py-1.5 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => handleSendMessage('', 'MENU_JOBS')}
            className="shrink-0 flex items-center gap-1 rounded-full bg-[#202c33] border border-[#00a884]/30 px-2.5 py-1 text-[10px] font-semibold text-emerald-300 hover:bg-[#00a884] hover:text-white transition"
          >
            <Briefcase className="h-3 w-3" />
            <span>Jobs</span>
          </button>
          <button
            onClick={() => handleSendMessage('', 'MENU_EARNINGS')}
            className="shrink-0 flex items-center gap-1 rounded-full bg-[#202c33] border border-amber-500/30 px-2.5 py-1 text-[10px] font-semibold text-amber-300 hover:bg-amber-600 hover:text-white transition"
          >
            <Wallet className="h-3 w-3" />
            <span>Wallet</span>
          </button>
          <button
            onClick={() => handleSendMessage('', 'MENU_QUIZ')}
            className="shrink-0 flex items-center gap-1 rounded-full bg-[#202c33] border border-cyan-500/30 px-2.5 py-1 text-[10px] font-semibold text-cyan-300 hover:bg-cyan-600 hover:text-white transition"
          >
            <Award className="h-3 w-3" />
            <span>Quiz</span>
          </button>
          <button
            onClick={() => handleSendMessage('', 'MENU_CARD')}
            className="shrink-0 flex items-center gap-1 rounded-full bg-[#202c33] border border-purple-500/30 px-2.5 py-1 text-[10px] font-semibold text-purple-300 hover:bg-purple-600 hover:text-white transition"
          >
            <ShieldCheck className="h-3 w-3" />
            <span>ID Card</span>
          </button>
          <button
            onClick={() => handleSendMessage('', 'MENU_STATUS')}
            className="shrink-0 flex items-center gap-1 rounded-full bg-[#202c33] border border-blue-500/30 px-2.5 py-1 text-[10px] font-semibold text-blue-300 hover:bg-blue-600 hover:text-white transition"
          >
            <span>🟢 Status</span>
          </button>
          <button
            onClick={() => handleSendMessage('', 'MENU_SUPPORT')}
            className="shrink-0 flex items-center gap-1 rounded-full bg-[#202c33] border border-red-500/30 px-2.5 py-1 text-[10px] font-semibold text-red-300 hover:bg-red-600 hover:text-white transition"
          >
            <Phone className="h-3 w-3" />
            <span>Support</span>
          </button>
        </div>

        {/* Message Feed */}
        <div className="h-[430px] overflow-y-auto bg-[#0b141a] p-3 space-y-3 text-xs bg-[radial-gradient(#14242d_1px,transparent_1px)] [background-size:16px_16px]">
          {/* E2E Encryption Banner */}
          <div className="mx-auto max-w-[280px] rounded-lg bg-[#182229] px-2.5 py-1.5 text-center text-[10px] leading-tight text-amber-200/90 shadow-sm border border-amber-500/20">
            🔒 Messages and calls are end-to-end encrypted on SkillBridge Cloud. Real webhooks active at <code className="text-emerald-400">/api/v1/webhooks/whatsapp</code>
          </div>

          {session.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fadeIn`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-md leading-relaxed whitespace-pre-line ${
                  msg.sender === 'user'
                    ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                    : 'bg-[#202c33] text-[#d1d7db] rounded-tl-none border border-slate-700/40'
                }`}
              >
                {/* Voice Note Bubble */}
                {msg.isVoice ? (
                  <div className="flex items-center gap-3 py-1">
                    <button
                      onClick={() => {
                        if (msg.audioBlobUrl) {
                          const audio = new Audio(msg.audioBlobUrl);
                          audio.play();
                        } else {
                          whatsappService.speakText(msg.text, session.language);
                        }
                      }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white shadow hover:scale-105 active:scale-95 transition"
                    >
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    </button>
                    <div className="flex-1 min-w-[130px]">
                      {/* Audio waveform mockup */}
                      <div className="flex items-center gap-0.5 h-4 mb-1">
                        {[40, 70, 30, 90, 60, 100, 80, 45, 95, 30, 75, 50, 85, 40].map((h, i) => (
                          <div
                            key={i}
                            className="w-1 bg-[#00a884] rounded-full transition-all"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-300">
                        <span>0:{msg.voiceDurationSeconds ? msg.voiceDurationSeconds.toString().padStart(2, '0') : '14'}</span>
                        <span className="text-emerald-300 font-medium">🎤 Voice Recorded</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>{renderFormattedText(msg.text)}</div>
                )}

                {/* Media Card Renderers */}
                {msg.mediaCard && msg.mediaCard.type === 'job_card' && (
                  <div className="mt-2.5 rounded-xl bg-[#111b21] p-3 border border-emerald-500/30 text-white shadow-inner">
                    <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold mb-1">
                      <span>⚡ DIRECT JOB OFFER</span>
                      <span className="bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-600/40">Escrow Protected</span>
                    </div>
                    <div className="font-bold text-xs text-white mb-0.5">{msg.mediaCard.title}</div>
                    <div className="text-[11px] text-slate-300 mb-1">📍 {msg.mediaCard.district} • ⏱️ {msg.mediaCard.duration} Days</div>
                    <div className="text-sm font-black text-amber-400">₹{msg.mediaCard.budget} Guaranteed</div>
                  </div>
                )}

                {msg.mediaCard && msg.mediaCard.type === 'wallet_card' && (
                  <div className="mt-2.5 rounded-xl bg-gradient-to-r from-emerald-950 to-[#111b21] p-3 border border-emerald-500/40 text-white shadow">
                    <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold mb-1">
                      SkillBridge Escrow Passbook
                    </div>
                    <div className="text-xl font-black text-emerald-400 mb-1">₹{msg.mediaCard.balance?.toLocaleString('en-IN')}</div>
                    <div className="flex items-center justify-between text-[10px] text-slate-300">
                      <span>🔒 Escrow: ₹{msg.mediaCard.escrowLocked}</span>
                      <span>🏆 {msg.mediaCard.totalJobs} Jobs Completed</span>
                    </div>
                  </div>
                )}

                {msg.mediaCard && msg.mediaCard.type === 'worker_card' && (
                  <div className="mt-2.5 rounded-xl bg-[#182229] p-3 border border-purple-500/40 text-white shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-xs text-white">{msg.mediaCard.name}</div>
                      <span className="bg-purple-900/60 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Verified Pro ✓
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300">{msg.mediaCard.skill} • {msg.mediaCard.district}</div>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-amber-400 font-bold">
                      <span>⭐ {msg.mediaCard.rating} / 5.0</span>
                      <span className="text-slate-400">UIDAI KYC Certified</span>
                    </div>
                  </div>
                )}

                {/* Message Timestamp & Status Checks */}
                <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-slate-400">
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.sender === 'user' && (
                    <>
                      {msg.status === 'sending' && <span className="text-slate-400">🕒</span>}
                      {msg.status === 'sent' && <Check className="h-3 w-3 text-slate-400" />}
                      {msg.status === 'delivered' && <CheckCheck className="h-3 w-3 text-slate-400" />}
                      {msg.status === 'read' && <CheckCheck className="h-3 w-3 text-cyan-400" />}
                    </>
                  )}
                </div>
              </div>

              {/* Interactive WhatsApp Buttons */}
              {msg.buttons && msg.buttons.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5 max-w-[88%]">
                  {msg.buttons.map((btn, bIdx) => (
                    <button
                      key={bIdx}
                      onClick={() => handleSendMessage('', btn.payload)}
                      className="rounded-xl bg-[#202c33] border border-[#00a884]/40 px-3 py-1.5 text-[11px] font-bold text-[#00a884] hover:bg-[#00a884] hover:text-white active:scale-95 transition shadow-sm"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-center gap-1.5 rounded-2xl bg-[#202c33] text-slate-300 px-3 py-2 w-20 shadow-md">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" />
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Real Microphone Recording Status Bar */}
        {isRecordingRealMic && (
          <div className="flex items-center justify-between rounded-xl bg-red-950/80 border border-red-500/40 px-3 py-2 text-white text-xs mx-1 mb-1 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="font-bold text-red-200">Recording Voice Note… ({recordingSeconds}s)</span>
            </div>
            <button
              onClick={stopRealMicRecording}
              className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold hover:bg-red-500 text-white transition"
            >
              <Square className="h-3 w-3 fill-current" />
              <span>Done</span>
            </button>
          </div>
        )}

        {/* Bottom Input Area */}
        <div className="flex items-center gap-1.5 rounded-b-2xl bg-[#202c33] p-2">
          {/* Microphone Recording Button */}
          <button
            type="button"
            onClick={isRecordingRealMic ? stopRealMicRecording : startRealMicRecording}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white transition shadow-md active:scale-90 ${
              isRecordingRealMic ? 'bg-red-600 animate-pulse' : 'bg-[#00a884] hover:bg-[#00a884]/90'
            }`}
            title={isRecordingRealMic ? 'Stop Recording' : 'Record Real Voice Note'}
          >
            {isRecordingRealMic ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage(inputText);
            }}
            placeholder="Type message or reply..."
            className="flex-1 rounded-2xl bg-[#2a3942] px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00a884]"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleSendMessage(inputText)}
            disabled={!inputText.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2a3942] text-slate-300 hover:text-white disabled:opacity-40 transition active:scale-90"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

