(() => {
  const mode = document.documentElement.dataset.study,
    para = mode === "parallel";
  const defaults = para
    ? {
        blend: 32,
        angle: 17,
        weight: 35,
        o: 175,
        shoulder: 47,
        bowl: 64,
        n: 135,
        cut: 18,
      }
    : {
        blend: 32,
        angle: 20,
        weight: 64,
        o: 192,
        shoulder: 77,
        bowl: 77,
        hook: 93,
        n: 140,
        cut: 19,
      };
  const sections = [
    [
      "Structure",
      [
        ["angle", "Branch angle", 1, 55, "°"],
        ["weight", "Stroke width", 4, 88, "u"],
        ["blend", "Curvature blend reach", 0, 100, "u"],
      ],
    ],
    [
      "Centerline radii",
      [
        ["o", "o · Circle", 100, 340, "u"],
        ["shoulder", "y · Shoulders (left + right)", 8, 145, "u"],
        ["bowl", para ? "y · Bowl + hook" : "y · Bowl", 24, 145, "u"],
        ...(para ? [] : [["hook", "y · Hook", 24, 155, "u"]]),
        ["n", "n · Arch", 55, 285, "u"],
      ],
    ],
    ["Terminal", [["cut", "Cut angle", 0, 55, "°"]]],
  ];
  const fields = sections.flatMap((s) => s[1]),
    $ = (sel) => document.querySelector(sel);
  const step = (id) => (id === "cut" ? 0.01 : 1);
  const valid = (id, x, min, max) =>
    x >= min &&
    x <= max &&
    Math.abs(x / step(id) - Math.round(x / step(id))) < 1e-9;
  const slug = para ? "P" : "M",
    key = "oyn-lab-v1-" + slug;
  const qs = new URLSearchParams(location.search);
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(key) || "{}") || {};
  } catch {}
  let p = { ...defaults },
    guides = qs.has("g") ? qs.get("g") === "1" : false;
  for (const [id, , min, max] of fields) {
    const raw = qs.has(id) ? qs.get(id) : qs.size ? undefined : saved[id];
    const x = Number(raw);
    if (raw !== undefined && valid(id, x, min, max)) p[id] = x;
  }
  if (!OYN.make(mode, p).safe) p = { ...defaults };
  document.getElementById("app").innerHTML =
    `<div class="wrap"><header><a class="brand" href="/">OYN / Logo Lab</a><nav class="site-links" aria-label="Project and author"><a href="https://github.com/govizlora/oyn-logo-lab">Source</a><a href="https://github.com/govizlora">GitHub</a><a href="https://x.com/Govizlora">X</a></nav></header><div class="lead"><h1>${para ? "Parallel" : "Mirror"}</h1><nav class="modes" aria-label="Letterform studies"><a href="/" ${para ? "" : 'aria-current="page"'}>Mirror</a><a href="/parallel.html" ${para ? 'aria-current="page"' : ""}>Parallel</a></nav></div>
<div class="layout"><div class="art"><section class="stage"><div class="stagehead"><strong>Pen study</strong><label class="toggle"><input id="guides" type="checkbox">Construction lines</label></div><div class="viewport" id="viewport"></div><div class="stagefoot"><span id="stats"></span><span>Solid black</span></div></section><section class="thumbproof" aria-label="Thumbnail preview"><div class="thumbmeta"><h2>Thumbnail</h2><label for="thumb-size">Preview size</label><select id="thumb-size"><option value="48">48 × 48 px</option><option value="128" selected>128 × 128 px</option><option value="256">256 × 256 px</option></select></div><svg id="thumb" width="128" height="128" role="img" aria-label="OYN thumbnail"><svg id="thumb-art" x="10%" y="10%" width="80%" height="80%" preserveAspectRatio="xMidYMid meet"><use href="#live-ink"/></svg></svg></section><p class="note">${para ? "Both branches lean in the same direction. The left stroke descends, the right stroke rises, and their centerlines stay parallel as the bowl joins them." : "The two branches mirror each other across a vertical axis. Change the angle to open or close the diamond; the stroke leaving the o stays tangent to its circle."}</p><p class="note">Blend reach controls all straight-to-circle transitions. Zero keeps a direct tangent; positive values ease the curvature over a longer distance, limited by the available turn.</p><div class="tools"><button class="primary" id="save">Export black SVG</button><button class="plain" id="reset">Reset</button></div><p class="notice" id="notice" role="status"></p></div>
<aside class="panel"><div class="panelhead"><h2>Parameters</h2><span class="count">u = design units</span></div>${sections.map(([name, items]) => '<h3 class="group">' + name + "</h3>" + items.map(([id, label, min, max, u]) => `<div class="setting"><label for="s-${id}">${label}</label><span class="number"><input aria-label="${label} value" id="v-${id}" type="number" min="${min}" max="${max}" step="${step(id)}">${u}</span><input data-key="${id}" type="range" id="s-${id}" min="${min}" max="${max}" step="${step(id)}"></div>`).join("")).join("")}</aside></div></div>`;
  let shape;
  const svg = (g, pad) =>
    `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="OYN ${para ? "parallel" : "mirrored"} wordmark" viewBox="${-pad} ${-pad} ${(shape.W + 2 * pad).toFixed(3)} ${(shape.H + 2 * pad).toFixed(3)}"><g stroke="#000">${shape.ink}</g>${g ? shape.guide : ""}</svg>`;
  function render() {
    shape = OYN.make(mode, p);
    $("#viewport").innerHTML = svg(guides, 24);
    // Reference the main ink layer, never its guides or a separately calculated logo.
    $("#viewport svg > g").id = "live-ink";
    $("#thumb-art").setAttribute("viewBox", "0 0 " + shape.W + " " + shape.H);
    $("#guides").checked = guides;
    $("#stats").textContent = p.weight + " u stroke / " + p.angle + "° lean";
    for (const [id] of fields) {
      $("#s-" + id).value = p[id];
      $("#v-" + id).value = p[id];
    }
  }
  function sync() {
    try {
      localStorage.setItem(key, JSON.stringify(p));
      const q = new URLSearchParams(p);
      if (guides) q.set("g", "1");
      history.replaceState(null, "", "?" + q);
    } catch {}
  }
  function change(id, val, min, max) {
    let x = Number(val);
    if (val === "" || !valid(id, x, min, max)) {
      render();
      $("#notice").textContent =
        "Enter a value from " +
        min +
        " to " +
        max +
        " in steps of " +
        step(id) +
        ".";
      return;
    }
    const next = { ...p, [id]: x };
    if (!OYN.make(mode, next).safe) {
      render();
      $("#notice").textContent =
        "This combination would reverse a tangent or bring the hook too close to the o. The last valid setting is still active.";
      return;
    }
    p = next;
    render();
    sync();
    $("#notice").textContent = "";
  }
  for (const [id, , lo, hi] of fields) {
    $("#s-" + id).oninput = (e) => change(id, e.target.value, lo, hi);
    $("#v-" + id).onchange = (e) => change(id, e.target.value, lo, hi);
  }
  $("#thumb-size").onchange = (e) => {
    const size = e.target.value;
    $("#thumb").setAttribute("width", size);
    $("#thumb").setAttribute("height", size);
  };
  $("#guides").onchange = (e) => {
    guides = e.target.checked;
    render();
    sync();
  };
  $("#reset").onclick = () => {
    p = { ...defaults };
    guides = false;
    render();
    sync();
    $("#notice").textContent = "Defaults restored for this study.";
  };
  $("#save").onclick = () => {
    const url = URL.createObjectURL(
        new Blob([svg(false, 0)], { type: "image/svg+xml" }),
      ),
      a = document.createElement("a");
    a.href = url;
    a.download = "OYN-" + mode + "-" + p.weight + "u.svg";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $("#notice").textContent = "SVG exported without construction lines.";
  };
  render();
})();
