import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: 'class',
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                lumen: {
                    // Brand Colors
                    'priority': '#F7931E',     // [Naranja] Principal: Botones, Acciones, Highlights
                    'primary': '#F7931E',

                    'vision': '#1A237E',       // [Azul Profundo] Texto corporativo, Headers sutiles
                    'soul': '#00838F',         // [Cyan] Detalles

                    // Neutrals (Semantic names for Clean UI)
                    'base': '#FFFFFF',         // Fondo principal
                    'light': '#F9FAFB',        // Fondo secundario (Gray 50)
                    'text': '#111827',         // Texto principal (Gray 900)
                    'muted': '#6B7280',        // Texto secundario (Gray 500)
                    'border': '#E5E7EB',       // Bordes (Gray 200)

                    // Legacy mappings for backward compatibility if needed, or remove if unused
                    'clarity': '#F5F5F5',
                    'structure': '#212121',
                    'creative': '#00838F',
                    'energy': '#F7931E',
                },
            },
            fontFamily: {
                serif: ['var(--font-serif)'],
                sans: ['var(--font-sans)'],
                display: ['var(--font-display)'],
            },
            animation: {
                'fade-in': 'fadeIn 0.6s ease-in-out',
                'slide-up': 'slideUp 0.8s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
export default config
