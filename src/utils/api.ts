import { projectId, publicAnonKey } from "./info";

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7b8ddc1c`;

export const api = {
  async getInventory() {
    const response = await fetch(`${SERVER_URL}/inventory`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${publicAnonKey}`,
      },
    });
    return response.json();
  },

  async saveInventory(products: unknown[]) {
    const response = await fetch(`${SERVER_URL}/inventory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ products }),
    });
    return response.json();
  },

  async getUsers() {
    const response = await fetch(`${SERVER_URL}/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${publicAnonKey}`,
      },
    });
    return response.json();
  },

  async saveUsers(users: unknown[]) {
    const response = await fetch(`${SERVER_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ users }),
    });
    return response.json();
  },

  async getSales() {
    const response = await fetch(`${SERVER_URL}/sales`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${publicAnonKey}`,
      },
    });
    return response.json();
  },

  async saveSales(sales: unknown[]) {
    const response = await fetch(`${SERVER_URL}/sales`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ sales }),
    });
    return response.json();
  },

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
