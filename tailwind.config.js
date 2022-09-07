module.exports = {
  content: ["./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        lethality: "hsl(0, 55%, 65%)",
        energy: "hsl(50, 60%, 60%)",
        datalink: "hsl(210, 60%, 60%)",
        spatial: "hsl(265, 60%, 60%)",
        ergodicity: "hsl(289, 50%, 40%)",
        metacognition: "hsl(33, 50%, 50%)",
      },
    },
    fontFamily: {
      mono: ["Cousine", "ui-monospace", "monospace"],
    },
  },
  plugins: [],
};
