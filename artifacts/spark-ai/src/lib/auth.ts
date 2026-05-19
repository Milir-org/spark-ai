import { useState, useEffect } from "react";
import { User } from "@workspace/api-client-react";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("spark_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (u: User) => {
    localStorage.setItem("spark_user", JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem("spark_user");
    setUser(null);
  };

  return { user, login, logout, loading };
}
