import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppShell() {
  return (
    <div className="shell">
      <Sidebar />
      <div className="shellMain">
        <Header />
        <main className="shellContent">
          <Outlet />
        </main>
      </div>
    </div>
  );
}