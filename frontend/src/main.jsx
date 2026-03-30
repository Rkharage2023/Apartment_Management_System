import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import { store } from "./store/index";
import AppRouter from "./router/AppRouter";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <AppRouter />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { fontSize: "13px" },
        }}
      />
    </Provider>
  </React.StrictMode>,
);
