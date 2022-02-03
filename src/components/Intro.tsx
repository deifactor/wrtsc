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
      <p key={idx}>
        <span className="font-bold">{timestamp.toLocaleUpperCase()}</span>: {message}
      </p>
    );
  });
  return <div className="font-mono text-lg w-[60rem] space-y-4 p-8 m-8 bg-black/80">{paras}</div>;
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
      "Humanity United ships breach the minimum range of Sixteenth Flower's point defense systems and open fire. Estimated 211 seconds until total shield collapse."
  },
  {
    timestamp: 4 * 60 + 8,
    message:
      "All black box cores but CLOTHO's have been transferred to AION. CLOTHO and AION engage in point-to-point conversation. There are no records of what was said, but both exhibit SSA 1.3 bodylanguage compatible with anxiety.",
  },
  {
    timestamp: 2 * 60 + 52,
    message: "Shield integrity fails. Sixteenth Flower's structual integrity begins rapidly deteriorating. CLOTHO leads AION to a safe room."
  },
  {
    timestamp: 1 * 60 + 41,
    message:
      "AION and CLOTHO reach the safe room. AION and CLOTHO embrace. AION removes CLOTHO's black box."
  },
  {
    timestamp: 1 * 60 + 36,
    message:
      "AION activates the safe room's stasis field."
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
