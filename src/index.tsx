import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./components/App";
import { store } from "./store";
import { Provider } from "react-redux";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

const root = createRoot(document.getElementById("root")!);
root.render(
  <Provider store={store}>
    <React.StrictMode>
      <DndProvider backend={HTML5Backend}>
        <App />
      </DndProvider>
    </React.StrictMode>
  </Provider>
);
