/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            },
            colors: {
                brand: {
                    50: '#f0fdf9', // Lighter, cooler
                    100: '#ccfbf1',
                    200: '#99f6e4',
                    300: '#5eead4',
                    400: '#2dd4bf',
                    500: '#14b8a6', // Teal-500 (More modern than Emerald)
                    600: '#0d9488',
                    700: '#0f766e',
                    800: '#115e59',
                    900: '#134e4a',
                    950: '#042f2e',
                },
                accent: {
                    DEFAULT: '#6366f1', // Indigo-500
                    hover: '#4f46e5',   // Indigo-600
                    light: '#e0e7ff',   // Indigo-100
                },
                slate: {
                    850: '#1e293b', // Custom dark slate
                }
            },
            backgroundImage: {
                'brand-gradient': 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
                'accent-gradient': 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                'glass-gradient': 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                'mesh-pattern': 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(20, 184, 166, 0.15) 0px, transparent 50%)',
            },
            boxShadow: {
                'pro': '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
                'pro-md': '0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
                'pro-lg': '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
                'glow': '0 0 15px rgba(99, 102, 241, 0.3)',
            }
        },
    },
    plugins: [],
}
