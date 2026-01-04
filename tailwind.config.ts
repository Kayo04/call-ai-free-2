import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // 👈 TENS MESMO DE TER ISTO AQUI
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;