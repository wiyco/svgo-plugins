import { createRoot } from "react-dom/client";

import { LandingPage } from "../landing/LandingPage";
import { schedulePlaygroundWarmup } from "../playgrounds/preload-registry";
import { installViewTransitionErrorFilter } from "../view-transition-runtime";
import "../landing/index.css";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Missing #root element");
}

installViewTransitionErrorFilter();
createRoot(rootElement).render(<LandingPage />);
schedulePlaygroundWarmup();
