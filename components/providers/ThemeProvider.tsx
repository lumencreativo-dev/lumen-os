"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "light",
    toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("light");

    // On mount: read saved preference or system preference
    useEffect(() => {
        const saved = localStorage.getItem("lumen_theme") as Theme | null;
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initial: Theme = saved ?? (prefersDark ? "dark" : "light");
        setTheme(initial);
        document.documentElement.classList.toggle("dark", initial === "dark");
    }, []);

    const toggleTheme = () => {
        setTheme(prev => {
            const next: Theme = prev === "light" ? "dark" : "light";
            localStorage.setItem("lumen_theme", next);
            document.documentElement.classList.toggle("dark", next === "dark");
            return next;
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
