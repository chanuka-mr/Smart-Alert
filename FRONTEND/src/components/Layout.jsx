
// Wrapper component that provides consistent layout structure

import React from "react";
import Navbar from "./Navbar";

const Layout = ({ children }) => {
  return (
    <>
      
      <Navbar />
      <div className="container">
        {children}
      </div>
    </>
  );
};

export default Layout;
