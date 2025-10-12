import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";
import { initWebVitals } from "./lib/reportWebVitals";

// Initialize error tracking
initSentry();

// Initialize Web Vitals monitoring
initWebVitals();

createRoot(document.getElementById("root")!).render(<App />);
