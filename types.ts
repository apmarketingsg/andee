
export interface Appointment {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  provider: 'google' | 'outlook' | 'yahoo';
}

export enum AssistantState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
  INCOMING_CALL = 'INCOMING_CALL',
  ACTIVE_CALL = 'ACTIVE_CALL'
}
