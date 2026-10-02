import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { PortalHeader } from "@/components/portal/PortalHeader";
import { BrandProvider } from "@/contexts/BrandContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Lumen OS | Portal Cliente",
    description: "Tu espacio de trabajo con Lumen Creativo",
};

export default function PortalLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <BrandProvider>
            <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-white ${inter.className} flex flex-col`}>
                {/* Premium Header (Client Component) */}
                <PortalHeader />

                {/* Main Content Area */}
                <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
                    {children}
                </main>

                {/* Footer */}
                <footer className="py-6 border-t border-gray-100 bg-white">
                    <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-gray-400">© 2026 Lumen Creativo. Todos los derechos reservados.</p>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                            <a href="#" className="hover:text-gray-600 transition-colors">Ayuda</a>
                            <a href="#" className="hover:text-gray-600 transition-colors">Privacidad</a>
                            <a href="#" className="hover:text-gray-600 transition-colors">Términos</a>
                        </div>
                    </div>
                </footer>
            </div>
        </BrandProvider>
    );
}
