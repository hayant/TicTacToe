import React from "react";
import { createRoot } from "react-dom/client";
import LoginForm from "./LoginForm";

const container = document.getElementById("root");

if (container) {
  const root = createRoot(container);
  root.render(<LoginForm />);
}
