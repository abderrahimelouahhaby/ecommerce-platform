import axios from "axios";
import { env } from "./env";

// One Axios instance for the whole app.
export const api = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
  timeout: 15000,
});

// Reads the message from our API error shape: { error: { message } }.
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message;

    if (typeof message === "string") {
      return message;
    }

    if (error.code === "ECONNABORTED" || !error.response) {
      return "Cannot reach the server. Please try again.";
    }
  }

  return "Something went wrong. Please try again.";
}

// True when the server answered 404 (the thing does not exist).
export function isNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}
