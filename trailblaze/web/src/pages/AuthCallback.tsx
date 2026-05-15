// @ts-nocheck
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import * as authStore from "@/store/auth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Signing you in...");

  useEffect(() => {
    const token = searchParams.get("token");
    const needsUsernames = searchParams.get("needs_usernames") === "true";
    const userId = searchParams.get("user_id");
    const verified = searchParams.get("verified") === "true";

    // Coming from email verification link
    if (verified && userId && !token) {
      setMessage("Email verified! Setting up your profile...");
      navigate(`/login?step=set_usernames&user_id=${userId}`);
      return;
    }

    // Coming from Google OAuth
    if (token) {
      localStorage.setItem("token", token);
      if (needsUsernames && userId) {
        setMessage("Almost there! Setting up your profile...");
        // Small delay so token is saved before navigating
        setTimeout(() => {
          navigate(`/login?step=set_usernames&user_id=${userId}`);
        }, 300);
      } else {
        setMessage("Welcome back! Loading...");
        authStore.initAuth().then(() => navigate("/"));
      }
      return;
    }

    // Fallback
    navigate("/login");
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}