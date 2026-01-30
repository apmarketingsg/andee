
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { AssistantState, Appointment } from '../types';

interface VoiceAssistantProps {
  isActive: boolean;
  onClose: () => void;
  onStateChange: (state: AssistantState) => void;
  tools: {
    createAppointment: (title: string, start: string, end: string) => any;
    rescheduleAppointment: (id: string, newStart: string, newEnd: string) => any;
    cancelAppointment: (id: string) => any;
    getAppointments: (date: string) => any;
  };
  proactiveMeeting?: Appointment | null;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ isActive, onClose, onStateChange, tools, proactiveMeeting }) => {
  // Use a ref for nextStartTime to avoid state update races and scope issues in callbacks as per Gemini Live API guidelines
  const nextStartTimeRef = useRef(0);

  const sessionPromise = useRef<Promise<any> | null>(null);
  const inputAudioContext = useRef<AudioContext | null>(null);
  const outputAudioContext = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const handleToolCall = useCallback(async (message: LiveServerMessage) => {
    if (message.toolCall) {
      for (const fc of message.toolCall.functionCalls) {
        let result: any = "Function error";
        switch (fc.name) {
          case 'create_appointment':
            result = tools.createAppointment(fc.args.title as string, fc.args.start as string, fc.args.end as string);
            break;
          case 'reschedule_appointment':
            result = tools.rescheduleAppointment(fc.args.id as string, fc.args.newStart as string, fc.args.newEnd as string);
            break;
          case 'cancel_appointment':
            result = tools.cancelAppointment(fc.args.id as string);
            break;
          case 'get_appointments':
            result = tools.getAppointments(fc.args.date as string);
            break;
        }
        if (sessionPromise.current) {
          const session = await sessionPromise.current;
          session.sendToolResponse({
            functionResponses: { id: fc.id, name: fc.name, response: { result } }
          });
        }
      }
    }
  }, [tools]);

  const initSession = useCallback(async () => {
    try {
      // Always initialize GoogleGenAI with a named parameter for apiKey
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      inputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

      const toolDeclarations: FunctionDeclaration[] = [
        {
          name: 'create_appointment',
          parameters: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              start: { type: Type.STRING },
              end: { type: Type.STRING }
            },
            required: ['title', 'start', 'end']
          }
        },
        {
          name: 'get_appointments',
          parameters: {
            type: Type.OBJECT,
            properties: { date: { type: Type.STRING } },
            required: ['date']
          }
        },
        {
          name: 'reschedule_appointment',
          parameters: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              newStart: { type: Type.STRING },
              newEnd: { type: Type.STRING }
            },
            required: ['id', 'newStart', 'newEnd']
          }
        },
        {
          name: 'cancel_appointment',
          parameters: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING }
            },
            required: ['id']
          }
        }
      ];

      sessionPromise.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          tools: [{ functionDeclarations: toolDeclarations }],
          systemInstruction: proactiveMeeting 
            ? `Remind user about ${proactiveMeeting.title} at ${proactiveMeeting.start.toLocaleTimeString()}.`
            : `You are Andee, a calendar assistant. Be helpful and natural.`,
        },
        callbacks: {
          onopen: () => {
            onStateChange(AssistantState.ACTIVE_CALL);
            const source = inputAudioContext.current!.createMediaStreamSource(streamRef.current!);
            const scriptProcessor = inputAudioContext.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              if (sessionPromise.current) {
                const pcmBlob = createBlob(e.inputBuffer.getChannelData(0));
                // Critical: Use the session promise to send inputs to avoid race conditions
                sessionPromise.current.then(session => session.sendRealtimeInput({ media: pcmBlob }));
              }
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.current!.destination);
          },
          onmessage: async (m) => {
            handleToolCall(m);
            // Fix: Use optional chaining correctly for all levels of nested property access
            const base64Audio = m.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            
            if (base64Audio && outputAudioContext.current) {
              const buffer = await decodeAudioData(decode(base64Audio), outputAudioContext.current, 24000, 1);
              const startTime = Math.max(nextStartTimeRef.current, outputAudioContext.current.currentTime);
              
              const source = outputAudioContext.current.createBufferSource();
              source.buffer = buffer;
              source.connect(outputAudioContext.current.destination);
              source.start(startTime);
              
              nextStartTimeRef.current = startTime + buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => {
                sourcesRef.current.delete(source);
              };
            }

            // Correctly handle interruption signal to stop all playing audio sources
            if (m.serverContent?.interrupted) {
              for (const source of sourcesRef.current.values()) {
                source.stop();
                sourcesRef.current.delete(source);
              }
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => onClose(),
          onerror: (e) => console.error(e)
        }
      });
    } catch (err) {
      console.error(err);
    }
  }, [proactiveMeeting, onStateChange, onClose, handleToolCall]);

  const handleToggle = () => {
    if (isActive) {
      sessionPromise.current?.then(s => s.close());
      onClose();
    } else {
      initSession();
    }
  };

  return (
    <div className="relative group">
      {/* Outer Glow Ring */}
      <div className={`absolute -inset-8 bg-[#fb714d]/10 rounded-full blur-3xl transition-opacity duration-700 ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>
      
      {/* Wave Rings (Active Only) */}
      {isActive && (
        <>
          <div className="absolute inset-0 bg-[#fb714d]/20 rounded-full animate-ping"></div>
          <div className="absolute -inset-4 border-2 border-[#fb714d]/30 rounded-full animate-[pulse-ring_2s_infinite]"></div>
        </>
      )}

      {/* Main Microphone Button */}
      <button
        onClick={handleToggle}
        className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
          isActive 
            ? 'bg-[#fb714d] scale-105 rotate-0 shadow-[#fb714d]/40' 
            : 'bg-[#fb714d] hover:scale-110 shadow-[#fb714d]/20'
        }`}
      >
        {isActive ? (
          <div className="flex gap-1.5 h-12 items-center">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className="w-1.5 bg-white rounded-full animate-bounce" 
                style={{ height: `${40 + Math.random() * 60}%`, animationDelay: `${i * 0.15}s` }}
              ></div>
            ))}
          </div>
        ) : (
          <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
             <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default VoiceAssistant;

