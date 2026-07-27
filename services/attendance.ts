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

export type AttendanceSession = {
  _id: string;
  faculty: string;
  subject: string;
  venue: string;
  day: string;
  slot: string;
  anchorLocation: { lat: number; lng: number };
  anchorAccuracy: number;
  radiusMeters: number;
  batches: string[];
  attendanceCode: string;
  status: "active" | "ended";
  startedAt: string;
  endedAt: string | null;
  feedbackQuestions: { text: string; order: number }[];
  feedbackStatus: "not_set" | "open" | "closed";
  feedbackStartedAt: string | null;
};

export type AttendanceLiveCounts = {
  status: "active" | "ended";
  presentCount: number;
  flaggedCount: number;
  rejectedCount: number;
  totalMarked: number;
};

export type FlaggedRecord = {
  _id: string;
  student: { _id: string; name: string; rollNo: string; branch: string };
  scannedAt: string;
  distanceFromAnchor: number;
  status: "flagged" | "rejected";
  reviewedByProfessor: boolean;
  finalStatus: "present" | "absent" | null;
};

// Confirmed-present records — read-only, no review needed since these
// already passed the geofence check automatically.
export type PresentRecord = {
  _id: string;
  student: { _id: string; name: string; rollNo: string; branch: string };
  scannedAt: string;
  distanceFromAnchor: number;
  status: "present";
};

// ---------- FACULTY ----------

export const startAttendanceSession = async (params: {
  subject: string;
  venue?: string;
  day?: string;
  slot?: string;
  professorLocation: { lat: number; lng: number };
  professorAccuracy?: number;
  batches?: string[];
}): Promise<AttendanceSession> => {
  const config = await facultyAuthHeader();
  const res = await API.post("/attendance/session/start", params, config);
  return res.data.session;
};

export const getAttendanceSession = async (sessionId: string): Promise<AttendanceSession> => {
  const config = await facultyAuthHeader();
  const res = await API.get(`/attendance/session/${sessionId}`, config);
  return res.data.session;
};

export const getAttendanceLive = async (sessionId: string): Promise<AttendanceLiveCounts> => {
  const config = await facultyAuthHeader();
  const res = await API.get(`/attendance/session/${sessionId}/live`, config);
  return res.data;
};

export const getPresentRecords = async (sessionId: string): Promise<PresentRecord[]> => {
  const config = await facultyAuthHeader();
  const res = await API.get(`/attendance/session/${sessionId}/present`, config);
  return res.data.records || [];
};

export const getFlaggedRecords = async (sessionId: string): Promise<FlaggedRecord[]> => {
  const config = await facultyAuthHeader();
  const res = await API.get(`/attendance/session/${sessionId}/flagged`, config);
  return res.data.records || [];
};

export const reviewAttendanceRecord = async (
  sessionId: string,
  recordId: string,
  finalStatus: "present" | "absent"
): Promise<void> => {
  const config = await facultyAuthHeader();
  await API.post(`/attendance/session/${sessionId}/review`, { recordId, finalStatus }, config);
};

// The code/QR shown to the professor rotate every `rotateSeconds` — this is
// purely computed server-side (no DB writes happen on rotation), so this
// can be polled freely. `expiresAt` is a server timestamp (ms) for when the
// current code will next change; use it to time the next poll / show a
// countdown instead of polling on a fixed interval that can drift.
export type RotatingCode = {
  active: boolean;
  code: string;
  qrValue: string;
  rotateSeconds: number;
  expiresAt: number | null;
  serverTime: number;
};

export const getRotatingCode = async (sessionId: string): Promise<RotatingCode> => {
  const config = await facultyAuthHeader();
  const res = await API.get(`/attendance/session/${sessionId}/rotating-code`, config);
  return res.data;
};

export const endAttendanceSession = async (sessionId: string): Promise<AttendanceSession> => {
  const config = await facultyAuthHeader();
  const res = await API.post(`/attendance/session/${sessionId}/end`, {}, config);
  return res.data.session;
};

// Checks whether a session was already started today for this exact
// day+slot — used by ClassDetails to show "View Attendance" instead of
// letting the professor start a duplicate session for a class already run.
export const getTodaysSessionForSlot = async (day: string, slot: string): Promise<AttendanceSession | null> => {
  const config = await facultyAuthHeader();
  const res = await API.get(`/attendance/session/today`, {
    ...config,
    params: { day, slot },
  });
  return res.data.session;
};

