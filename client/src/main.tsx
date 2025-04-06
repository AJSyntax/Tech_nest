import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Removed PortfolioProvider import

createRoot(document.getElementById("root")!).render(
  <App /> // Render App directly
);
