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
};

// Events now come live from the admin panel via services/events.ts (getEvents()).
// This static list is kept only as a safe fallback if the API call fails.
export const EVENTS: Event[] = [];