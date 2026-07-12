import API from "./api";
import { Event, EventStatus } from "../constants/events";

// Shape returned by the backend (Society admin panel manages these)
type BackendEvent = {
  _id: string;
  name: string;
  club?: string;
  date: string;
  time: string;
  venue: string;
  status: EventStatus;
};

const mapEvent = (e: BackendEvent): Event => ({
  id: e._id,
  title: e.name,
  society: e.club || "",
  venue: e.venue,
  date: e.date,
  time: e.time,
  status: e.status,
});

// Public endpoint used by the app — optionally filter by status (live | upcoming | past)
export const getEvents = async (status?: EventStatus): Promise<Event[]> => {
  const res = await API.get("/events", {
    params: status ? { status } : {},
  });
  const events: BackendEvent[] = res.data?.events || [];
  return events.map(mapEvent);
};