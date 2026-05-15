import { useEffect, useState } from "react";
import * as auth from "@/store/auth";

export function useAuth() {
  const [state, setState] = useState(auth.getState());

  useEffect(() => {
    const unsub = auth.subscribe(() => setState(auth.getState()));
    return () => { unsub(); };
  }, []);

  return {
    ...state,
    login: auth.login,
    logout: auth.logout,
  };
}
