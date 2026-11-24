// Check the actual SVG controls, not the construction formula in isolation.
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm");
const ctx = { window: {} };
vm.runInNewContext(
  fs.readFileSync(__dirname + "/../public/geometry.js", "utf8"),
  ctx,
);
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]],
  cross = (a, b) => a[0] * b[1] - a[1] * b[0],
  mag = (a) => Math.hypot(...a);
const k = (a, b) => (2 * cross(a, b)) / (3 * mag(a) ** 3);
for (const mode of ["mirror", "parallel"])
  for (const blend of [0, 1, 32, 65, 100]) {
    const p =
      mode === "mirror"
        ? {
            angle: 20,
            weight: 64,
            o: 192,
            shoulder: 77,
            bowl: 77,
            hook: 93,
            n: 140,
            cut: 19,
            blend,
          }
        : {
            angle: 17,
            weight: 35,
            o: 175,
            shoulder: 47,
            bowl: 64,
            n: 135,
            cut: 18,
            blend,
          };
    const g = ctx.window.OYN.make(mode, p);
    assert.ok(g.safe);
    for (const [id, radii] of Object.entries({
      branches: [-p.o, p.shoulder, p.shoulder, -p.bowl, -p.bowl],
      joint: [p.shoulder, p.shoulder],
      tail: [-(p.hook ?? p.bowl)],
      n: [p.n, p.n],
    })) {
      let at,
        count = 0;
      const d = g.ink.match(new RegExp('id="' + id + '" d="([^"]+)'))[1];
      for (const [, op, raw] of d.matchAll(/([MLCAV])([^MLCAV]*)/g)) {
        const n = raw.trim().split(/\s+/).map(Number);
        if (op === "C") {
          const r = radii[count++],
            a = sub(n.slice(0, 2), at),
            b = sub(n.slice(2, 4), n.slice(0, 2)),
            c = sub(n.slice(4), n.slice(2, 4));
          const start = k(a, b),
            end = k(c, b) * -1;
          const circleFirst =
            id === "tail" ||
            (id === "branches" ? count % 2 === 1 : count % 2 === 0);
          assert.ok(
            Math.abs(start - (circleFirst ? 1 / r : 0)) < 0.00004 &&
              Math.abs(end - (circleFirst ? 0 : 1 / r)) < 0.00004,
            id + " signed curvature",
          );
          assert.ok(mag(a) + mag(b) + mag(c) <= blend + 0.00001);
        }
        at = op === "V" ? [at[0], n[0]] : n.slice(-2);
      }
      assert.equal(count, blend ? radii.length : 0);
    }
  }
