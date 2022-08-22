import { Engine } from "./engine";
import { project } from "./viewModel";
import { reuse } from "./reuse";

it("should generate identical objects for a blank engine", () => {
  const engine = new Engine();
  const old = project(engine);
  const nu = project(engine);
  expect(nu).toEqual(old);
  Object.keys(nu).forEach((k) => {
    if (typeof (nu as any)[k] === "object") {
      // eslint-disable-next-line jest/no-conditional-expect
      expect((nu as any)[k]).not.toBe((old as any)[k]);
    }
  });
  expect(nu).not.toBe(old);
  expect(reuse(nu, old)).toBe(old);
});
