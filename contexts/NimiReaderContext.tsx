"use client";

import React, { createContext, useContext, useState } from "react";

interface NimiReaderContextType {
  isReaderActive: boolean;
  toggleReader: () => void;
}

const NimiReaderContext = createContext<NimiReaderContextType | undefined>(undefined);

export function NimiReaderProvider({ children }: { children: React.ReactNode }) {
  const [isReaderActive, setIsReaderActive] = useState(false);

  const toggleReader = () => setIsReaderActive((prev) => !prev);

  return (
    <NimiReaderContext.Provider value={{ isReaderActive, toggleReader }}>
      {children}
    </NimiReaderContext.Provider>
  );
}

export function useNimiReader() {
  const context = useContext(NimiReaderContext);
  if (!context) {
    throw new Error("useNimiReader must be used within a NimiReaderProvider");
  }
  return context;
}
