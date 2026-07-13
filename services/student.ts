import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "./api";

export type StudentProfile = {
  _id: string;
  name: string;
  email: string;
  branch: string;
  phoneNo: string;
  dob: string;
  fatherName: string;
  motherName: string;
  rollNo: string;
  slotNumber: number;
  batch: string | null;
};

// Always fetched fresh from the backend — the student never types any of
// this in, it's already on file from registration.
export const getMyProfile = async (): Promise<StudentProfile> => {
  const token = await AsyncStorage.getItem("studentToken");
  const res = await API.get("/admin/students/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.student;
};