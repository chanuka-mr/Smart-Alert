import React from "react";
import Navbar from "./Navbar";

const Layout = ({ children }) => {
  React.useEffect(() => {
    const prevBg = document.body.style.background;
    const prevBgImage = document.body.style.backgroundImage;
    document.body.style.background = "#ffffff";
    document.body.style.backgroundImage = "none";
    return () => {
      document.body.style.background = prevBg;
      document.body.style.backgroundImage = prevBgImage;
    };
  }, []);

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
