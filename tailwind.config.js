/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#ecfdf5',
                    100: '#d1fae5',
                    200: '#a7f3d0',
                    300: '#6ee7b7',
                    400: '#34d399',
                    500: '#10b981',
                    600: '#059669',
                    700: '#047857',
                    800: '#065f46',
                    900: '#064e3b',
                    950: '#022c22',
                },
                accent: {
                    DEFAULT: '#8b5cf6', // Violet
                    hover: '#7c3aed',
                }
            },
            backgroundImage: {
                'brand-gradient': 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
                'card-gradient': 'linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%)',
            }
        },
    },
    plugins: [],
}
