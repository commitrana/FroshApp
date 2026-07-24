export type EventStatus =
  | "live"
  | "upcoming"
  | "past";

// A sub-session of a slotted event (see Event.slotCount below). Each slot
// has its own time/venue/status, set independently by the admin.
export type EventSlot = {
  number: number; // 1-5
  time: string;
  venue: string;
  status: EventStatus;
};

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
  // Slots (optional sub-sessions within one event).
  // 0 = no slots, the event behaves exactly as before (single date/time/venue/status).
  // 1-5 = the app should show a slot picker instead, each slot with its own
  // time/venue/status. Ticket capacity/count stay shared at the event level.
  slotCount?: number;
  slots?: EventSlot[];
};

// Events now come live from the admin panel via services/events.ts (getEvents()).
// This static list is kept only as a safe fallback if the API call fails.
export const EVENTS: Event[] = [];