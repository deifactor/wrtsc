import { pushTaskToQueue } from "./nextQueueStore";
import { createStore } from "./store";
import { setPaused, startLoop, tickDelta } from "./worldStore";

// Create a test store with a single "explore ruins" action.
function createTestStore() {
  const { store, engine } = createStore();
  store.dispatch(pushTaskToQueue("exploreRuins"));
  store.dispatch(startLoop());
  return { store, engine };
}

describe("pausing", () => {
  it("should not increment engine time when paused", () => {
    const { store, engine } = createTestStore();
    store.dispatch(setPaused(true));
    store.dispatch(tickDelta(100));
    expect(engine.timeInLoop).toEqual(0);
    expect(engine.timeAcrossAllLoops).toEqual(0);
  });

  it("should tick the engine when unpaused", () => {
    const { store, engine } = createTestStore();
    store.dispatch(setPaused(false));
    store.dispatch(tickDelta(100));
    expect(engine.timeInLoop).toEqual(100);
    expect(engine.timeAcrossAllLoops).toEqual(100);
  });
});

describe("bonus time", () => {
  it("should increment when ticking while paused", () => {
    const { store } = createTestStore();
    store.dispatch(setPaused(true));
    expect(store.getState().world.unspentTime).toEqual(0);
    store.dispatch(tickDelta(100));
    expect(store.getState().world.unspentTime).toEqual(100);
  });

  it("should not increment when ticking while unpaused", () => {
    const { store, engine } = createTestStore();
    store.dispatch(setPaused(false));
    store.dispatch(startLoop());
    store.dispatch(tickDelta(100));
    expect(store.getState().world.unspentTime).toEqual(0);
    expect(engine.timeInLoop).toEqual(100);
  });
});
