import React, { useState } from 'react';
import { X, Send, Mic, Play, CheckCheck, Phone, ArrowLeft, MoreVertical, Paperclip } from 'lucide-react';
import { useAppStore } from '../../store';
import { whatsappService, WhatsAppBotSession, WhatsAppMessage } from '../../services/whatsappService';

export const WhatsAppBotModal: React.FC = () => {
  const { closeModal, currentWorker } = useAppStore();
  const phone = currentWorker?.phone || '+91 98220 11201';

  const [session, setSession] = useState<WhatsAppBotSession>(() =>
    whatsappService.startSession(phone)
  );
  const [inputText, setInputText] = useState('');
  const [isSimulatingVoice, setIsSimulatingVoice] = useState(false);

  const handleSendMessage = (textToSend: string, isVoice: boolean = false) => {
    if (!textToSend.trim() && !isVoice) return;

    const userMsg: WhatsAppMessage = {
      id: `wa-u-${Date.now()}`,
      sender: 'user',
      text: isVoice ? '🎤 [Voice Note: 14s Hindi Audio Recorded]' : textToSend,
      isVoice,
      voiceDurationSeconds: isVoice ? 14 : undefined,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...session.messages, userMsg];
    const { nextState, botReply } = whatsappService.processMessage(
      { ...session, messages: updatedMessages },
      textToSend,
      isVoice
    );

    setSession({
      ...session,
      state: nextState,
      messages: [...updatedMessages, botReply]
    });
    setInputText('');
  };

  const handleSendSimulatedVoiceNote = () => {
    setIsSimulatingVoice(true);
    setTimeout(() => {
      setIsSimulatingVoice(false);
      handleSendMessage('मेरा नाम राजेश कुमार है, मैं नागपुर से हूँ और 8 साल से इलेक्ट्रीशियन का काम कर रहा हूँ।', true);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-sm rounded-[36px] bg-[#0b141a] p-2 shadow-2xl border-4 border-slate-700 animate-fadeIn">
        {/* Phone Speaker Notch */}
        <div className="mx-auto mb-2 h-4 w-32 rounded-full bg-slate-800 flex items-center justify-center">
          <div className="h-1.5 w-12 rounded-full bg-slate-900" />
        </div>

        {/* WhatsApp Top Header */}
        <div className="flex items-center justify-between rounded-t-2xl bg-[#202c33] px-3 py-2.5 text-white">
          <div className="flex items-center gap-2">
            <button onClick={closeModal} className="text-slate-300 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00a884] text-white font-black text-sm">
              SB
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-1">
                <span>SkillBridge Official Bot</span>
                <span className="text-[10px] text-[#00a884]">✓</span>
              </div>
              <div className="text-[10px] text-emerald-400">Online • State: {session.state}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <Phone className="h-4 w-4" />
            <MoreVertical className="h-4 w-4" />
            <button onClick={closeModal} className="ml-1 text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Chat Message Scrollable Feed */}
        <div className="h-[430px] overflow-y-auto bg-[#0b141a] p-3 space-y-2.5 text-xs bg-[radial-gradient(#111b21_1px,transparent_1px)] [background-size:16px_16px]">
          {session.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm leading-relaxed whitespace-pre-line ${
                  msg.sender === 'user'
                    ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                    : 'bg-[#202c33] text-[#d1d7db] rounded-tl-none'
                }`}
              >
                {msg.isVoice ? (
                  <div className="flex items-center gap-2.5 py-1">
                    <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00a884] text-white">
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    </button>
                    <div>
                      <div className="font-bold text-[11px] text-[#e9edef]">Voice Note ({msg.voiceDurationSeconds}s)</div>
                      <div className="text-[10px] text-emerald-200">Hindi Audio Transcription Ready</div>
                    </div>
                  </div>
                ) : (
                  msg.text
                )}

                <div className="mt-1 flex items-center justify-end gap-1 text-[9px] text-slate-400">
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.sender === 'user' && <CheckCheck className="h-3 w-3 text-cyan-400" />}
                </div>
              </div>

              {/* Bot Action Buttons */}
              {msg.buttons && (
                <div className="mt-1.5 flex flex-wrap gap-1.5 max-w-[85%]">
                  {msg.buttons.map((btn, bIdx) => (
                    <button
                      key={bIdx}
                      onClick={() => handleSendMessage(btn.payload)}
                      className="rounded-xl bg-[#202c33] border border-[#00a884]/40 px-3 py-1.5 text-[11px] font-bold text-[#00a884] hover:bg-[#00a884] hover:text-white transition shadow-sm"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-1.5 rounded-b-2xl bg-[#202c33] p-2">
          <button
            type="button"
            onClick={handleSendSimulatedVoiceNote}
            disabled={isSimulatingVoice}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white hover:bg-[#00a884]/80 active:scale-95 transition"
            title="Simulate Recording Hindi Voice Note"
          >
            <Mic className={`h-5 w-5 ${isSimulatingVoice ? 'animate-spin' : ''}`} />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage(inputText);
            }}
            placeholder="Type message or reply..."
            className="flex-1 rounded-2xl bg-[#2a3942] px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none"
          />

          <button
            type="button"
            onClick={() => handleSendMessage(inputText)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2a3942] text-slate-300 hover:text-white"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
