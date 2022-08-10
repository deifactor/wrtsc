import { Engine } from "./engine";
import { EXPLORE_RUINS, SCAVENGE_BATTERIES } from "./task";

describe("Engine#tickTime", () => {
  it("should succeed when the task queue is empty", () => {
    const engine = new Engine();
    engine.startLoop([]);
    expect(engine.tickTime(200)).toEqual({
      ok: true,
    });
  });

  describe("failure modes", () => {
    it("should fail when running out of energy", () => {
      const engine = new Engine();
      engine.startLoop([{ task: EXPLORE_RUINS.kind, count: 1 }]);
      engine.removeEnergy(engine.energy - 100);
      expect(engine.tickTime(200)).toEqual({
        ok: false,
        reason: "outOfEnergy",
      });
    });

    it("should fail when the task cannot be performed", () => {
      const engine = new Engine();
      engine.startLoop([{ task: SCAVENGE_BATTERIES.kind, count: 1 }]);
      expect(engine.tickTime(200)).toEqual({
        ok: false,
        reason: "taskFailed",
      });
    });
  });
});
