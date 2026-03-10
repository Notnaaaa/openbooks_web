
// src/routes/index.tsx
import React from "react";
import { createBrowserRouter, Link, useRouteError } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

import Landing from "../pages/public/Landing";
import SignIn from "../pages/auth/SignIn";
import SignUp from "../pages/auth/SignUp";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import MagicLink from "../pages/auth/MagicLink";
import AuthCallback from "../pages/auth/AuthCallback";
import GmailApproval from "../pages/auth/GmailApproval";
import BusinessSetup from "../pages/onboarding/BusinessSetup";
import ProfileSetup from "../pages/onboarding/ProfileSetup";
import AppShell from "../components/layout/AppShell";
import Dashboard from "../pages/app/Dashboard";
import Transactions from "../pages/app/Transaction";
import Reports from "../pages/app/Reports";
import Notifications from "../pages/app/Notifications";
import Profile from "../pages/app/Profile";
import Settings from "../pages/app/Settings";
import Admin from "../pages/app/Admin";

function ErrorPage() {
  const err = useRouteError() as any;
  console.error("[ROUTER ERROR]", err);

  return (
    <div className="page">
      <h1 className="h1">Router crashed</h1>
      <pre className="pre">{String(err?.message || err)}</pre>
      <Link className="link" to="/">Go Home</Link>
    </div>
  );
}

export const router = createBrowserRouter([
  { path: "/", element: <Landing />, errorElement: <ErrorPage /> },

  { path: "/signin", element: <SignIn />, errorElement: <ErrorPage /> },
  { path: "/signup", element: <SignUp />, errorElement: <ErrorPage /> },
  { path: "/forgot-password", element: <ForgotPassword />, errorElement: <ErrorPage /> },
  { path: "/reset-password", element: <ResetPassword />, errorElement: <ErrorPage /> },

  { path: "/approval", element: <GmailApproval />, errorElement: <ErrorPage /> },
  {path: "/onboarding/profile-setup", element: <ProfileSetup />, errorElement: <ErrorPage /> },

  { path: "/magiclink", element: <MagicLink />, errorElement: <ErrorPage /> },
  { path: "/auth/callback", element: <AuthCallback />, errorElement: <ErrorPage /> },

  {
    path: "/onboarding/business-setup",
    element: (
      <ProtectedRoute>
        <BusinessSetup />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },

  {
    path: "/app",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "transactions", element: <Transactions /> },
      { path: "reports", element: <Reports /> },
      { path: "notifications", element: <Notifications /> },
      { path: "profile", element: <Profile /> },
      { path: "settings", element: <Settings /> },
      // inside children of "/app"
{ path: "admin", element: <Admin /> } // ✅ NOT "/admin"
    ],
  },
]);