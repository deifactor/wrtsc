import { reuse } from "./reuse";

it("should handle primitives", () => {
  expect(reuse(3, 2)).toEqual(3);
});

it("should handle embedded NaNs", () => {
  const target = { x: NaN };
  const source = { x: NaN };
  expect(reuse(target, source)).toBe(source);
});

it("should accept cases where source and target are arrays of different length", () => {
  const target = [{ x: 1 }, { x: 2 }];
  const source = [{ x: 3 }, { x: 2 }, { x: 8 }];
  const reused = reuse(target, source);
  expect(reused).toEqual([{ x: 1 }, { x: 2 }]);
  expect(reused[1]).toBe(source[1]);
});

it("should not add keys on source not in target", () => {
  expect(reuse({ x: 3, y: 4 }, { x: 6, y: 4, z: 2 })).toEqual({ x: 3, y: 4 });
});

it("should handle nested fields properly", () => {
  const target = { names: ["foo", "bar"], props: { baz: 123 } };
  const source = { names: ["baz", "quux"], props: { baz: 123 } };
  const reused = reuse(target, source);
  expect(reused.names).toEqual(["foo", "bar"]);
  expect(reused.props).toBe(source.props);
});
