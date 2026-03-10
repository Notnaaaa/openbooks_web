// src/pages/ErrorPage.tsx
import { useRouteError, Link } from "react-router-dom";

export default function ErrorPage() {
  const err: any = useRouteError();
  return (
    <div style={{ padding: 40 }}>
      <h2 style={{ fontSize: 40, fontWeight: 900 }}>Route Error</h2>
      <p style={{ fontSize: 24, lineHeight: 1.8, color: "#475569" }}>
        {err?.message || "Something went wrong while loading this route."}
      </p>
      <Link to="/" style={{ fontSize: 24, fontWeight: 900 }}>
        Go to Landing
      </Link>
    </div>
  );
}