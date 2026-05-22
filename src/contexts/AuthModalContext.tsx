import { createContext, useContext, useState, ReactNode } from "react";
import AuthModal from "@/components/AuthModal";

interface AuthModalContextType {
  openLogin: () => void;
  openRegister: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; view: "login" | "register" }>({ open: false, view: "login" });

  const openLogin = () => setState({ open: true, view: "login" });
  const openRegister = () => setState({ open: true, view: "register" });

  return (
    <AuthModalContext.Provider value={{ openLogin, openRegister }}>
      {children}
      <AuthModal
        open={state.open}
        onOpenChange={(open) => setState((prev) => ({ ...prev, open }))}
        defaultView={state.view}
      />
    </AuthModalContext.Provider>
  );
}
