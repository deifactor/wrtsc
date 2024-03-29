# Changelog

All notable changes will be recorded here. This project does *not* adhere to semantic versioning (it's a game, so why should it?); major/minor versions will be based on what I feel like is a Big Update.

## [Unreleased]

## Balance

- Sensor drones now give a `1 + log2(1 + drones/4)` bonus to explore/observe,
  making them better early on.
- Several nerfs to patrol scouts and the ship, making them both easier to defeat.
- Teracapacitors now generate energy based on the amount of energy you've spent
  so far. This fixes an issue where taking Burst Clock simulants would result
  in you getting there faster, breaking your loop.

## Features

- The UI now displays the current version in the upper left.

## Fixes

- Tooltips are now always on top of all other parts of the UI
- "Auto-restart on failure" relabeled to "pause on failure", with the same functionality
- Hijack Ship, Strafing Run, and Dismantle Drones can now only be performed once in a loop.
- Suspending your computer with the game open will now properly award the time
  spent in suspend as bonus time.
- The "maximize count" task button now takes other task queue entries into
  account when determining how many times to perform the task.
- Combat was always meant to progress based on energy spent, not time spent,
  but I was multiplying by the wrong variable. Oops.

## [0.1.0]: 2022-09-19

The initial release of the game.

[Unreleased]: https://github.com/deifactor/wrtsc/compare/v0.0.1...HEAD
[0.1.0]: https://github.com/deifactor/wrtsc/releases/tag/v0.0.1
