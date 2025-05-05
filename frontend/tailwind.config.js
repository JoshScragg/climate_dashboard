/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            50: '#e6f6fa',
            100: '#ccecf5',
            200: '#99d9eb',
            300: '#66c6e0',
            400: '#33b4d6',
            500: '#00a1cc',
            600: '#0081a3',
            700: '#00617a',
            800: '#004052',
            900: '#002029',
          },
          secondary: {
            50: '#f2f9e8',
            100: '#e5f2d1',
            200: '#cbe6a3',
            300: '#b1d976',
            400: '#97cd48',
            500: '#7dc21a',
            600: '#649b15',
            700: '#4b7410',
            800: '#324d0a',
            900: '#192705',
          },
          danger: '#e74c3c',
          warning: '#f39c12',
          success: '#2ecc71',
        },
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
        },
      },
    },
    plugins: [],
  }