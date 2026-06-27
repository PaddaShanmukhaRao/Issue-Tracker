/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Custom colour tokens for the Issue Tracker brand
      colors: {
        // Dark surface palette — gives the app a professional IDE feel
        surface: {
          900: "#0d1117", // page background (GitHub dark tone)
          800: "#161b22", // card background
          700: "#21262d", // elevated surfaces
          600: "#30363d", // borders / dividers
          500: "#484f58", 
        },
        // Accent — electric indigo used for interactive elements
        accent: {
          DEFAULT: "#6e40c9",
          hover: "#8b5cf6",
          light: "#a78bfa",
        },
        // Priority colours for the Kanban cards
        priority: {
          low: "#22c55e",
          medium: "#f59e0b",
          high: "#ef4444",
        },
        // Status column header colours
        status: {
          todo: "#64748b",
          in_progress: "#3b82f6",
          done: "#22c55e",
        },
      },
      fontFamily: {
        // JetBrains Mono for a subtle developer-tool aesthetic on code/IDs
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "slide-in": "slideIn 0.2s ease-out",
        "fade-in": "fadeIn 0.15s ease-out",
      },
      keyframes: {
        slideIn: {
          "0%": { transform: "translateY(-8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};