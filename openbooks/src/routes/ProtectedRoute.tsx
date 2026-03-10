import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import type { JSX } from "react/jsx-dev-runtime";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="page">Loading…</div>;
  if (!session) return <Navigate to="/signin" replace />;
  return children;
}