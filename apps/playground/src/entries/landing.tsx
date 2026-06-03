import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

import { LandingPage } from "../landing/LandingPage";
import "../landing/index.css";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Missing #root element");
}

const root = createRoot(rootElement);

flushSync(() => {
  root.render(<LandingPage />);
});
