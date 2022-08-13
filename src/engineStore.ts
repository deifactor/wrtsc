import React, { useCallback, useContext } from "react";
import { Engine } from "./engine";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";
import equal from "fast-deep-equal";
import { EngineView, project } from "./viewModel";

/**
 * Basic store for a value. Unlike Redux-style stores, the value is intended to
 * be mutated in place.
 */
export class MutableStore {
  private _engine: Engine;
  private _view: EngineView;
  readonly listeners: Set<() => void> = new Set();
  constructor(engine: Engine) {
    this._engine = engine;
    this._view = project(engine);
    this.subscribe = this.subscribe.bind(this);
  }

  get view(): EngineView {
    return this._view;
  }

  get state(): Engine {
    return this._engine;
  }

  set state(state: Engine) {
    this._engine = state;
    this.notify();
  }

  /** Add a listener. Returns a function to delete that listener. */
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Triggers all listeners. */
  notify() {
    this._view = project(this._engine);
    for (const listener of this.listeners) {
      listener();
    }
  }
}

/**
 * Context that stores the mutable engine. Loads the engine from the save file
 * by default so that we can maintain the invariant that there's always a valid engine.
 */
export const EngineViewStore = React.createContext(
  new MutableStore(Engine.loadFromStorage())
);

/**
 * Select a value out of the engine's state.
 *
 * Any component that uses this will be updated whenever the output of the
 * selector changes. The value is compared using `isEqual` to avoid rerendering
 * it twice; the default behavior of deep equality checks should be good enough.
 */
export function useEngineSelector<T>(
  selector: (engine: EngineView) => T,
  isEqual: (a: T, b: T) => boolean = equal
): T {
  const store = useContext(EngineViewStore);
  const snapshot = useCallback(() => store.view, [store]);
  return useSyncExternalStoreWithSelector(
    store.subscribe,
    snapshot,
    null,
    selector,
    isEqual
  );
}
