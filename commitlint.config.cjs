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
      ],
    ],
    "type-enum": [2, "always", ["fix", "feat", "test", "chore", "refactor", "balance"]],
  },
};
