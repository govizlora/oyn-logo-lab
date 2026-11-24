// Centerline geometry: true circular cores and optional G2 Bézier transitions.
((root) => {
  const rad = Math.PI / 180,
    unit = (d) => [Math.cos(d * rad), Math.sin(d * rad)];
  const add = (a, b, k = 1) => [a[0] + k * b[0], a[1] + k * b[1]],
    fmt = (p) => p.map((x) => x.toFixed(6)).join(" ");
  // Circle -> straight; reverse these same controls for straight -> circle.
  // Equal handles k give curvature sign*2*sin(beta)/(3*k) at the circle
  // and zero at the collinear end. Reach is the control polygon length 3*k.
  function release(center, r, d, sign, reach, limit) {
    const k = Math.min(reach, 2 * r * Math.sin(limit * rad)) / 3;
    const beta = Math.asin((1.5 * k) / r) / rad,
      t = d - sign * beta;
    const a = add(center, unit(t + 90), -sign * r),
      b = add(a, unit(t), k);
    const c = add(b, unit(d), k);
    return [a, b, c, add(c, unit(d), k)];
  }
  const cubic = (a, b, c) => " C" + fmt(a) + " " + fmt(b) + " " + fmt(c);
  function bend(d, e, r, reach) {
    const sign = Math.sign(e - d),
      limit = Math.min(30, Math.abs(e - d) * 0.32);
    const entry = release([0, 0], r, d + 180, -sign, reach, limit);
    const exit = release([0, 0], r, e, sign, reach, limit);
    const center = entry[3].map((x) => -x),
      last = add(center, exit[3]);
    function draw(origin) {
      const c = add(origin, center),
        at = (p) => add(c, p);
      return (
        (reach ? cubic(at(entry[2]), at(entry[1]), at(entry[0])) : "") +
        " A" +
        r +
        " " +
        r +
        " 0 0 " +
        (sign > 0 ? 1 : 0) +
        " " +
        fmt(at(exit[0])) +
        (reach ? cubic(at(exit[1]), at(exit[2]), at(exit[3])) : "")
      );
    }
    // These turns all cross a horizontal tangent within their circular core.
    const extremum = center[1] - sign * r;
    return {
      center,
      last,
      draw,
      min: Math.min(0, last[1], extremum),
      max: Math.max(0, last[1], extremum),
    };
  }
  function make(mode, p) {
    const { angle, weight, o, shoulder, bowl, n, cut, blend } = p,
      h = weight / 2,
      H = 2 * (o + h),
      bottom = H - h,
      C = H / 2;
    const hook = mode === "parallel" ? bowl : p.hook;
    const up = angle - 90,
      down = mode === "parallel" ? 90 + angle : 90 - angle,
      v = unit(up);
    const oExit = release([C, C], o, up, -1, blend, 30),
      origin = oExit[3];
    const lengths = [];
    const turn = (from, d, arc, bound, low = false) => {
      const dir = unit(d),
        run = (bound - (low ? arc.max : arc.min) - from[1]) / dir[1];
      const start = add(from, dir, run);
      lengths.push(run);
      return {
        path: "L" + fmt(start) + " " + arc.draw(start),
        start,
        end: add(start, arc.last),
        center: add(start, arc.center),
      };
    };
    const left = turn(origin, up, bend(up, down, shoulder, blend), h);
    const cup = turn(
      left.end,
      down,
      bend(down, up, bowl, blend),
      h + o * (mode === "parallel" ? 1.12 : 195 / 175),
      true,
    );
    const head = turn(cup.end, up, bend(up, 90, shoulder, blend), h);
    // A free terminal has no incoming straight: cut the circle itself, not a
    // curvature ramp. The circle and its exit are independent of the cut angle.
    const hookExit = release([0, 0], hook, up, -1, blend, 30),
      exitOffset = hookExit[3];
    const cy = bottom - hook,
      ey = cy + exitOffset[1];
    const hookEnd = add(cup.end, v, (ey - cup.end[1]) / v[1]);
    const hookCenter = [hookEnd[0] - exitOffset[0], cy],
      radial = unit(180 - cut);
    const start = add(hookCenter, radial, hook),
      atHook = (p) => add(hookCenter, p);
    const tail =
      "M" +
      fmt(start) +
      " A" +
      hook +
      " " +
      hook +
      " 0 0 0 " +
      fmt(atHook(hookExit[0])) +
      (blend ? cubic(atHook(hookExit[1]), atHook(hookExit[2]), hookEnd) : "") +
      " L" +
      fmt(cup.end);
    const nArc = bend(-90, 90, n, blend),
      stem = head.end[0],
      arch = h - nArc.min;
    const nOrigin = [stem, arch],
      rightStem = stem + nArc.last[0],
      W = rightStem + h;
    lengths.push(arch - head.end[1], (cup.end[1] - ey) / v[1]);
    const safe =
      arch < H &&
      h < Math.min(shoulder, bowl, hook, n, o) &&
      Math.min(...lengths) > 0 &&
      start[0] - C > 0 &&
      Math.hypot(start[0] - C, start[1] - C) > o + weight + 3;
    const paths = {
      branches:
        "M" +
        fmt(oExit[0]) +
        (blend ? cubic(oExit[1], oExit[2], origin) : "") +
        left.path +
        cup.path,
      tail,
      joint: "M" + fmt(cup.end) + head.path + " V" + arch,
      n: "M" + stem + " " + H + " V" + arch + nArc.draw(nOrigin) + " V" + H,
    };
    const ink =
      '<g fill="none" stroke-width="' +
      weight +
      '" stroke-linecap="butt" stroke-linejoin="round"><circle id="o" cx="' +
      C +
      '" cy="' +
      C +
      '" r="' +
      o +
      '"/>' +
      Object.entries(paths)
        .map(([id, d]) => '<path id="' + id + '" d="' + d + '"/>')
        .join("") +
      "</g>";
    const line = (a, b) => "M" + fmt(a) + " L" + fmt(b);
    // Guides use the solved geometry. Each pair is offset along the normal,
    // so its perpendicular separation is the stroke width, even at high lean.
    const pair = (point, d) => {
      const normal = unit(d + 90),
        dir = unit(d);
      return [-h, h]
        .map((k) => {
          const edge = add(point, normal, k);
          const at = (y) => add(edge, dir, (y - edge[1]) / dir[1]);
          return line(at(-10), at(H + 10));
        })
        .join(" ");
    };
    const rails = [
      pair(origin, up),
      pair(left.end, down),
      pair(cup.end, up),
      ...[stem - h, stem + h, rightStem - h, rightStem + h].map((x) =>
        line([x, arch - 24], [x, H + 12]),
      ),
    ].join(" ");
    const levels = [0, H].map((y) => line([-15, y], [W + 15, y])).join(" ");
    const circle = (c, r) =>
      '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + r + '"/>';
    const circles = [
      [[C, C], o],
      [left.center, shoulder],
      [cup.center, bowl],
      [head.center, shoulder],
      [hookCenter, hook],
      [add(nOrigin, nArc.center), n],
    ];
    const centers = circles
      .map(
        ([c]) =>
          line(add(c, [-6, 0]), add(c, [6, 0])) +
          " " +
          line(add(c, [0, -6]), add(c, [0, 6])),
      )
      .join(" ");
    // Across the hook and out towards the y fork. The solid segment covers the
    // whole construction circle; only the sightline beyond the circle is dashed.
    const opposite = add(hookCenter, radial, -hook);
    const reach =
      (hookCenter[0] - cup.end[0]) * radial[0] +
      (hookCenter[1] - cup.end[1]) * radial[1];
    const sightline =
      reach > hook
        ? '<path d="' +
          line(opposite, add(hookCenter, radial, -reach)) +
          '" stroke-dasharray="3 4"/>'
        : "";
    const guide =
      '<g id="construction" aria-hidden="true" fill="none" stroke="#777" stroke-width="1.25">' +
      '<path stroke="#999" d="' +
      levels +
      " " +
      line([0, C], [2 * C, C]) +
      " " +
      line([stem - h - 12, h + n], [W + 12, h + n]) +
      '"/>' +
      '<path id="cap-diameter" d="' +
      line(opposite, add(start, radial, h)) +
      '"/><path d="' +
      rails +
      '"/>' +
      sightline +
      circle(cup.end, 3) +
      circles.map(([c, r]) => circle(c, r)).join("") +
      '<path d="' +
      centers +
      '" stroke-width="1"/></g>';
    return { W, H, ink, guide, safe };
  }
  root.OYN = { make };
})(typeof module === "object" ? module.exports : window);