export type RosterStudent = {
  _id: string;
  name: string;
  rollNo: string;
  branch: string;
  batch: string | null;
  status: 'present' | 'flagged' | 'rejected' | 'absent';
  markedManually: boolean;
  recordId: string | null;
  // True if they scanned/entered a code but haven't submitted the
  // mandatory feedback yet — so they're not counted as present quite yet.
  pendingFeedback?: boolean;
};

export const getSessionRoster = async (sessionId: string): Promise<RosterStudent[]> => {
  const config = await facultyAuthHeader();
  const res = await API.get(`/attendance/session/${sessionId}/roster`, config);
  return res.data.students || [];
};

export const markStudentManually = async (sessionId: string, studentId: string): Promise<void> => {
  const config = await facultyAuthHeader();
  await API.post(`/attendance/session/${sessionId}/mark-manual`, { studentId }, config);
};

// ---------- FACULTY: Class History ----------
// A faculty member's own ended classes, with attendance kept for reference —
// powers the "Class History" screen (distinct from AttendanceRoster, which
// is the live/editable manage-attendance view).
export type HistorySession = {
  _id: string;
  subject: string;
  venue: string;
  day: string;
  slot: string;
  batches: string[];
  startedAt: string;
  endedAt: string | null;
};

export const getFacultyHistorySessions = async (): Promise<HistorySession[]> => {
  const config = await facultyAuthHeader();
  const res = await API.get(`/attendance/faculty/history/sessions`, config);
  return res.data.sessions || [];
};

// ---------- STUDENT ----------

export type ActiveSessionInfo = {
  _id: string;
  subject: string;
  venue: string;
  day: string;
  slot: string;
  startedAt: string;
  faculty: { name: string; department: string } | null;
} | null;

export type ActiveSessionResponse = {
  // 'attendance' -> a live session is running, show "Mark Attendance"
  // 'feedback'   -> no live session, but feedback is open for a session
  //                 this student attended and hasn't submitted yet — show
  //                 "Give Feedback" instead.
  type: "attendance" | "feedback";
  session: ActiveSessionInfo;
  alreadyMarked: boolean;
  myStatus: "present" | "flagged" | "rejected" | null;
};

// Powers the "Live Class" card in the Bootcamp screen — returns the
// currently active session (if any faculty has one running right now).
export const getActiveSessionForStudent = async (): Promise<ActiveSessionResponse> => {
  const config = await studentAuthHeader();
  const res = await API.get("/attendance/active", config);
  return res.data;
};

// ---------- STUDENT: Class History ----------
// A student's own ended classes with their attendance status — powers the
// student-facing "Class History" screen (their view of the same data
// faculty see in HistorySession, but scoped to their own present/absent).
export type StudentHistorySession = {
  _id: string;
  subject: string;
  venue: string;
  day: string;
  slot: string;
  startedAt: string;
  endedAt: string | null;
  faculty: { name: string; department: string } | null;
  status: "present" | "absent";
};

export const getStudentHistorySessions = async (): Promise<StudentHistorySession[]> => {
  const config = await studentAuthHeader();
  const res = await API.get(`/attendance/student/history`, config);
  return res.data.sessions || [];
};

export type MarkAttendanceResult = {
  message: string;
  status: "present" | "flagged" | "rejected";
  distanceFromAnchor: number;
  // True when this scan/code entry still needs the mandatory feedback form
  // before it counts as marked. When true, the app should navigate straight
  // to GiveFeedback (with sessionId) instead of showing the result screen.
  requiresFeedback: boolean;
  sessionId: string;
};

export const markAttendance = async (params: {
  code: string;
  // Present when the code came from a QR scan (the QR encodes both the
  // session id and the current code) — lets the server skip straight to
  // that session instead of checking every active one. Omit when the code
  // was typed by hand; the server will search active sessions for a match.
  sessionId?: string;
  studentGPS: { lat: number; lng: number };
  studentAccuracy?: number;
}): Promise<MarkAttendanceResult> => {
  const config = await studentAuthHeader();
  const res = await API.post("/attendance/mark", { ...params, code: params.code.trim().toUpperCase() }, config);
  return res.data;
};