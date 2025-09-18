import { create } from 'zustand';

interface ScheduledCall {
    slug : string,
    date : string,
    time : string
}

interface ScheduledCallLogs{
    scheduledCalls : ScheduledCall[],
    setScheduledCallLogs: (scheduledCalls: ScheduledCall[]) => void;
    addScheduledCall: (call: ScheduledCall) => void;
}

export const useSchedulesCallStore = create<ScheduledCallLogs>((set) => ({
  scheduledCalls: [],
  setScheduledCallLogs: (scheduledCalls) => set({ scheduledCalls }),
  addScheduledCall: (call : ScheduledCall) =>
    set((state) => ({
      scheduledCalls: [call, ...state.scheduledCalls], 
    })),
}));