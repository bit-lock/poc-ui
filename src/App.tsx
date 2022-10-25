import React from "react";
import { AppRouter } from "./routes/AppRouter";
import "./App.css";

declare global {
  interface Window {
    ethereum: any;
  }
}

export const App = () => {
  return <AppRouter />;
};
