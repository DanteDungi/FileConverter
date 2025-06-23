import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Pager from "./pages/Pager.jsx";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Pager />} />
      </Routes>
    </Router>
  );
}


