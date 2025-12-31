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
                    50: '#ecfeff',
                    100: '#cffafe',
                    200: '#a5f3fc',
                    300: '#67e8f9',
                    400: '#22d3ee',
                    500: '#06b6d4',
                    600: '#0891b2',
                    700: '#0e7490',
                    800: '#155e75',
                    900: '#164e63',
                    950: '#083344',
                },
                accent: {
                    DEFAULT: '#8b5cf6', // Violet
                    hover: '#7c3aed',
                }
            },
            backgroundImage: {
                'brand-gradient': 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                'card-gradient': 'linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%)',
            }
        },
    },
    plugins: [],
}
