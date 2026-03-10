import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthProvider";
import { BusinessProvider } from "./context/BusinessProvider";
import "./styles/globals.css";

export default function App() {
  return (
    <AuthProvider>
      <BusinessProvider>
        <RouterProvider router={router} />
      </BusinessProvider>
    </AuthProvider>
  );
}