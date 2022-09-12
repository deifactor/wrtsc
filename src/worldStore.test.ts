import { pushTaskToQueue } from "./nextQueueStore";
import { createStore } from "./store";
import {
  setPaused,
  setUseUnspentTime,
  startLoop,
  tickDelta,
} from "./worldStore";

// Create a test store with a single "explore ruins" action.
function createTestStore() {
  const store = createStore();
  store.dispatch(pushTaskToQueue("exploreRuins"));
  store.dispatch(startLoop());
  return store;
}

describe("pausing", () => {
  it("should unpause when restarting the loop", () => {
    const store = createTestStore();
    expect(store.getState().world.paused).toBeFalsy();
  });
  it("should not increment engine time when paused", () => {
    const store = createTestStore();
    store.dispatch(setPaused(true));
    store.dispatch(tickDelta(100));
    expect(store.getState().world.engine.timeInLoop).toEqual(0);
    expect(store.getState().world.engine.timeAcrossAllLoops).toEqual(0);
  });

  it("should tick the engine when unpaused", () => {
    const store = createTestStore();
    store.dispatch(setPaused(false));
    store.dispatch(tickDelta(100));
    expect(store.getState().world.paused).toBeFalsy();
    expect(store.getState().world.loopFinished).toBeFalsy();
    expect(store.getState().world.engine.timeInLoop).toEqual(100);
    expect(store.getState().world.engine.timeAcrossAllLoops).toEqual(100);
  });
});

describe("bonus time", () => {
  it("should increment when ticking while paused", () => {
    const store = createTestStore();
    store.dispatch(setPaused(true));
    expect(store.getState().world.unspentTime).toEqual(0);
    store.dispatch(tickDelta(100));
    expect(store.getState().world.unspentTime).toEqual(100);
  });

  it("should not increment when ticking while unpaused", () => {
    const store = createTestStore();
    store.dispatch(setPaused(false));
    store.dispatch(startLoop());
    store.dispatch(tickDelta(100));
    expect(store.getState().world.unspentTime).toEqual(0);
    expect(store.getState().world.engine.timeInLoop).toEqual(100);
  });

  it("should not be spent if we disable unspent time", () => {
    const store = createTestStore();
    store.dispatch(setPaused(true));
    store.dispatch(tickDelta(100));
    store.dispatch(setUseUnspentTime(false));
    store.dispatch(setPaused(false));
    store.dispatch(tickDelta(50));
    expect(store.getState().world.unspentTime).toEqual(100);
    expect(store.getState().world.engine.timeInLoop).toEqual(50);
  });
});
