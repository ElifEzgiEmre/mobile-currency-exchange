import React, { createContext, useCallback, useContext, useState } from 'react';

export type User = { userId: number; name?: string; email: string };

const AuthContext = createContext<{
  user: User | null;
  setUser: (u: User | null) => void;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  return (
    <AuthContext.Provider value={{ user, setUser }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
