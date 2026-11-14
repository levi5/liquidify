import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "#web/App.tsx";
import { LocaleProvider } from "#web/i18n.tsx";
import "./global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </StrictMode>,
);
