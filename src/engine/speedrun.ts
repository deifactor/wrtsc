import { Agent } from "./agent";
import * as agent from "./agent";
import {
  Engine,
  getEnergyPerMs,
  getEnergyToNextEvent,
  makeEngine,
  startLoop,
  tickTime,
} from "./engine";
import { entries, keys } from "../records";
import { TaskId } from "./task";
import equal from "fast-deep-equal";
import { TaskQueue } from "./taskQueue";
import prettyMilliseconds from "pretty-ms";
import { MilestoneId } from "./player";

class AgentSchedule {
  agent: Agent;
  log: TaskQueue = [];
  constructor(agent: Agent) {
    this.agent = agent;
  }
  next(engine: Engine): TaskId | undefined {
    const id = this.agent(engine)?.id;
    if (!id) {
      return;
    }
    const log = this.log;
    if (log.length === 0 || log[log.length - 1].task !== id) {
      log.push({ task: id, count: 1 });
    } else {
      log[log.length - 1].count++;
    }
    return id;
  }
  recordResult(success: boolean) {
    if (!success) {
      throw new Error(`Task mysteriously failed!`);
    }
  }
}

function benchmark(
  name: string,
  agent: Agent,
  stopCondition: (engine: Engine) => boolean
) {
  const engine = makeEngine();

  let lastLog = [] as TaskQueue;
  const now = new Date().getTime();
  const milestones = new Map<MilestoneId, number>();
  while (!stopCondition(engine)) {
    const schedule = new AgentSchedule(agent);
    startLoop(engine, schedule);
    while (engine.taskState?.task && !stopCondition(engine)) {
      tickTime(
        engine,
        schedule,
        Math.max(getEnergyToNextEvent(engine) / getEnergyPerMs(engine), 1)
      );
    }
    if (!equal(schedule.log, lastLog)) {
      console.log(prettyMilliseconds(engine.timeAcrossAllLoops), schedule.log);
      lastLog = schedule.log;
    }
    for (const milestone of keys(engine.milestones)) {
      if (!milestones.has(milestone)) {
        milestones.set(milestone, engine.timeAcrossAllLoops);
      }
    }
  }
  const duration = new Date().getTime() - now;
  console.log(`Benchmark for "${name}" finished`);
  console.log(
    "Simulated time taken:",
    prettyMilliseconds(engine.timeAcrossAllLoops)
  );
  console.log("Wall-clock time taken: ", prettyMilliseconds(duration));
  console.log(
    "Skills",
    entries(engine.skills)
      .map(([id, level]) => `${id} ${level.level}`)
      .join(", ")
  );
  console.log(
    "Milestones",
    Array.from(milestones.entries())
      .map(([id, ms]) => `${id} @ ${prettyMilliseconds(ms)}`)
      .join(" ")
  );
}

benchmark(
  "only batteries and exploring",
  agent.first(agent.scavengeBatteries, agent.exploreRuins),
  (engine) => engine.progress.ruinsExploration.level >= 100
);

benchmark(
  "batteries, linking, and exploring",
  agent.first(agent.scavengeBatteries, agent.linkDrones, agent.exploreRuins),
  (engine) => engine.progress.ruinsExploration.level >= 100
);

benchmark(
  "with teracapacitors: batteries, linking, and exploring",
  agent.first(
    agent.scavengeBatteries,
    agent.withTeracapacitors(agent.first(agent.linkDrones, agent.exploreRuins))
  ),
  (engine) => engine.progress.ruinsExploration.level >= 100
);

benchmark(
  "with teracapacitors: batteries, linking, exploring, observing",
  agent.first(
    agent.scavengeBatteries,
    agent.withTeracapacitors(
      agent.first(
        agent.linkDrones,
        agent.exploreRuins,
        agent.hijacker,
        agent.observe
      )
    )
  ),
  (engine) => engine.progress.patrolRoutesObserved.level >= 100
);

benchmark(
  "with teracapacitors: batteries, linking, exploring, observing, hacking",
  agent.first(
    agent.scavengeBatteries,
    agent.withTeracapacitors(
      agent.first(
        agent.linkDrones,
        agent.unlockSimulant,
        agent.exploreRuins,
        agent.hijacker,
        agent.observe,
        agent.lockout
      )
    )
  ),
  (engine) => engine.progress.qhLockout.level >= 100
);
