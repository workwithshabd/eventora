import api from "../utils/axios";

export async function signupUser(
  name: string,
  email: string,
  password: string
) {
  const response = await api.post("/signup", {
    name,
    email,
    password,
  });

  return response.data;
}

export async function loginUser(
  email: string,
  password: string
) {
  const response = await api.post("/login", {
    email,
    password,
  });

  return response.data;
}

export async function verifyOtp(
  email: string,
  otp: string
) {
  const response = await api.post("/verify-otp", {
    email,
    otp,
  });

  return response.data;
}

export async function logoutUser() {
  const response = await api.post("/logout");

  return response.data;
}

export async function getCurrentUser() {
  const response = await api.put("/me");

  return response.data;
}