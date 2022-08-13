import { renderHook } from "@testing-library/react";
import { ReactNode } from "react";
import { Engine } from "./engine";
import {
  EngineViewStore,
  MutableStore,
  useEngineSelector,
} from "./engineStore";

it("should select the engine out", () => {
  const store = new MutableStore(new Engine());
  const wrapper = ({ children }: { children: ReactNode }) => (
    <EngineViewStore.Provider value={store}>
      {children}
    </EngineViewStore.Provider>
  );
  const { result } = renderHook(
    () => useEngineSelector((engine) => engine, Object.is),
    { wrapper }
  );
  expect(result.current).toBe(store.state);
});
