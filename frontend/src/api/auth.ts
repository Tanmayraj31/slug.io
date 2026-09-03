import type { AuthSuccessDto, AuthUserDto, LoginInput, RegisterInput } from "@/types/api";
import { apiGet, apiPost, clearAccessToken, setAccessToken } from "./client";

export async function register(input: RegisterInput): Promise<AuthUserDto> {
  const { user } = await apiPost<{ user: AuthUserDto }>("/api/v1/auth/register", input);
  return user;
}

export async function login(input: LoginInput): Promise<AuthSuccessDto> {
  const result = await apiPost<AuthSuccessDto>("/api/v1/auth/login", input);
  setAccessToken(result.accessToken);
  return result;
}

export async function refresh(): Promise<AuthSuccessDto> {
  const result = await apiPost<AuthSuccessDto>("/api/v1/auth/refresh");
  setAccessToken(result.accessToken);
  return result;
}

export async function logout(): Promise<void> {
  try {
    await apiPost<void>("/api/v1/auth/logout");
  } finally {
    clearAccessToken();
  }
}

export async function me(): Promise<AuthUserDto> {
  const { user } = await apiGet<{ user: AuthUserDto }>("/api/v1/auth/me");
  return user;
}
