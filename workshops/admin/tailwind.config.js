/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cores do painel admin (tema vermelho/escuro)
        admin: {
          bg: '#0A0A0D',
          card: '#12121A',
          border: '#1F1F28',
          hover: '#1A1A24',
          primary: '#FF6B6B',
          secondary: '#EE5A5A',
          text: '#D0D6DE',
          muted: '#8B8B9E',
          dark: '#6B6B7E',
        },
      },
    },
  },
  plugins: [],
};

