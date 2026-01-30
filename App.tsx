
import React, { useState, useEffect } from 'react';
import { Appointment, AssistantState } from './types';
import VoiceAssistant from './components/VoiceAssistant';
import MeetingList from './components/MeetingList';
import IncomingCallOverlay from './components/IncomingCallOverlay';

const App: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: '1',
      title: 'Team Standup',
      description: 'with Engineering Team',
      start: new Date(new Date().setHours(10, 0, 0, 0)),
      end: new Date(new Date().setHours(10, 30, 0, 0)),
      provider: 'google',
    },
    {
      id: '2',
      title: 'Client Review',
      description: 'with John Tan',
      start: new Date(new Date().setHours(14, 30, 0, 0)),
      end: new Date(new Date().setHours(15, 30, 0, 0)),
      provider: 'outlook',
    }
  ]);

  const [assistantState, setAssistantState] = useState<AssistantState>(AssistantState.IDLE);
  const [upcomingMeeting, setUpcomingMeeting] = useState<Appointment | null>(null);

  // Check for meetings in the next 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const thirtyMinsLater = new Date(now.getTime() + 30 * 60000);
      
      const urgentMeeting = appointments.find(app => 
        app.start > now && app.start <= thirtyMinsLater
      );

      if (urgentMeeting && assistantState === AssistantState.IDLE) {
        setUpcomingMeeting(urgentMeeting);
        setAssistantState(AssistantState.INCOMING_CALL);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [appointments, assistantState]);

  const handleDeclineCall = () => {
    setAssistantState(AssistantState.IDLE);
    setUpcomingMeeting(null);
  };

  const handleAcceptCall = () => {
    setAssistantState(AssistantState.ACTIVE_CALL);
  };

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto px-6 pt-10 pb-8 bg-[#0f1115] relative overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[30%] bg-[#fb714d]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-5%] right-[-5%] w-[60%] h-[20%] bg-[#fb714d]/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative z-10 flex flex-col h-full flex-1">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-12">
          <div className="flex items-center space-x-2">
             <div className="w-2.5 h-2.5 rounded-full bg-[#fb714d] animate-pulse shadow-[0_0_10px_#fb714d]"></div>
             <h1 className="text-2xl font-extrabold tracking-tighter text-white">Andee</h1>
          </div>
          <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] mt-1 font-bold">Intelligent Calendar</p>
        </div>

        {/* Main Voice Interface */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <VoiceAssistant 
              isActive={assistantState === AssistantState.ACTIVE_CALL}
              onClose={() => setAssistantState(AssistantState.IDLE)}
              onStateChange={setAssistantState}
              proactiveMeeting={upcomingMeeting}
              tools={{
                  createAppointment: (t, s, e) => {
                      const app: Appointment = { id: Math.random().toString(), title: t, start: new Date(s), end: new Date(e), provider: 'google' };
                      setAppointments(prev => [...prev, app]);
                      return { status: "success" };
                  },
                  rescheduleAppointment: (id, s, e) => {
                      setAppointments(prev => prev.map(a => a.id === id ? { ...a, start: new Date(s), end: new Date(e) } : a));
                      return { status: "success" };
                  },
                  cancelAppointment: (id) => {
                      setAppointments(prev => prev.filter(a => a.id !== id));
                      return { status: "success" };
                  },
                  getAppointments: (d) => {
                      const filtered = appointments.filter(a => a.start.toDateString() === new Date(d).toDateString());
                      return { status: "success", appointments: filtered };
                  }
              }}
          />
          <p className="mt-8 text-white/30 text-sm font-medium tracking-wide text-center">
              {assistantState === AssistantState.ACTIVE_CALL ? 'Andee is listening...' : 'Tap to speak with Andee'}
          </p>
        </div>

        {/* Meetings Section */}
        <div className="mt-12 mb-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white/90">Today's Schedule</h2>
            <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white/40 uppercase tracking-widest">
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <MeetingList appointments={appointments} />
        </div>
      </div>

      {/* Proactive Reminder Overlay */}
      {assistantState === AssistantState.INCOMING_CALL && upcomingMeeting && (
        <IncomingCallOverlay 
          meeting={upcomingMeeting} 
          onDecline={handleDeclineCall} 
          onAccept={handleAcceptCall} 
        />
      )}
    </div>
  );
};

export default App;
