/** @type {import('tailwindcss').Config} */
const config = {
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "custom-bg": "#171A0F",
      },
      backgroundImage: {
        tile: "url('/images/tile.png')",
      },
    },
  },
}

export default config
