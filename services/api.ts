import axios from "axios";

const API = axios.create({
  baseURL: "https://frosh-app-backend.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;