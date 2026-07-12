import { Ionicons } from "@expo/vector-icons";

type SocialLink = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  url: string;
};


export const APP_INFO = {
  name: "Frosh",
  version: "1.0.0",

  support: {
    email: "support@frosh.app",
    phone: "+91 9876543210",
    workingHours: "Mon - Fri | 9:00 AM - 6:00 PM",
  },

  about:
    "Frosh is a platform that helps students discover societies, register for events, and stay connected with campus activities.",
};

export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: "instagram",
    title: "Instagram",
    icon: "logo-instagram",
    url: "https://www.instagram.com/froshtiet",
  },
  {
    id: "linkedin",
    title: "LinkedIn",
    icon: "logo-linkedin",
    url: "https://www.linkedin.com/company/frosh-tiet/posts/?feedView=all",
  },
  {
    id: "website",
    title: "Website",
    icon: "globe-outline",
    url: "https://www.froshtiet.in/",
  },
  {
    id: "youtube",
    title: "YouTube",
    icon: "logo-youtube",
    url: "https://www.youtube.com/@FroshTIET",
  },
  {
    id: "facebook",
    title: "Facebook",
    icon: "logo-facebook",
    url: "https://www.facebook.com/people/Frosh-Tiet/61589742507060/",
  },
  {
    id: "github",
    title: "GitHub",
    icon: "logo-github",
    url: "https://github.com/Frosh-TIET",
  },
  
];
