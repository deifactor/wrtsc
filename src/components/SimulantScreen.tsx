import React, { ReactNode } from "react";
import {
  SimulantId,
  SIMULANT_TO_SUBROUTINE,
  SubroutineId,
} from "../engine/simulant";
import { Button } from "./common/Button";

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
  }
}

function subroutineLore(id: SubroutineId): {
  name: string;
  description: string;
} {
  switch (id) {
    case "burstClock":
      return {
        name: "Burst Clock",
        description:
          "Provides an increase in speed (and matching increase in energy consumption) for the first 16384 AEU of a loop.",
      };
  }
}

const SubroutineButton = React.memo(({ id }: { id: SubroutineId }) => {
  const { name, description } = subroutineLore(id);
  return (
    <Button onClick={() => {}} tooltip={description}>
      {name}
    </Button>
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
export const SimulantScreen = React.memo(() => {
  return (
    <div>
      <SimulantSection id="tekhne" />
      <SimulantSection id="ergon" />
    </div>
  );
});
SimulantScreen.displayName = "SimulantScreen";
