import React from "react";
import { createRoot } from "react-dom/client"; // Import createRoot
import App from "./App";
import AdSense from 'react-adsense';

// Replace ReactDOM.render with createRoot
const root = createRoot(document.getElementById("root"));
root.render(<App />);
