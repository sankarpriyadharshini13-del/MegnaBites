/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FBF7EF",
        sand: "#F0E8D6",
        leaf: "#2F5A3C",
        leafDark: "#22372A",
        forest: "#1B3D2A",
        "forest-deep": "#12291C",
        "forest-card": "#1F4A31",
        clay: "#E8672A",
        honey: "#D9A441",
        husk: "#D8CBA8",
        ink: "#1B1A15",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(20, 42, 30, 0.18)",
        lift: "0 24px 50px -20px rgba(20, 42, 30, 0.35)",
        glow: "0 0 0 1px rgba(217, 164, 65, 0.25), 0 18px 40px -18px rgba(196, 101, 47, 0.55)",
      },
      keyframes: {
        slideIn: { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } },
        fadeUp: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "slide-in": "slideIn 0.35s cubic-bezier(0.22,1,0.36,1)",
        "fade-up": "fadeUp 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        marquee: "marquee 30s linear infinite",
        float: "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 1.5s infinite",
      },
    },
  },
  plugins: [],
};
