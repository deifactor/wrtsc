import React, { ReactNode } from "react";
import {
  getSubroutineCost,
  isSubroutineAvailable,
  SimulantId,
  SIMULANT_TO_SUBROUTINE,
  SubroutineId,
} from "../engine/simulant";
import { useAppDispatch, useEngineSelector } from "../store";
import { unlockSubroutine } from "../worldStore";
import { Button } from "./common/Button";
import { CardTooltip, WithTooltip } from "./common/Tooltip";

function simulantLore(id: SimulantId): {
  name: ReactNode;
  description: ReactNode;
} {
  switch (id) {
    case "tekhne":
      return {
        description: "Head engineer of the anticausal engine project.",
        name: "Tekhne",
      };
    case "ergon":
      return {
        description:
          "Specialist in ultra-high-density energy storage and transport.",
        name: "Ergon",
      };
    case "enkephalos":
      return {
        description: "Cognitive architect and synthetic neurologist.",
        name: "Enkephalos",
      };
  }
}

function subroutineLore(id: SubroutineId): {
  name: string;
  description: string;
} {
  switch (id) {
    case "burstClock":
      return {
        name: "Burst Clock α",
        description:
          "Provides an increase in speed (and matching increase in energy consumption) for the first 16384 AEU of a loop.",
      };
    case "burstClockBeta":
      return {
        name: "Burst Clock β",
        description:
          "Provides an increase in speed (and matching increase in energy consumption) for the first 32768 AEU of a loop.",
      };
    case "capacitiveCoupler":
      return {
        name: "Capacitive Coupler",
        description: "Increases the energy cap of teracapacitors to 102400.",
      };
    case "electrovore":
      return {
        name: "Electrovore",
        description: "Obtaining matter now also recharges your energy.",
      };
    case "metametacognition":
      return {
        name: "Meta-metacognition",
        description:
          "Your metacognition level is treated as if it was multiplied by its square root.",
      };
    case "selfOptimizing":
      return {
        name: "Self-Optimization",
        description:
          "The cost of all non-combat tasks decreases the more time you've spent across all loops.",
      };
    case "combatAccelerator":
      return {
        name: "Combat Accelerator",
        description:
          "All multipliers to speed also apply a corresponding multiplier to your offense.",
      };
  }
}

const SubroutineButton = React.memo(({ id }: { id: SubroutineId }) => {
  const { name, description } = subroutineLore(id);
  const dispatch = useAppDispatch();
  const cost = getSubroutineCost(id);
  const available = useEngineSelector(isSubroutineAvailable, id);
  const unlocked = useEngineSelector(
    (engine) => id in engine.simulant.unlocked
  );

  return (
    <WithTooltip
      tooltip={
        <CardTooltip metadata={{ Cost: cost }}>{description}</CardTooltip>
      }
      render={(ref) => (
        <Button
          ref={ref}
          state={unlocked ? "unlocked" : available ? "active" : "locked"}
          onClick={() => dispatch(unlockSubroutine(id))}
        >
          {name}
        </Button>
      )}
    />
  );
});

/** The section for an individual simulant. Displays their subroutines. */
const SimulantSection = React.memo(({ id }: { id: SimulantId }) => {
  const lore = simulantLore(id);
  return (
    <div className="pb-8">
      <h1 className="flex justify-between items-baseline p-0">
        <span>{lore.name}</span>{" "}
        <span className="text-sm">{lore.description}</span>
      </h1>
      <hr className="border-gray-600" />
      {SIMULANT_TO_SUBROUTINE[id].map((sub) => (
        <SubroutineButton id={sub} key={sub} />
      ))}
    </div>
  );
});
SimulantSection.displayName = "SimulantSection";

/** The user interface for viewing what simulants/subroutines are unlocked. */
export const SimulantPanel = React.memo(() => {
  return (
    <div>
      <SimulantSection id="tekhne" />
      <SimulantSection id="ergon" />
      <SimulantSection id="enkephalos" />
    </div>
  );
});
SimulantPanel.displayName = "SimulantPanel";
