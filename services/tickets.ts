import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "./api";

const authHeader = async () => {
  const token = await AsyncStorage.getItem("studentToken");
  return { headers: { Authorization: `Bearer ${token}` } };
};

export type Ticket = {
  _id: string;
  event: {
    _id: string;
    name: string;
    club?: string;
    date: string;
    time: string;
    venue: string;
    status: "live" | "upcoming" | "past";
  };
  student: string;
  qrToken: string;
  // Which slot (1-5) this ticket is for, if the event has slots.
  // 0 = the event has no slots (booked the plain event).
  slot: number;
  status: "valid" | "used";
  issuedAt: string;
  scannedAt: string | null;
};

// Register for an event — issues a ticket (or returns the existing one
// if the student already registered, regardless of which slot they pick —
// a student can only ever hold one ticket per event). Throws on sold-out,
// slot-not-live, or other server errors.
// `slot` is required for events with slots (1-5) and ignored/omitted for
// events without slots.
export const registerForEvent = async (eventId: string, slot?: number): Promise<Ticket> => {
  const config = await authHeader();
  const body: { eventId: string; slot?: number } = { eventId };
  if (slot !== undefined) body.slot = slot;
  const res = await API.post("/tickets/register", body, config);
  return res.data.ticket;
};
export async function refreshTicketQR(ticketId: string): Promise<Ticket> {
  const res = await API.post(`/tickets/${ticketId}/refresh-qr`);
  return res.data;
}
// All tickets belonging to the logged-in student — used to decide
// whether to show "Register" or "View Ticket" for each event.
// Student-only: if there's no student token in storage (e.g. a faculty
// account, which stores its token under "facultyToken" instead), skip the
// network call entirely instead of sending "Authorization: Bearer null"
// and letting the backend 401.
export const getMyTickets = async (): Promise<Ticket[]> => {
  const token = await AsyncStorage.getItem("studentToken");
  if (!token) return [];

  const res = await API.get("/tickets/my-tickets", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.tickets || [];
};