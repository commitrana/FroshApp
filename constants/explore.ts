import { Ionicons } from "@expo/vector-icons";
import { RootStackParamList } from "../types/navigation";

export type ExploreItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  screen: keyof RootStackParamList;
};

export const EXPLORE_ITEMS: ExploreItem[] = [
  {
    id: "team",
    title: "Our Team",
    subtitle: "Meet the Frosh Team",
    icon: "people-outline",
    screen: "OurTeam",
  },

  {
    id: "hostels",
    title: "Hostels",
    subtitle: "Explore hostel life",
    icon: "bed-outline",
    screen: "Hostels",
  },

  {
    id: "societies",
    title: "Societies",
    subtitle: "Discover student societies",
    icon: "people-circle-outline",
    screen: "Societies",
  },

  {
    id: "life",
    title: "Life at Thapar",
    subtitle: "Campus life & experiences",
    icon: "school-outline",
    screen: "LifeAtThapar",
  },

  {
    id: "map",
    title: "Campus Map",
    subtitle: "Navigate the university",
    icon: "map-outline",
    screen: "CampusMap",
  },
];