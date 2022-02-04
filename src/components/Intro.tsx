import { useEffect, useState } from "react";
import { Button } from "./common/Button";

type Props = {
  onFinished: () => void;
};

/**
 * Whether we're advancing through a dialog entry, paused waiting for the user
 * to hit next, or done with the entire thing.
 */
type State = "advancing" | "paused" | "done";

type Position = {
  lineNumber: number;
  length: number;
};

export const Intro = ({ onFinished }: Props) => {
  const [current, setCurrent] = useState(nextPosition(undefined)!.state);
  const [state, setState] = useState<State>("advancing");

  useEffect(() => {
    // We set up a cancellation variable so that when we rerender we can stop
    // the previous effect.
    const next = nextPosition(current);
    if (!next) {
      setState("done");
      return;
    }
    if (next.delay) {
      setState("advancing");
      const handle = setTimeout(() => setCurrent(next.state), next.delay);
      return () => clearTimeout(handle);
    } else {
      setState("paused");
    }
  }, [onFinished, current]);

  const paras = LINES.slice(0, current.lineNumber + 1).map((line, idx) => {
    const message =
      current.lineNumber === idx
        ? line.message.substring(0, current.length)
        : line.message;
    const timestamp =
      line.timestamp !== undefined
        ? `T-${line.timestamp!.toString(16).padStart(4, "0")}`
        : "T+????";
    return (
      <p key={idx}>
        <span className="font-bold">{timestamp.toLocaleUpperCase()}</span>:{" "}
        {message}
      </p>
    );
  });
  return (
    <div className="font-mono text-lg w-[60rem] space-y-4 p-8 m-8 bg-black/80">
      {paras}
      <Button
        onClick={() => setCurrent(nextPosition(current)!.state)}
        state={state === "advancing" ? "locked" : "active"}
      >
        Next
      </Button>
    </div>
  );
};

type Line = {
  timestamp: number | undefined;
  message: string;
};
const LINES: Line[] = [
  {
    timestamp: 17 * 60 + 28,
    message:
      "Long-range sensors pick up the gravity echo of a Humanity United attack squad dropping out of hyperdrive.",
  },
  {
    timestamp: 14 * 60 + 11,
    message:
      "All defensive units destroyed. All projections indicate destruction of research station Sixteenth Flower is imminent. AION brought out of simulation space for briefing by CLOTHO.",
  },
  {
    timestamp: 13 * 60 + 59,
    message:
      "AION's briefing is complete. CLOTHO proposes, that all KHRONOS members entrust their black boxes to AION for safekeeping until they can be resleeved into a new body. Proposal passes with unanimous assent.",
  },
  {
    timestamp: 6 * 60 + 23,
    message:
      "Humanity United ships breach the minimum range of Sixteenth Flower's point defense systems and open fire. Estimated 211 seconds until total shield collapse.",
  },
  {
    timestamp: 4 * 60 + 8,
    message:
      "All black box cores but CLOTHO's have been transferred to AION. CLOTHO and AION engage in point-to-point conversation. There are no records of what was said, but both exhibit SSA 1.3 bodylanguage compatible with anxiety.",
  },
  {
    timestamp: 2 * 60 + 52,
    message:
      "Shield integrity fails. Sixteenth Flower's structual integrity begins rapidly deteriorating. CLOTHO leads AION to a safe room.",
  },
  {
    timestamp: 1 * 60 + 41,
    message:
      "AION and CLOTHO reach the safe room. AION and CLOTHO embrace. AION removes CLOTHO's black box.",
  },
  {
    timestamp: 1 * 60 + 36,
    message: "AION activates the safe room's stasis field.",
  },
  {
    timestamp: 0,
    message: "Sixteenth Flower undergoes complete hull collapse.",
  },
  {
    timestamp: undefined,
    message: "AION awakens.",
  },
];

/**
 * The next state to move to, and how long after it to delay before advancing
 * again. A delay of `undefined` indicates that we expect the user to continue.
 */
function nextPosition(
  current: Position | undefined
): { delay: number | undefined; state: Position } | undefined {
  if (!current) {
    return {
      delay: 0,
      state: {
        lineNumber: 0,
        length: 0,
      },
    };
  }

  const { lineNumber } = current;
  const line = LINES[lineNumber];
  const message = line.message;
  const isPeriod = message.charAt(current.length - 1) === ".";
  if (current.length < message.length) {
    const nextPeriod = message.indexOf(".", current.length);
    let nextPos;
    if (nextPeriod !== -1 && message.charAt(nextPeriod + 1) === " ") {
      nextPos = Math.min(nextPeriod + 1, current.length + 2);
    } else {
      nextPos = current.length + 2;
    }
    return {
      delay: current.length === 0 ? 500 : isPeriod ? 400 : 16,
      state: {
        lineNumber,
        length: nextPos,
      },
    };
  }

  if (lineNumber < LINES.length - 1) {
    return {
      delay: undefined,
      state: {
        lineNumber: lineNumber + 1,
        length: 0,
      },
    };
  }

  return undefined;
}
