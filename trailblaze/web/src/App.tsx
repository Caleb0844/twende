import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { initAuth } from "@/store/auth";

const Home = lazy(() => import("@/pages/Home"));
const AddPlace = lazy(() => import("@/pages/AddPlace"));
const EditPlace = lazy(() => import("@/pages/EditPlace"));
const Profile = lazy(() => import("@/pages/Profile"));
const Auth = lazy(() => import("@/pages/Auth"));
const AuthCallback = lazy(() => import("@/pages/AuthCallback"));
const Rankings = lazy(() => import("@/pages/Rankings"));
const PlaceDetail = lazy(() => import("@/pages/PlaceDetail"));
const MyPlaces = lazy(() => import("@/pages/MyPlaces"));

const Spinner = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

export default function App() {
  useEffect(() => { initAuth(); }, []);

  return (
    <BrowserRouter>
      <div className="mx-auto min-h-screen w-full max-w-[480px] bg-background pb-24 shadow-xl">
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<AddPlace />} />
            <Route path="/edit/:id" element={<EditPlace />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-places" element={<MyPlaces />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/place/:id" element={<PlaceDetail />} />
          </Routes>
        </Suspense>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}