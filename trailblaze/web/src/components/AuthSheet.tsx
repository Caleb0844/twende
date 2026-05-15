// @ts-nocheck
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

type Props = {
  message?: string;
  onClose: () => void;
};

export default function AuthSheet({ message = "Sign in to continue", onClose }: Props) {
  const navigate = useNavigate();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 rounded-t-3xl bg-background p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold">Join Twende 🗺️</h3>
          <button onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-5 text-sm text-muted-foreground">{message}</p>

        <div className="space-y-3">
          <button
            onClick={() => { onClose(); navigate("/login"); }}
            className="w-full rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition active:scale-[0.99]">
            Sign In
          </button>
          <button
            onClick={() => { onClose(); navigate("/login?mode=register"); }}
            className="w-full rounded-full border-2 border-primary py-4 text-sm font-bold text-primary transition active:scale-[0.99]">
            Create Account
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          You can still browse places without an account
        </p>
      </div>
    </>
  );
}