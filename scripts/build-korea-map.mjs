// Converts the KOSTAT 2018 municipalities TopoJSON into precomputed SVG path
// data (src/data/korea-map.json) so the runtime needs no geo libraries.
// Usage: node scripts/build-korea-map.mjs <path-to-topojson>
import { readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";
import { geoMercator, geoPath } from "d3-geo";

const src = process.argv[2];
if (!src) {
  console.error("usage: node scripts/build-korea-map.mjs <topojson>");
  process.exit(1);
}

const topo = JSON.parse(readFileSync(src, "utf8"));
const objName = Object.keys(topo.objects)[0];
const geo = feature(topo, topo.objects[objName]);

const WIDTH = 800;
const HEIGHT = 1160;
const projection = geoMercator().fitSize([WIDTH, HEIGHT], geo);
const path = geoPath(projection).digits(1);

const regions = geo.features.map((f) => {
  const p = f.properties;
  const code = String(p.code ?? p.CODE ?? p.adm_cd ?? "");
  const name = String(p.name ?? p.NAME ?? "");
  // Province from the code prefix (KOSTAT: first 2 digits = 시도)
  const sido = code.slice(0, 2);
  const [cx, cy] = path.centroid(f).map((v) => Math.round(v * 10) / 10);
  return { code, name, sido, d: path(f), cx, cy };
});

writeFileSync(
  "src/data/korea-map.json",
  JSON.stringify({ width: WIDTH, height: HEIGHT, regions }),
);
console.log(`regions: ${regions.length}`);
console.log(
  "seoul districts:",
  regions.filter((r) => r.sido === "11").length,
);
