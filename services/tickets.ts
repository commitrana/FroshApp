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
  status: "valid" | "used";
  issuedAt: string;
  scannedAt: string | null;
};

// Register for an event — issues a ticket (or returns the existing one
// if the student already registered). Throws on sold-out / server errors.
export const registerForEvent = async (eventId: string): Promise<Ticket> => {
  const config = await authHeader();
  const res = await API.post("/tickets/register", { eventId }, config);
  return res.data.ticket;
};

// All tickets belonging to the logged-in student — used to decide
// whether to show "Register" or "View Ticket" for each event.
export const getMyTickets = async (): Promise<Ticket[]> => {
  const config = await authHeader();
  const res = await API.get("/tickets/my-tickets", config);
  return res.data.tickets || [];
};