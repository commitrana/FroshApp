import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/apiConfig';

const API_URL = API_BASE_URL;

// Fetch the student's CURRENT batch straight from the server, rather than
// trusting the cached copy in AsyncStorage (which is only ever set once,
// at login — if an admin reassigns the student's batch afterward, that
// cached value goes stale until the student logs out and back in).
// Backed by GET /api/bootcamp/my-batch, which looks up BootcampStudent
// fresh by email on every call.
export const getMyBatch = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('studentToken');
    // Add a request nonce as a second line of defence for devices/proxies
    // that cache GET requests despite the server's no-store response.
    const response = await fetch(`${API_URL}/bootcamp/my-batch?_=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Unable to fetch batch (${response.status})`);
    const data = await response.json();
    return data?.batch ?? null;
  } catch (error) {
    console.error('Error fetching current batch:', error);
    return null;
  }
};

// ✅ Fetch timetable image for a specific batch
export const getBatchTimetableImage = async (batchCode: string): Promise<string | null> => {
  try {
    const response = await fetch(`${API_URL}/faculty-timetable/${batchCode}`);
    const data = await response.json();
    
    if (data && data.batch && data.batch.imageUrl) {
      return data.batch.imageUrl;
    }
    return null;
  } catch (error) {
    console.error('Error fetching batch timetable:', error);
    return null;
  }
};

// ✅ Fetch all batches (if needed)
export const getAllBatches = async () => {
  try {
    const response = await fetch(`${API_URL}/faculty-timetable/admin/list`);
    const data = await response.json();
    return data.batches || [];
  } catch (error) {
    console.error('Error fetching batches:', error);
    return [];
  }
};

export type ClassEntry = {
  day: string;
  slot: string;
  subject: string;
  venue: string;
  faculty: string;
  department: string;
};

export type MyTimetableResponse = {
  batch: string | null;
  days: string[];
  timeSlots: string[];
  classes: ClassEntry[];
};

// Fetch the student's REAL class schedule — built server-side from every
// faculty's timetable, filtered down to lectures assigned to this
// student's batch. Backed by GET /api/bootcamp/my-timetable.
export const getMyTimetable = async (): Promise<MyTimetableResponse | null> => {
  try {
    const token = await AsyncStorage.getItem('studentToken');
    // The timetable is admin-managed live data, so every refresh must reach
    // the server instead of reusing a previously cached schedule.
    const response = await fetch(`${API_URL}/bootcamp/my-timetable?_=${Date.now()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`Unable to fetch timetable (${response.status})`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching my timetable:', error);
    return null;
  }
};