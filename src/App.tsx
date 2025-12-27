import { Navigate, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import DemoPage from "./pages/DemoPage";
import AboutPage from "./pages/AboutPage";

export default function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-[1400px] px-4 py-4">
        <Routes>
          <Route path="/" element={<DemoPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="mx-auto max-w-[1400px] px-4 py-10 text-sm text-slate-400">
        <div className="border-t border-slate-800 pt-4">
          Track My Container — (Static Simulation). No real RTSP feeds, devices, or backend services are used.
        </div>
      </footer>
    </div>
  );
}
