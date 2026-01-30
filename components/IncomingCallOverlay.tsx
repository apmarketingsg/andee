
import React from 'react';
import { Appointment } from '../types';

interface IncomingCallOverlayProps {
  meeting: Appointment;
  onDecline: () => void;
  onAccept: () => void;
}

const IncomingCallOverlay: React.FC<IncomingCallOverlayProps> = ({ meeting, onDecline, onAccept }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md">
      <div className="w-full max-w-sm flex flex-col items-center text-center p-8">
        <div className="relative mb-12">
            <div className="absolute inset-0 bg-[#fb714d] rounded-full animate-ping opacity-25"></div>
            <div className="relative w-32 h-32 rounded-full bg-[#fb714d] flex items-center justify-center border-4 border-[#fb714d]/50">
               <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
               </svg>
            </div>
        </div>

        <h2 className="text-white text-3xl font-bold mb-2">Andee Assistant</h2>
        <p className="text-[#fb714d] font-medium mb-12">Incoming check-in regarding:</p>
        
        <div className="bg-white/5 p-6 rounded-3xl border border-white/10 w-full mb-20">
           <p className="text-white text-xl font-bold">{meeting.title}</p>
           <p className="text-white/40 text-sm mt-1 font-medium">Starts in {Math.round((meeting.start.getTime() - new Date().getTime()) / 60000)} minutes</p>
        </div>

        <div className="flex w-full justify-around items-center">
            <button 
                onClick={onDecline}
                className="group flex flex-col items-center gap-3"
            >
                <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-500 shadow-lg group-hover:bg-red-500 group-hover:text-white transition-all">
                    <svg className="w-8 h-8 rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z" />
                    </svg>
                </div>
                <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Decline</span>
            </button>

            <button 
                onClick={onAccept}
                className="group flex flex-col items-center gap-3"
            >
                <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center text-green-500 shadow-lg group-hover:bg-green-500 group-hover:text-white transition-all">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z" />
                    </svg>
                </div>
                <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Answer</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallOverlay;
