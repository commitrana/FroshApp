export type EventStatus =
  | "live"
  | "upcoming"
  | "past";

export type Event = {
  id: string;
  title: string;
  society: string;
  venue: string;
  date: string;
  time: string;
  status: EventStatus;
  // Relative path to the event's uploaded cover photo (e.g.
  // "/uploads/events/xyz.jpg"), set by the admin panel. null/undefined
  // means no photo has been uploaded yet — show a fallback image instead.
  imageUrl?: string | null;
};

// Events now come live from the admin panel via services/events.ts (getEvents()).
// This static list is kept only as a safe fallback if the API call fails.
export const EVENTS: Event[] = [];