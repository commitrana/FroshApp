import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "./api";

const authHeader = async () => {
  const token = await AsyncStorage.getItem("societyToken");
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const getSocietyMembers = async () => {
  const config = await authHeader();
  const res = await API.get("/member/society-members", config);
  return res.data; // { count, members }
};

export const createMember = async (member: {
  name: string; branch: string; rollNo: string; email: string; password: string;
}, slotNumber: 1 | 2) => {
  const config = await authHeader();
  const res = await API.post("/member/create", { members: [member], slotNumber }, config);
  return res.data;
};

export const updateMember = async (memberId: string, data: {
  name: string; branch: string; rollNo: string; email: string; password?: string;
}) => {
  const config = await authHeader();
  const res = await API.put(`/member/update/${memberId}`, data, config);
  return res.data;
};

export const deleteMember = async (memberId: string) => {
  const config = await authHeader();
  const res = await API.delete(`/member/delete/${memberId}`, config);
  return res.data;
};