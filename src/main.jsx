import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AdminGate from "./AdminGate.jsx";

// Simple path-based router — no library needed
// /admin  → password-protected admin portal
// anything else → the game
const isAdmin = window.location.pathname.startsWith("/admin");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isAdmin ? <AdminGate /> : <App />}
  </React.StrictMode>
);
