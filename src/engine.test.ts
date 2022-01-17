import { Engine } from "./engine";
import { EXPLORE_RUINS, SCAVENGE_BATTERIES, SCAVENGE_WEAPONS } from "./task";

describe("Engine#tickTime", () => {
  it("should succeed when the task queue is empty", () => {
    const engine = new Engine();
    engine.startLoop();
    expect(engine.tickTime(200)).toEqual({
      ok: true,
    });
  });

  describe("failure modes", () => {
    it("should fail when running out of energy", () => {
      const engine = new Engine();
      engine.nextLoopTasks.push(EXPLORE_RUINS.kind);
      engine.startLoop();
      engine.player.removeEnergy(engine.player.energy - 100);
      expect(engine.tickTime(200)).toEqual({
        ok: false,
        reason: "outOfEnergy",
      });
    });

    it("should fail when the task cannot be performed", () => {
      const engine = new Engine();
      engine.nextLoopTasks.push(SCAVENGE_BATTERIES.kind);
      engine.startLoop();
      expect(engine.tickTime(200)).toEqual({
        ok: false,
        reason: "taskFailed",
      });
    });
  });

  it("should split the tick if a task completes in the middle", () => {
    const engine = new Engine();
    engine.player.stats.ruinsExploration.level = 10;
    engine.nextLoopTasks.push(SCAVENGE_WEAPONS.kind);
    engine.nextLoopTasks.push(SCAVENGE_WEAPONS.kind);
    engine.startLoop();
    expect(engine.tickTime(2 * SCAVENGE_WEAPONS.baseCost)).toEqual({
      ok: true,
    });
    expect(engine.player.resources.ruinsWeapons.current).toBe(1);
  });
});
