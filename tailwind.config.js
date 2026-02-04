/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#3b82f6", // Blue
                secondary: "#1d4ed8", // Deeper Blue
                accent: "#0ea5e9", // Sky Blue
                dark: "#0a0a0a", // Near Black
                surface: "#171717", // Dark Gray surface
                border: "#262626", // Dark border
            },
            animation: {
                'fade-in': 'fadeIn 300ms ease-in-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
