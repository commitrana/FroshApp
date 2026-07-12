import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://frosh-app-backend.onrender.com/api';

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