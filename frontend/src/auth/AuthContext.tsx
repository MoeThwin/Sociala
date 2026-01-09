import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../lib/authApi";

type AuthState = {
  user: authApi.SafeUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = "sociala_access_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<authApi.SafeUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem(TOKEN_KEY)
  );
  const [loading, setLoading] = useState(true);

  // On app load: try /auth/refresh using cookie, then /auth/me
  useEffect(() => {
    (async () => {
      try {
        const r = await authApi.refresh(); // uses httpOnly cookie
        setAccessToken(r.accessToken);
        localStorage.setItem(TOKEN_KEY, r.accessToken);

        const m = await authApi.me(r.accessToken);
        setUser(m.user);
      } catch {
        // not logged in / no cookie yet
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function doLogin(email: string, password: string) {
    const r = await authApi.login({ email, password });
    setAccessToken(r.accessToken);
    localStorage.setItem(TOKEN_KEY, r.accessToken);
    setUser(r.user);
  }

  async function doRegister(email: string, username: string, password: string) {
    const r = await authApi.register({ email, username, password });
    setAccessToken(r.accessToken);
    localStorage.setItem(TOKEN_KEY, r.accessToken);
    setUser(r.user);
  }

  async function doLogout() {
    await authApi.logout();
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem(TOKEN_KEY);
  }

  const value = useMemo(
    () => ({
      user,
      accessToken,
      loading,
      login: doLogin,
      register: doRegister,
      logout: doLogout,
    }),
    [user, accessToken, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}