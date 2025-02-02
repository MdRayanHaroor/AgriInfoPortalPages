// src/context/AuthContext.tsx
import { createContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/router";
import { auth } from "../lib/firebase";
import { User as FirebaseUser } from "firebase/auth";

interface User {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  type: string;
  emailVerified: boolean;
  mobileVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  authError: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  // Handle auth state changes for Firebase
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser && localStorage.getItem("authToken")) {
        await fetchUserData();
      }
    });
  
    return () => unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  

  // Fetch user data from backend
  const fetchUserData = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/user", {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const { user: userData } = await response.json();
      setUser(userData);
      setAuthError(null);
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthError("Session expired. Please log in again.");
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    const initializeAuth = async () => {
      await fetchUserData();
    };
    initializeAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps  

  // Login function
  const login = async (token: string) => {
    localStorage.setItem("authToken", token);
    await fetchUserData();
    router.push("/");
  };

  // Logout function
  const logout = async () => {
    try {
      localStorage.removeItem("authToken");
      await auth.signOut();
      setUser(null);
      setFirebaseUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setAuthError("Failed to logout. Please try again.");
    }
  };

  const contextValue = {
    user,
    firebaseUser,
    login,
    logout,
    isLoading,
    authError
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
