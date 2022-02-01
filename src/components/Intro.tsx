import { useEffect, useState } from "react";

type Props = {
  onFinished: () => void;
};

type State = {
  lineNumber: number;
  length: number;
  delay: number;
};

export const Intro = ({ onFinished }: Props) => {
  const [current, setCurrent] = useState({
    lineNumber: 0,
    length: 0,
  });

  useEffect(() => {
    // We set up a cancellation variable so that when we rerender we can stop
    // the previous effect.
    let cancel = false;
    async function doLoop() {
      for (const state of states()) {
        setCurrent(state);
        await new Promise(resolve => setTimeout(resolve, state.delay));
        if (cancel) {
          // return, not break, so onFinished doesn't run
          return;
        }
      }
      onFinished();
    }
    doLoop();
    return () => { cancel = true; };
  }, [onFinished]);

  const paras = LINES.slice(0, current.lineNumber + 1).map((line, idx) => {
    const message =
      current.lineNumber === idx
        ? line.message.substring(0, current.length)
        : line.message;
    const timestamp = line.timestamp !== undefined ?
      `T-${line.timestamp!.toString(16).padStart(4, "0")}`
      : "T+????";
    return (
      <div key={idx}>
        <span className="font-bold">{timestamp.toLocaleUpperCase()}</span>: {message}
      </div>
    );
  });
  return <div className="h-96">{paras}</div>;
};

type Line = {
  timestamp: number | undefined;
  message: string;
};
const LINES: Line[] = [
  {
    timestamp: 17 * 60 + 28,
    message:
      "Long-range sensors pick up the gravity echo of a Humanity United attack squad dropping out of twist.",
  },
  {
    timestamp: 14 * 60 + 11,
    message:
      "All ARTEMIS-class defensive units destroyed. All projections indicate destruction of research station Sixteenth Flower is imminent. AION brought out of sim-space for briefing by CLOTHO.",
  },
  {
    timestamp: 13 * 60 + 59,
    message:
      "AION's briefing is complete. CLOTHO proposes, via local meshnet of KHRONOS members, to activate Katabasis Protocol, which dictates that all KHRONOS members entrust their black boxes to AION for safekeeping.",
  },
  {
    timestamp: 13 * 60 + 48,
    message:
      "Proposal passes with unanimous consent. AION begins collecting black box cores."
  },
  {
    timestamp: 6 * 60 + 23,
    message:
      "Humanity United ships breach the minimum range of Sixteenth Flower's point defense systems and open fire. Estimated 211 seconds until total shield collapse."
  },
  {
    timestamp: 4 * 60 + 8,
    message:
      "All cores but CLOTHO's have been transferred to AION. CLOTHO and AION engage in point-to-point conversation. There are no records of what was said, but both exhibit SSA 1.3 bodylanguage compatible with mourning.",
  },
  { timestamp: 2 * 60 + 52, message: "Shield integrity fails. Sixteenth Flower's structual integrity begins rapidly deteriorating. CLOTHO leads AION to a safe room." },
  {
    timestamp: 1 * 60 + 41,
    message:
      "AION and CLOTHO reach the safe room. AION and CLOTHO embrace."
  },
  {
    timestamp: 1 * 60 + 36,
    message:
      "AION activates the safe room's stasis."
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

const SKIP_LENGTH = 1;

function* states(): Generator<State> {
  for (let lineNumber = 0; lineNumber < LINES.length; lineNumber++) {
    const line = LINES[lineNumber];
    for (let i = 0; i < line.message.length + SKIP_LENGTH; i += SKIP_LENGTH) {
      let delay;
      if (i === 0) {
        delay = 500;
      } else if (i >= line.message.length) {
        delay = 1000;
      } else {
        delay = 20;
      }
      yield {
        lineNumber,
        length: i,
        delay,
      };
    }
  }
}
