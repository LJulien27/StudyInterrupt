import React, { createContext, useState, useEffect, ReactNode, useContext } from "react";

interface AuthContextType {
  user: any; // You can type this with your User type
  setUser: (user: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Load user from localStorage on app start
    const loadUser = () => {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error("Error parsing user from localStorage:", e);
        }
      }
    };

    loadUser();

    // Listen for storage changes (when OAuth updates localStorage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user") {
        if (e.newValue) {
          try {
            setUser(JSON.parse(e.newValue));
          } catch (e) {
            console.error("Error parsing user from storage event:", e);
          }
        } else {
          setUser(null);
        }
      }
    };

    // Listen for custom event (for same-tab updates)
    const handleCustomStorageChange = () => {
      loadUser();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("userUpdated", handleCustomStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("userUpdated", handleCustomStorageChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for convenience
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
