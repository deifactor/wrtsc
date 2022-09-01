import { QueueEngine } from "./engine";

/**
 * The 'extra' state shared by both the thunk and listener middleware. It's just
 * a reference to the engine.
 */
export const extra = { engine: new QueueEngine() };
