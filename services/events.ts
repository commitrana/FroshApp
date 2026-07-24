import API from "./api";
import { Event, EventStatus, EventSlot } from "../constants/events";
// Re-exported so other files can do `import { Event } from "../../services/events"`
// (several components already rely on this instead of importing from constants/events directly).
export type { Event, EventStatus, EventSlot };

// Shape of a slot as returned by the backend
type BackendSlot = {
  number: number;
  time?: string;
  venue?: string;
  status: EventStatus;
};

// Shape returned by the backend (Society admin panel manages these)
type BackendEvent = {
  _id: string;
  name: string;
  club?: string;
  date: string;
  time: string;
  venue: string;
  status: EventStatus;
  imageUrl?: string | null;
  slotCount?: number;
  slots?: BackendSlot[];
};

const mapEvent = (e: BackendEvent): Event => ({
  id: e._id,
  title: e.name,
  society: e.club || "",
  venue: e.venue,
  date: e.date,
  time: e.time,
  status: e.status,
  imageUrl: e.imageUrl || null,
  slotCount: e.slotCount || 0,
  slots: (e.slots || []).map(
    (s): EventSlot => ({
      number: s.number,
      time: s.time || "",
      venue: s.venue || "",
      status: s.status,
    })
  ),
});

// Public endpoint used by the app — optionally filter by status (live | upcoming | past)
export const getEvents = async (status?: EventStatus): Promise<Event[]> => {
  const res = await API.get("/events", {
    params: status ? { status } : {},
  });
  const events: BackendEvent[] = res.data?.events || [];
  return events.map(mapEvent);
};