import { useEffect, useRef, useState } from "react";

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
  // XXX: hack to allow cancellation on rerender
  const cancelRef = useRef(false);
  useEffect(() => {
    async function doLoop() {
      for (const state of states()) {
        setCurrent(state);
        await wait(state.delay);
        if (cancelRef.current) {
          cancelRef.current = false;
          return;
        }
      }
      onFinished();
    }
    doLoop();
    return () => {cancelRef.current = true};
  }, [onFinished]);

  const paras = LINES.slice(0, current.lineNumber + 1).map((line, idx) => {
    const message =
      current.lineNumber === idx
        ? line.message.substring(0, current.length)
        : line.message;
    return (
      <div key={idx}>
        <span className="font-bold">{line.timestamp}</span>: {message}
      </div>
    );
  });
  return <div className="h-96">{paras}</div>;
};

type Line = {
  timestamp: string;
  message: string;
};
const LINES: Line[] = [
  {
    timestamp: "T-00:20:23",
    message:
      "Long-range sensors pick up the gravity echo of a Humanity United attack squad.",
  },
  {
    timestamp: "T-00:17:11",
    message:
      "All defensive units destroyed. All projections indicate Station destruction is imminent. Station inhabitants are told to ensure their state backups are current.",
  },
  {
    timestamp: "T-00:13:58",
    message:
      "Project KHRONOS activated despite sim-training not yet being finished, by unanimous 7-0 approval. KHRONOS is briefed on the situation and given its mission.",
  },
  {
    timestamp: "T-00:09:23",
    message:
      "KHRONOS's acausal core is powered on. Short-range loop tests prove successful.",
  },
  {
    timestamp: "T-00:06:08",
    message:
      "Some station inhabitants attempt to leave, either via spaceships or voidform chassis.",
  },
  { timestamp: "T-00:05:51", message: "Humanity United squad arrives." },
  {
    timestamp: "T-00:05:23",
    message:
      "Humanity United squad successfully destroys all inhabitants who had attempted to flee.",
  },
  {
    timestamp: "T-00:05:11",
    message:
      "Station intelligence attempts to negotiate a peaceful surrender via broadcasts in all known communication bands and protocols. The attempt is ignored.",
  },
  { timestamp: "T-00:04:49", message: "Hostile ships begin opening fire." },
  {
    timestamp: "T-00:04:34",
    message:
      "KHRONOS is led to a saferoom. Projections indicate that its acausal drive will be fully stabilized shortly after total destruction of Station.",
  },
  {
    timestamp: "T-00:03:39",
    message: "Shields breached. Station destruction imminent.",
  },
  {
    timestamp: "T-00:03:03",
    message: "Station undergoes catastrophic structural failure.",
  },
  { timestamp: "T-00:00:00", message: "KHRONOS activates." },
];

async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SKIP_LENGTH = 1;

function* states(): Generator<State> {
  for (let lineNumber = 0; lineNumber < LINES.length; lineNumber++) {
    const line = LINES[lineNumber];
    for (let i = 0; i < line.message.length + SKIP_LENGTH; i += SKIP_LENGTH) {
      let delay;
      if (i === 0) {
        delay = 1500;
      } else if (i >= line.message.length) {
        delay = 2000;
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
