import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "./api";

const authHeader = async () => {
  const token = await AsyncStorage.getItem("studentToken");
  return { headers: { Authorization: `Bearer ${token}` } };
};

// Returns the student's assigned batch code (e.g. "RedA"), or null if
// they haven't been assigned to a batch yet.
export const getMyBatch = async (): Promise<string | null> => {
  const config = await authHeader();
  const res = await API.get("/bootcamp/my-batch", config);
  return res.data.batch;
};