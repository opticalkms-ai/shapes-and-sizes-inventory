import { projectId, publicAnonKey } from "../../../utils/supabase/info";

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7b8ddc1c`;

export const api = {
  async sendOtp(email: string, firstName: string) {
    const response = await fetch(`${SERVER_URL}/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ email, firstName }),
    });
    return response.json();
  },

  async verifyOtp(email: string, otp: string) {
    const response = await fetch(`${SERVER_URL}/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ email, otp }),
    });
    return response.json();
  },

  async sendResetOtp(email: string) {
    const response = await fetch(`${SERVER_URL}/send-reset-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ email }),
    });
    return response.json();
  },

  async verifyResetOtp(email: string, otp: string) {
    const response = await fetch(`${SERVER_URL}/verify-reset-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ email, otp }),
    });
    return response.json();
  },
};