import { createRoot } from "react-dom/client";

import App from "../playgrounds/svgo-plugin-hoist-stroke-width/App";
import { installViewTransitionErrorFilter } from "../view-transition-runtime";
import "../index.css";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Missing #root element");
}

installViewTransitionErrorFilter();
createRoot(rootElement).render(<App />);
