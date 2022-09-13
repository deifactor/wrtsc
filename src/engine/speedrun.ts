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
import { entries } from "../records";

function benchmark(
  name: string,
  agent: Agent,
  stopCondition: (engine: Engine) => boolean
) {
  const schedule = {
    next(engine: Engine) {
      return agent(engine)?.id;
    },
    recordResult(success: boolean) {
      if (!success) {
        throw new Error(`Task mysteriously failed!`);
      }
    },
    restart() {},
  };
  const engine = makeEngine();
  startLoop(engine, schedule);

  const now = new Date().getTime();
  while (!stopCondition(engine)) {
    startLoop(engine, schedule);
    while (engine.taskState?.task && !stopCondition(engine)) {
      tickTime(
        engine,
        schedule,
        getEnergyToNextEvent(engine) / getEnergyPerMs(engine)
      );
    }
  }
  const duration = new Date().getTime() - now;
  console.log(`Benchmark for "${name}" finished`);
  console.log(
    "Simulated time taken (sec):",
    (engine.timeAcrossAllLoops / 1000).toFixed(0)
  );
  console.log("Wall-clock time taken (ms): ", duration.toFixed(0));
  console.log(
    "Skills",
    entries(engine.skills)
      .map(([id, level]) => `${id} ${level.level}`)
      .join(", ")
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
        agent.exploreRuins,
        agent.hijacker,
        agent.observe,
        agent.lockout
      )
    )
  ),
  (engine) => engine.progress.qhLockout.level >= 100
);
