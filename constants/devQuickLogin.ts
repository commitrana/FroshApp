// DEV-ONLY quick-login credentials for switching between demo accounts fast.
// This file is only ever imported behind `if (__DEV__)` checks in LoginScreen,
// so it never renders/executes in a production (release) build.
// Do NOT import this file anywhere outside LoginScreen, and do NOT commit
// real user passwords here long-term — swap these out before a public repo push.

export type DevRole = "student" | "faculty" | "society" | "member";

export const DEV_QUICK_LOGIN: { role: DevRole; label: string; email: string; password: string }[] = [
  {
    role: "student",
    label: "Student",
    email: "harshitarana1206@gmail.com",
    password: "CPNR12032006%",
  },
  {
    role: "faculty",
    label: "Faculty",
    email: "rana@gmail.com",
    password: "ranarana",
  },
  {
    role: "society",
    label: "Society",
    email: "froshtiet@thapar.edu",
    password: "frosh@123",
  },
  {
    role: "member",
    label: "Society Member",
    email: "karanbirsingh2110@gmail.com",
    password: "karan@123",
  },
];