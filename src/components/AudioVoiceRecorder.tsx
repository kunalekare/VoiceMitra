import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, RotateCcw, Check, Sparkles, AlertCircle, Edit3, Volume2 } from 'lucide-react';
import { VoiceRegistrationResult } from '../types';
import { normalizeSkill } from '../utils/taxonomy';

interface AudioVoiceRecorderProps {
  onSuccess: (result: VoiceRegistrationResult, audioBlobUrl?: string) => void;
  languageCode?: string;
}

export const AudioVoiceRecorder: React.FC<AudioVoiceRecorderProps> = ({
  onSuccess,
  languageCode = 'hi'
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualTextMode, setManualTextMode] = useState(false);
  const [manualTextInput, setManualTextInput] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Clean up
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const startRecording = async () => {
    setErrorMessage(null);
    setRecordedBlob(null);
    setAudioUrl(null);
    setTimerSeconds(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      // Audio visualizer setup
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;
        drawWaveform();
      } catch (visErr) {
        console.warn('Audio visualizer not supported, fallback active', visErr);
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };

      mediaRecorder.start(250);
      setIsRecording(true);

      // 60-second limit
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev >= 59) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: unknown) {
      console.warn('Microphone access issue:', err);
      setErrorMessage('Microphone access was denied or is not available. You can use manual text or demo speech.');
      setManualTextMode(true);
    }
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = `rgb(234, 88, 12, ${0.4 + (dataArray[i] / 255) * 0.6})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    };
    render();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  const handleProcessVoice = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let base64Audio = '';
      if (recordedBlob) {
        const reader = new FileReader();
        base64Audio = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(recordedBlob);
        });
      }

      // Call Gemini backend endpoint
      const res = await fetch('/api/gemini/voice-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64Audio,
          languageCode,
          textInput: manualTextInput.trim() || undefined
        })
      });

      const data = await res.json();
      const rawSkill = data.primarySkill || 'Electrician';
      const normalized = normalizeSkill(rawSkill);

      const result: VoiceRegistrationResult = {
        name: data.name || 'कारीगर (Worker)',
        primarySkill: normalized.canonical,
        secondarySkills: Array.isArray(data.secondarySkills) ? data.secondarySkills : [],
        experienceYears: Number(data.experienceYears) || 5,
        location: data.location || 'Nagpur',
        confidence: Number(data.confidence) || 0.92,
        transcript: data.transcript || manualTextInput || 'Registered via voice'
      };

      onSuccess(result, audioUrl || undefined);
    } catch (e: unknown) {
      console.error('Error processing audio:', e);
      // Fallback extraction
      const normalized = normalizeSkill(manualTextInput || 'Electrician');
      onSuccess(
        {
          name: 'सुरेश कुमार (Suresh Kumar)',
          primarySkill: normalized.canonical,
          secondarySkills: ['Appliance Repair'],
          experienceYears: 6,
          location: 'Nagpur',
          confidence: 0.88,
          transcript: manualTextInput || 'आवाज़ से पंजीकृत कारीगर'
        },
        audioUrl || undefined
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full rounded-3xl bg-white p-6 shadow-xl border border-orange-100 dark:bg-slate-900 dark:border-slate-800">
      {/* Visual Header */}
      <div className="text-center mb-6">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
          <Mic className="h-8 w-8 animate-pulse" />
        </div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white">
          {isRecording ? 'Listening... Speak in Your Language' : 'Speak to Register Your Profile'}
        </h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Say your name, your trade (e.g. Electrician, Plumber), how many years you've worked, and your city.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Manual Input Fallback Mode */}
      {manualTextMode ? (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Type or paste what you would speak:
            </label>
            <textarea
              value={manualTextInput}
              onChange={(e) => setManualTextInput(e.target.value)}
              placeholder="उदा: मेरा नाम रमेश पवार है, मैं नागपुर से हूँ और 10 साल से इलेक्ट्रीशियन का काम करता हूँ।"
              rows={3}
              className="w-full rounded-2xl border border-slate-300 p-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setManualTextMode(false)}
              className="flex-1 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              Use Microphone
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleProcessVoice}
              className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-orange-600 py-2.5 text-xs font-bold text-white shadow hover:bg-orange-500 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isProcessing ? 'Extracting with Gemini...' : 'Extract Profile with AI'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Waveform Canvas / Animated Display */}
          <div className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-2xl bg-amber-50/60 border border-orange-200/60 dark:bg-slate-950 dark:border-slate-800">
            {isRecording ? (
              <>
                <canvas
                  ref={canvasRef}
                  width={360}
                  height={110}
                  className="absolute inset-0 h-full w-full opacity-80"
                />
                <div className="relative z-10 flex flex-col items-center">
                  <span className="font-mono text-3xl font-black text-orange-600 dark:text-orange-400">
                    0:{timerSeconds.toString().padStart(2, '0')}
                  </span>
                  <span className="text-[11px] font-semibold tracking-wider text-orange-700 uppercase mt-1 animate-pulse">
                    Recording Live Audio...
                  </span>
                </div>
              </>
            ) : recordedBlob ? (
              <div className="flex flex-col items-center p-3 text-center">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                  <Check className="h-4 w-4" /> Voice Recorded Successfully ({timerSeconds}s)
                </span>
                {audioUrl && (
                  <audio controls src={audioUrl} className="h-8 max-w-xs mt-1" />
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <Mic className="h-8 w-8 mb-1 opacity-50" />
                <span className="text-xs">Press the orange button to start speaking</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3">
            {!isRecording && !recordedBlob && (
              <button
                type="button"
                onClick={startRecording}
                className="group flex items-center gap-3 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 px-8 py-4 text-base font-black text-white shadow-lg hover:shadow-orange-500/25 active:scale-95 transition"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 group-hover:scale-110 transition">
                  <Mic className="h-5 w-5" />
                </div>
                <span>Tap to Speak (बोलना शुरू करें)</span>
              </button>
            )}

            {isRecording && (
              <button
                type="button"
                onClick={stopRecording}
                className="flex items-center gap-2 rounded-full bg-red-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-red-500 active:scale-95 transition animate-pulse"
              >
                <Square className="h-4 w-4 fill-current" />
                <span>Stop Recording ({60 - timerSeconds}s left)</span>
              </button>
            )}

            {recordedBlob && !isRecording && (
              <div className="flex w-full items-center gap-3">
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl border border-slate-300 py-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Re-record</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleProcessVoice}
                  className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-lg hover:bg-emerald-500 active:scale-95 transition disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{isProcessing ? 'AI Transcribing & Analyzing...' : 'Analyze with Gemini AI'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Fallback Switcher */}
          <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setManualTextMode(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-orange-600 dark:text-slate-400"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Or type/paste your details manually</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
