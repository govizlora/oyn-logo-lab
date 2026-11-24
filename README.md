# OYN Logo Lab

A small parametric drawing tool for one three-letter wordmark, not a font file.
[Try the live lab](https://logo.oyn.dev/).

Drag a slider to change a radius, a stroke width, or the angle of the y. In **Mirror**, the two branches lean toward each other. In **Parallel**, they lean in the same direction. Turn on **Construction lines** to see the circles, tangents, and terminal cut that produce the mark.

## Start here

- [Geometry](public/geometry.js) — the drawing algorithm. `OYN.make(mode, parameters)` solves the centerlines and returns the SVG ink, construction guides, bounds, and a validity flag. The cubic transitions match the tangent and curvature of the adjoining circular and straight segments.
- [Interface](public/lab.js) — the default parameters and sliders. The thumbnail and SVG export use the same geometry as the main drawing.
- [Regression tests](tests/) — the radial hook terminal and curvature at line–arc joins.

## Run locally

There is no install or build step. From the repository root:

```sh
python3 -m http.server 8000 --directory public
```

Open http://localhost:8000/ for Mirror, or http://localhost:8000/parallel.html for Parallel.

To run the geometry tests with Node.js:

```sh
node tests/hook.cjs && node tests/blend.cjs
```

## License

The source code is available under the [MIT License](LICENSE). This license does not grant rights to the OYN name or logo as brand identifiers.

Made by [Govizlora](https://github.com/govizlora) · [X](https://x.com/Govizlora)
