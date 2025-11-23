"use client";
import { useEffect, useState } from "react";
import Navbar from "../componets/Navbar";
import Footer from "../componets/Footer";
import Loading from "./loading.jsx";
import { Toaster } from "sonner";
import NotificationsPoller from "../componets/NotificationsPoller";

export default function ClientLayout({ children }) {
  const [showLoader, setShowLoader] = useState(true);

  // const data = db.execute("select * from lostfound");
  // console.log(data);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoader(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {showLoader ? (
        <Loading />
      ) : (
        <>
          <header>
            <Navbar />
          </header>
          <Toaster richColors position="top-center" />
          <NotificationsPoller />
          <main className="min-h-screen">{children}</main>
          <footer>
            <Footer />
          </footer>
        </>
      )}
    </>
  );
}
