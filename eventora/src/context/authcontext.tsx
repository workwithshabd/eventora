import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../utils/axios";

type User = {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type AuthContextType = {
  user: User | null;
  loggedIn: boolean;
  loading: boolean;
  logIn: (user: User) => void;
  logOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  const loggedIn = user !== null;

  // ==========================================
  // LOGIN
  // ==========================================

  function logIn(user: User) {
    console.log("AUTH LOGIN:", user);

    setUser(user);
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  async function logOut() {
    try {
      await api.post("/logout");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
    }
  }

  // ==========================================
  // RESTORE USER AFTER REFRESH
  // ==========================================

  useEffect(() => {
    async function checkCurrentUser() {
      try {
        console.log("AUTH: Checking /me...");

        // Backend:
        // GET /api/me

        const response = await api.get("/me");

        console.log("AUTH: /me response:", response.data);

        if (
          response.data?.success &&
          response.data?.user
        ) {
          console.log(
            "AUTH: User restored:",
            response.data.user
          );

          setUser(response.data.user);
        } else {
          console.log("AUTH: No user returned");

          setUser(null);
        }
      } catch (error: any) {
        console.error(
          "AUTH: /me failed:",
          error.response?.data || error.message
        );

        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkCurrentUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loggedIn,
        loading,
        logIn,
        logOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}