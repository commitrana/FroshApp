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

export type QuestionType =
  | "short_answer"
  | "paragraph"
  | "multiple_choice"
  | "checkboxes"
  | "dropdown"
  | "linear_scale"
  | "numerical";

export type QuestionDef = {
  text: string;
  type: QuestionType;
  options?: string[]; // multiple_choice / checkboxes / dropdown
  scaleMin?: number;   // linear_scale
  scaleMax?: number;   // linear_scale
};

// ---------- FACULTY ----------

// Faculty adds exactly 5 questions for a session they just ended.
// Kept for backward compatibility — the current flow sets questions on the
// timetable slot instead (see below), before attendance even starts.
export const setSessionFeedbackQuestions = async (
  sessionId: string,
  questions: QuestionDef[]
): Promise<void> => {
  const config = await facultyAuthHeader();
  await API.post(`/feedback/session/${sessionId}/questions`, { questions }, config);
};

// Faculty opens feedback collection — students then see "Give Feedback".
// No longer called from the app — feedback now opens automatically as soon
// as a session starts (questions are mandatory before Start Attendance).
export const startSessionFeedback = async (sessionId: string): Promise<void> => {
  const config = await facultyAuthHeader();
  await API.post(`/feedback/session/${sessionId}/start`, {}, config);
};

// ---------- FACULTY: slot-level questions (set before attendance starts) ----------

// Gets the 5 draft questions already saved for one of the faculty's own
// timetable slots (day + slot), if any. Returns [] if never set.
export const getSlotFeedbackQuestions = async (day: string, slot: string): Promise<QuestionDef[]> => {
  const config = await facultyAuthHeader();
  const res = await API.get(`/feedback/slot/questions`, { ...config, params: { day, slot } });
  return res.data.questions || [];
};

// Saves (creates or edits) exactly 5 questions for a timetable slot. Pass
// sessionId when editing while that slot's attendance session is currently
// active, so the live session picks up the edit immediately.
export const setSlotFeedbackQuestions = async (
  day: string,
  slot: string,
  questions: QuestionDef[],
  sessionId?: string
): Promise<QuestionDef[]> => {
  const config = await facultyAuthHeader();
  const res = await API.put(`/feedback/slot/questions`, { day, slot, questions, sessionId }, config);
  return res.data.questions || [];
};

export type FeedbackAnswer = {
  source: "admin" | "faculty";
  order: number;
  questionText: string;
  questionType: QuestionType;
  textValue?: string;
  numberValue?: number;
  selectedOptions?: string[];
};

export type FeedbackResponseRecord = {
  _id: string;
  student: { _id: string; name: string; rollNo: string; branch: string };
  submittedAt: string;
  answers: FeedbackAnswer[];
};

export type FacultyFeedbackResponses = {
  subject: string;
  questions: (QuestionDef & { order: number })[];
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
  type: QuestionType;
  options: string[];
  scaleMin: number;
  scaleMax: number;
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
  textValue?: string;
  numberValue?: number;
  selectedOptions?: string[];
};

export const submitFeedback = async (
  sessionId: string,
  answers: SubmitFeedbackAnswer[]
): Promise<void> => {
  const config = await studentAuthHeader();
  await API.post(`/feedback/session/${sessionId}/submit`, { answers }, config);
};