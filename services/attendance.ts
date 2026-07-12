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
  qrToken: string;
  status: "active" | "ended";
  startedAt: string;
  endedAt: string | null;
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

export type MarkAttendanceResult = {
  message: string;
  status: "present" | "flagged" | "rejected";
  distanceFromAnchor: number;
};

export const markAttendance = async (params: {
  qrToken: string;
  studentGPS: { lat: number; lng: number };
  studentAccuracy?: number;
}): Promise<MarkAttendanceResult> => {
  const config = await studentAuthHeader();
  const res = await API.post("/attendance/mark", params, config);
  return res.data;
};