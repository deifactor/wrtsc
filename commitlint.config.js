module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      [
        "ui",
        // for CSS-ish things
        "styling",
        // documentation
        "docs",
        // generic engine tasks
        "engine",
        "simulant",
        "skill",
        "task",
        // balance tasks
        "balance",
      ],
    ],
    "type-enum": [2, "always", ["fix", "feat", "test", "chore", "refactor"]],
  },
};
