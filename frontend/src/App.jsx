import { useState } from "react";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import InventoryPage from "./pages/InventoryPage";

export default function App() {
  const [currentPage, setCurrentPage] = useState("auth");
  const [company, setCompany] = useState(null);

  if (currentPage === "inventory") {
    return (
      <InventoryPage
        company={company}
        onLogout={() => {
          setCompany(null);
          setCurrentPage("auth");
        }}
        onBackHome={() => setCurrentPage("home")}
      />
    );
  }

  if (currentPage === "home") {
    return (
      <HomePage
        company={company}
        onLogout={() => {
          setCompany(null);
          setCurrentPage("auth");
        }}
        onOpenInventory={() => setCurrentPage("inventory")}
      />
    );
  }

  return (
    <AuthPage
      onLoginSuccess={(data) => {
        setCompany(data);
        setCurrentPage("home");
      }}
    />
  );
}
