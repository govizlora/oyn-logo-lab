const assert = require("node:assert/strict"),
  { readFileSync } = require("node:fs"),
  { runInNewContext } = require("node:vm");
const ctx = { window: {} };
runInNewContext(
  readFileSync(__dirname + "/../public/geometry.js", "utf8"),
  ctx,
);
const close = (a, b, tol = 0.003) =>
  assert.ok(Math.abs(a - b) < tol, `${a} != ${b}`);
for (const mode of ["mirror", "parallel"]) {
  for (const blend of [0, 32, 100]) {
    const p =
      mode === "mirror"
        ? {
            blend,
            angle: 20,
            weight: 64,
            o: 192,
            shoulder: 77,
            bowl: 77,
            hook: 93,
            n: 140,
            cut: 19,
          }
        : {
            blend,
            angle: 17,
            weight: 35,
            o: 175,
            shoulder: 47,
            bowl: 64,
            n: 135,
            cut: 18,
          };
    assert.ok(ctx.window.OYN.make(mode, p).safe);
    for (const cut of [0, 19, 55]) {
      let reference;
      for (const weight of [16, 32, p.weight]) {
        const g = ctx.window.OYN.make(mode, { ...p, weight, cut });
        const nums = (s) => s.match(/-?[\d.]+/g).map(Number);
        const [sx, sy, r] = nums(g.ink.match(/id="tail" d="([^"]+)/)[1]);
        const [ox, oy, ex, ey] = nums(
          g.guide.match(/id="cap-diameter" d="([^"]+)/)[1],
        );
        const ux = Math.cos(((180 - cut) * Math.PI) / 180),
          uy = Math.sin(((180 - cut) * Math.PI) / 180);
        const ring = [
          ...g.guide.matchAll(/<circle cx="([^"]+)" cy="([^"]+)" r="([^"]+)"/g),
        ].at(-2);
        const cx = +ring[1],
          cy = +ring[2];
        close(ox, cx - r * ux);
        close(oy, cy - r * uy);
        close(sx, cx + r * ux);
        close(sy, cy + r * uy);
        close(ex, cx + (r + weight / 2) * ux);
        close(ey, cy + (r + weight / 2) * uy);
        close(cy + r + weight / 2, g.H);
        const local = [sx - weight / 2, sy - weight / 2];
        if (reference) local.forEach((v, i) => close(v, reference[i]));
        reference = local;
      }
    }
  }
}
