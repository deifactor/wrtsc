import { makeEngine, tickTime } from "./engine";
import { QueueSchedule } from "./schedule";
import { SCAVENGE_BATTERIES } from "./task";

describe("Engine#tickTime", () => {
  it("should succeed when the task queue is empty", () => {
    const schedule = new QueueSchedule([]);
    const engine = makeEngine(schedule);
    expect(tickTime(engine, schedule, 200)).toEqual({
      ok: true,
    });
  });

  describe("failure modes", () => {
    it("should fail when running out of energy", () => {
      const schedule = new QueueSchedule([{ task: "exploreRuins", count: 2 }]);
      const engine = makeEngine(schedule);
      expect(tickTime(engine, schedule, 4500)).toEqual({
        ok: true,
      });
      expect(tickTime(engine, schedule, 600)).toEqual({
        ok: false,
        reason: "outOfEnergy",
      });
    });

    it("should fail when the task cannot be performed", () => {
      const schedule = new QueueSchedule([
        { task: SCAVENGE_BATTERIES.id, count: 1 },
      ]);
      const engine = makeEngine(schedule);
      expect(tickTime(engine, schedule, 200)).toEqual({
        ok: false,
        reason: "taskFailed",
      });
    });
  });
});
