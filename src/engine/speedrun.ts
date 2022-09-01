import { Agent } from "./agent";
import * as agent from "./agent";
import { Engine } from "./engine";
import { Task, TaskKind } from "./task";

class DynamicEngine extends Engine<Agent> {
  agent: Agent = () => undefined;
  task: Task | undefined;
  taskHistory: TaskKind[] = [];

  next(success: boolean): void {
    if (!success) {
      throw new Error(`Task ${this.task?.kind} mysteriously failed!`);
    }
    this.task && this.taskHistory.push(this.task?.kind);
    this.task = this.agent(this);
  }

  protected setSchedule(agent: Agent): void {
    this.agent = agent;
    this.taskHistory = [];
    this.task = this.agent(this);
  }
}

function benchmark(
  name: string,
  agent: Agent,
  stopCondition: (engine: Engine) => boolean
) {
  const engine = new DynamicEngine();

  const now = new Date().getTime();
  while (!stopCondition(engine)) {
    engine.startLoop(agent);
    while (engine.task && !stopCondition(engine)) {
      engine.tickTime(engine.timeLeftOnTask!);
    }
  }
  const duration = new Date().getTime() - now;
  console.log(`Benchmark for "${name}" finished`);
  console.log(
    "Simulated time taken (sec):",
    (engine.timeAcrossAllLoops / 1000).toFixed(0)
  );
  console.log("Wall-clock time taken (ms): ", duration.toFixed(0));
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
