import {create} from 'zustand';

interface CallRecording {
  callId: string;
  recorded: boolean;
  slug : string;
  date : string;
  time : string;
  peers : {img : string, name : string, email : string}[];
  clips: { url: string; roomId: string; clipNum: string; public_id: string }[];
}

interface RecordingState {
  recordings: CallRecording[];
  setRecordings: (recordings: CallRecording[]) => void;
}

export const useRecordingStore = create<RecordingState>((set) => ({
  recordings: [],
  setRecordings: (recordings) => set({ recordings }),
})); 
