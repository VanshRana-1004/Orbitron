import {create} from 'zustand';

interface CallRecording {
  roomId: number;
  recorded: boolean;
  processing: boolean;
  clips: { url: string; roomId: string; clipNum: string; public_id: string }[];
}

interface RecordingState {
  recordings: CallRecording[];
  setRecordings: (recordings: CallRecording[]) => void;
  updateRecording: (roomId: number, update: Partial<CallRecording>) => void;
}

export const useRecordingStore = create<RecordingState>((set) => ({
  recordings: [],
  setRecordings: (recordings) => set({ recordings }),
  updateRecording: (roomId, update) =>
    set((state) => ({
      recordings: state.recordings.map((rec) =>
        rec.roomId === roomId ? { ...rec, ...update } : rec
      ),
    })),
}));
