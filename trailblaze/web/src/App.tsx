import PlaceDetail from "@/pages/PlaceDetail";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import Home from "@/pages/Home";
import AddPlace from "@/pages/AddPlace";
import Profile from "@/pages/Profile";
import Auth from "@/pages/Auth";
import Rankings from "@/pages/Rankings";
import { initAuth } from "@/store/auth";

export default function App() {
  useEffect(() => { initAuth(); }, []);

  return (
    <BrowserRouter>
      <div className="mx-auto min-h-screen w-full max-w-[480px] bg-background pb-24 shadow-xl">
        <Routes>
          <Route path="/place/:id" element={<PlaceDetail />} />
          <Route path="/" element={<Home />} />
          <Route path="/add" element={<AddPlace />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/rankings" element={<Rankings />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
