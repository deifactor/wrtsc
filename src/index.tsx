import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./components/App";
import { store } from "./store";
import { Provider } from "react-redux";

const root = createRoot(document.getElementById("root")!);
root.render(
  <Provider store={store}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </Provider>
);
