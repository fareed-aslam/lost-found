"use client";
import { SessionProvider } from "next-auth/react";
import React from "react";
import { UserProvider } from "@/context/UserContext";

function ClientProvider({ children }) {
  return (
    <div>
      <SessionProvider>
        <UserProvider>{children}</UserProvider>
      </SessionProvider>
    </div>
  );
}

export default ClientProvider;
