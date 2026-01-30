
import React from 'react';
import { Appointment } from '../types';

interface MeetingListProps {
  appointments: Appointment[];
}

const MeetingList: React.FC<MeetingListProps> = ({ appointments }) => {
  const todayAppointments = appointments
    .filter(app => app.start.toDateString() === new Date().toDateString())
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  if (todayAppointments.length === 0) {
    return (
      <div className="text-white/20 text-center py-8 italic">
        No meetings scheduled for today.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {todayAppointments.map((app) => (
        <div 
          key={app.id} 
          className="bg-[#1a1d23] rounded-3xl p-6 border-l-4 border-[#fb714d] shadow-xl hover:bg-[#21252c] transition-colors group cursor-pointer"
        >
          <div className="flex flex-col gap-1">
            <span className="text-[#fb714d] text-sm font-bold uppercase tracking-wider">
              {app.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <h3 className="text-white text-lg font-bold group-hover:text-white transition-colors">
              {app.title}
            </h3>
            {app.description && (
              <p className="text-white/40 text-sm font-medium">
                {app.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MeetingList;
