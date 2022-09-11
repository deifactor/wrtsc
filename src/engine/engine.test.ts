import { Engine, tickTime } from "./engine";
import { QueueSchedule } from "./schedule";
import { SCAVENGE_BATTERIES } from "./task";

describe("QueueEngine#tickTime", () => {
  it("should succeed when the task queue is empty", () => {
    const engine = new Engine(new QueueSchedule([]));
    expect(tickTime(engine, 200)).toEqual({
      ok: true,
    });
  });

  describe("failure modes", () => {
    it("should fail when running out of energy", () => {
      const engine = new Engine(
        new QueueSchedule([{ task: "exploreRuins", count: 2 }])
      );
      expect(tickTime(engine, 4500)).toEqual({
        ok: true,
      });
      expect(tickTime(engine, 600)).toEqual({
        ok: false,
        reason: "outOfEnergy",
      });
    });

    it("should fail when the task cannot be performed", () => {
      const engine = new Engine(
        new QueueSchedule([{ task: SCAVENGE_BATTERIES.id, count: 1 }])
      );
      expect(tickTime(engine, 200)).toEqual({
        ok: false,
        reason: "taskFailed",
      });
    });
  });
});
