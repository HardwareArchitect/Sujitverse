import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import FilesPage from "./pages/FilesPage";
import AdminInvitesPage from "./pages/AdminInvitesPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/" element={<ProtectedRoute><FilesPage /></ProtectedRoute>} />
        <Route path="/files/*" element={<ProtectedRoute><FilesPage /></ProtectedRoute>} />
        <Route path="/admin/invites" element={<ProtectedRoute><AdminInvitesPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
