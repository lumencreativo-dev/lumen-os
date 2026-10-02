"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface BrandContextType {
    brandColor: string;
    logoUrl: string | null;
    clientName: string;
    setBranding: (color: string, logo: string | null, name: string) => void;
}

const BrandContext = createContext<BrandContextType>({
    brandColor: "#F7931E",
    logoUrl: null,
    clientName: "",
    setBranding: () => {},
});

export function BrandProvider({ children }: { children: ReactNode }) {
    const [brandColor, setBrandColor] = useState("#F7931E");
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [clientName, setClientName] = useState("");

    const setBranding = (color: string, logo: string | null, name: string) => {
        setBrandColor(color);
        setLogoUrl(logo);
        setClientName(name);
    };

    return (
        <BrandContext.Provider value={{ brandColor, logoUrl, clientName, setBranding }}>
            {children}
        </BrandContext.Provider>
    );
}

export const useBrand = () => useContext(BrandContext);
