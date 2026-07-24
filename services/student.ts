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
  profileImage: string | null;
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

// Uploads (or replaces) the student's profile photo. `imageUri` should
// already be resized/compressed on-device (see AccountScreen's photo
// picker) before being passed here — this just forwards the file to the
// backend, which hands it off to Supabase Storage.
// Returns the new public image URL on success.
export const uploadProfilePhoto = async (imageUri: string): Promise<string> => {
  const token = await AsyncStorage.getItem("studentToken");

  const formData = new FormData();
  formData.append("photo", {
    uri: imageUri,
    name: "profile.jpg",
    type: "image/jpeg",
  } as any);

  const res = await API.post("/admin/students/me/photo", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      // Unlike the web admin's axios instance (where Content-Type should be
      // left unset so the browser injects the correct multipart boundary),
      // React Native's networking layer needs this set explicitly — it
      // fills in the correct boundary itself under the hood. Without this,
      // the shared API instance's default 'application/json' header wins,
      // the backend sees a JSON request instead of multipart, and multer
      // never populates req.file (-> "No image file provided").
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data.profileImage;
};