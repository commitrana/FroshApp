import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "./api";

const facultyAuthHeader = async () => {
  const token = await AsyncStorage.getItem("facultyToken");
  return { headers: { Authorization: `Bearer ${token}` } };
};

const studentAuthHeader = async () => {
  const token = await AsyncStorage.getItem("studentToken");
  return { headers: { Authorization: `Bearer ${token}` } };
};

// ---------- FACULTY ----------

// Faculty adds exactly 5 questions for a session they just ended.
export const setSessionFeedbackQuestions = async (
  sessionId: string,
  questions: string[]
): Promise<void> => {
  const config = await facultyAuthHeader();
  await API.post(`/feedback/session/${sessionId}/questions`, { questions }, config);
};

// Faculty opens feedback collection — students then see "Give Feedback".
export const startSessionFeedback = async (sessionId: string): Promise<void> => {
  const config = await facultyAuthHeader();
  await API.post(`/feedback/session/${sessionId}/start`, {}, config);
};

export type FeedbackAnswer = {
  source: "admin" | "faculty";
  order: number;
  questionText: string;
  rating: number;
  comment: string;
};

export type FeedbackResponseRecord = {
  _id: string;
  student: { _id: string; name: string; rollNo: string; branch: string };
  submittedAt: string;
  answers: FeedbackAnswer[];
};

export type FacultyFeedbackResponses = {
  subject: string;
  questions: { text: string; order: number }[];
  count: number;
  responses: FeedbackResponseRecord[];
};

// Faculty views responses to their own 5 questions only.
export const getFacultyFeedbackResponses = async (sessionId: string): Promise<FacultyFeedbackResponses> => {
  const config = await facultyAuthHeader();
  const res = await API.get(`/feedback/session/${sessionId}/responses`, config);
  return res.data;
};

// ---------- STUDENT ----------

export type FeedbackQuestionItem = {
  source: "admin" | "faculty";
  order: number;
  text: string;
};

export type FeedbackFormResponse = {
  session: { _id: string; subject: string; venue: string };
  questions: FeedbackQuestionItem[];
};

// Fetches the combined 10-question form for a session. Throws (via axios)
// if the student isn't eligible, feedback isn't open, or they already submitted.
export const getFeedbackForm = async (sessionId: string): Promise<FeedbackFormResponse> => {
  const config = await studentAuthHeader();
  const res = await API.get(`/feedback/session/${sessionId}/form`, config);
  return res.data;
};

export type SubmitFeedbackAnswer = {
  source: "admin" | "faculty";
  order: number;
  rating: number;
  comment?: string;
};

export const submitFeedback = async (
  sessionId: string,
  answers: SubmitFeedbackAnswer[]
): Promise<void> => {
  const config = await studentAuthHeader();
  await API.post(`/feedback/session/${sessionId}/submit`, { answers }, config);
};
