// tailwind.config.js
// Tailwind CSS configuration for styling the Weather Outage Dashboard

module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary-color)",
        "primary-lighter": "var(--primary-lighter)",
        "primary-darker": "var(--primary-darker)",
        accent: "var(--accent-color)",
        warn: "var(--warn-color)",
      },
    },
  },
  plugins: [],
  darkMode: "class",
};
