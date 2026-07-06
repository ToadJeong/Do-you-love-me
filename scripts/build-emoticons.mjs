// Generates the LuvNote chat emoticon packs: 8 character sets × 20 emotions.
// Animated sets embed CSS keyframe animations (work inside <img> in Chromium
// browsers and the Android WebView). Run: node scripts/build-emoticons.mjs
import { mkdirSync, writeFileSync } from "node:fs";

// ---------- character sets ----------
// body(): returns SVG for the character body. face is drawn at (120, cy).
const SETS = [
  { id: "harty",  name: "하트콩",   animated: true,  cy: 128, body: heartBody("#f2a5b5", "#e07c93") },
  { id: "bear",   name: "러비베어", animated: true,  cy: 128, body: bearBody("#e8c9a8", "#d9b28c") },
  { id: "bunny",  name: "토순이",   animated: true,  cy: 132, body: bunnyBody("#fdf3f5", "#f4b8c8") },
  { id: "mochi",  name: "콩떡",     animated: false, cy: 126, body: mochiBody("#fdf0dc", "#f2ddbd") },
  { id: "nyang",  name: "냥이",     animated: false, cy: 128, body: catBody("#d8d3ce", "#bdb6b0") },
  { id: "chick",  name: "삐약이",   animated: false, cy: 128, body: chickBody("#fde68a", "#f5c74c") },
  { id: "tofu",   name: "두부",     animated: false, cy: 124, body: tofuBody("#fbfaf6", "#e5e0d3") },
  { id: "berry",  name: "딸기",     animated: false, cy: 132, body: berryBody("#ef8296", "#d76c81") },
];

function heartBody(fill, line) {
  return `<path d="M120 208 C120 208 34 149 34 92 C34 60 57 40 82 40 C100 40 113 51 120 66 C127 51 140 40 158 40 C183 40 206 60 206 92 C206 149 120 208 120 208 Z" fill="${fill}" stroke="${line}" stroke-width="4"/>`;
}
function bearBody(fill, line) {
  return `<circle cx="66" cy="66" r="26" fill="${fill}" stroke="${line}" stroke-width="4"/><circle cx="174" cy="66" r="26" fill="${fill}" stroke="${line}" stroke-width="4"/><circle cx="66" cy="66" r="12" fill="${line}"/><circle cx="174" cy="66" r="12" fill="${line}"/><circle cx="120" cy="128" r="80" fill="${fill}" stroke="${line}" stroke-width="4"/><ellipse cx="120" cy="152" rx="26" ry="18" fill="#fff" opacity="0.65"/>`;
}
function bunnyBody(fill, inner) {
  return `<ellipse cx="88" cy="52" rx="20" ry="46" fill="${fill}" stroke="${inner}" stroke-width="4"/><ellipse cx="152" cy="52" rx="20" ry="46" fill="${fill}" stroke="${inner}" stroke-width="4"/><ellipse cx="88" cy="54" rx="9" ry="30" fill="${inner}"/><ellipse cx="152" cy="54" rx="9" ry="30" fill="${inner}"/><circle cx="120" cy="132" r="76" fill="${fill}" stroke="${inner}" stroke-width="4"/>`;
}
function mochiBody(fill, line) {
  return `<rect x="36" y="52" width="168" height="152" rx="72" fill="${fill}" stroke="${line}" stroke-width="4"/>`;
}
function catBody(fill, line) {
  return `<path d="M56 76 L48 32 L92 54 Z" fill="${fill}" stroke="${line}" stroke-width="4"/><path d="M184 76 L192 32 L148 54 Z" fill="${fill}" stroke="${line}" stroke-width="4"/><circle cx="120" cy="128" r="78" fill="${fill}" stroke="${line}" stroke-width="4"/><path d="M28 120 L64 126 M28 146 L64 142 M212 120 L176 126 M212 146 L176 142" stroke="${line}" stroke-width="3" stroke-linecap="round"/>`;
}
function chickBody(fill, line) {
  return `<circle cx="120" cy="130" r="78" fill="${fill}" stroke="${line}" stroke-width="4"/><path d="M116 44 C110 28 126 22 124 40 C136 28 146 40 128 48 Z" fill="${line}"/><path d="M108 128 L120 140 L132 128 L120 122 Z" fill="#f59e42"/>`;
}
function tofuBody(fill, line) {
  return `<rect x="40" y="56" width="160" height="144" rx="26" fill="${fill}" stroke="${line}" stroke-width="4"/><rect x="40" y="56" width="160" height="30" rx="15" fill="${line}" opacity="0.35"/>`;
}
function berryBody(fill, line) {
  return `<path d="M120 210 C70 190 40 150 44 106 C46 78 78 62 120 62 C162 62 194 78 196 106 C200 150 170 190 120 210 Z" fill="${fill}" stroke="${line}" stroke-width="4"/><path d="M96 52 C104 40 136 40 144 52 L132 64 L120 54 L108 64 Z" fill="#7fb069"/>${[76, 100, 140, 164].map((x) => `<ellipse cx="${x}" cy="${x % 2 ? 150 : 170}" rx="3.4" ry="5" fill="#fff" opacity="0.75"/>`).join("")}`;
}

// ---------- face primitives ----------
const INK = "#4a2b33";
const eyeArc = (x, y) => `<path d="M${x - 10} ${y + 3} Q${x} ${y - 8} ${x + 10} ${y + 3}" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
const eyeDot = (x, y) => `<circle cx="${x}" cy="${y}" r="6" fill="${INK}"/>`;
const eyeLine = (x, y) => `<path d="M${x - 10} ${y} L${x + 10} ${y}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
const eyeX = (x, y) => `<path d="M${x - 8} ${y - 8} L${x + 8} ${y + 8} M${x + 8} ${y - 8} L${x - 8} ${y + 8}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
const eyeBig = (x, y) => `<circle cx="${x}" cy="${y}" r="11" fill="#fff" stroke="${INK}" stroke-width="3.5"/><circle cx="${x}" cy="${y + 2}" r="5" fill="${INK}"/>`;
const eyeHeart = (x, y) => `<path d="M${x} ${y + 9} C${x} ${y + 9} ${x - 13} ${y} ${x - 13} ${y - 7} C${x - 13} ${y - 13} ${x - 7} ${y - 15} ${x - 3.5} ${y - 11} L${x} ${y - 8} L${x + 3.5} ${y - 11} C${x + 7} ${y - 15} ${x + 13} ${y - 13} ${x + 13} ${y - 7} C${x + 13} ${y} ${x} ${y + 9} ${x} ${y + 9} Z" fill="#e0426a"/>`;
const eyeStar = (x, y) => `<path d="M${x} ${y - 11} L${x + 3.2} ${y - 3.6} L${x + 11} ${y - 2.8} L${x + 5} ${y + 2.8} L${x + 6.8} ${y + 10.4} L${x} ${y + 6} L${x - 6.8} ${y + 10.4} L${x - 5} ${y + 2.8} L${x - 11} ${y - 2.8} L${x - 3.2} ${y - 3.6} Z" fill="#f5b433"/>`;
const mouthSmile = (y) => `<path d="M104 ${y} Q120 ${y + 14} 136 ${y}" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
const mouthOpen = (y) => `<path d="M102 ${y} Q120 ${y + 26} 138 ${y} Z" fill="${INK}"/><path d="M110 ${y + 12} Q120 ${y + 20} 130 ${y + 12}" fill="#f27d95"/>`;
const mouthFrown = (y) => `<path d="M104 ${y + 10} Q120 ${y - 4} 136 ${y + 10}" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
const mouthWave = (y) => `<path d="M102 ${y + 4} Q111 ${y - 4} 120 ${y + 4} Q129 ${y + 12} 138 ${y + 4}" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
const mouthO = (y) => `<ellipse cx="120" cy="${y + 5}" rx="9" ry="11" fill="${INK}"/>`;
const mouthFlat = (y) => `<path d="M110 ${y + 4} L130 ${y + 4}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
const blush = (cy, big = false) => `<ellipse cx="76" cy="${cy}" rx="${big ? 14 : 10}" ry="${big ? 9 : 6}" fill="#f78ca8" opacity="0.55"/><ellipse cx="164" cy="${cy}" rx="${big ? 14 : 10}" ry="${big ? 9 : 6}" fill="#f78ca8" opacity="0.55"/>`;
const heart = (x, y, s, cls = "") => `<path class="${cls}" d="M${x} ${y + 6 * s} C${x} ${y + 6 * s} ${x - 7 * s} ${y + 1 * s} ${x - 7 * s} ${y - 3 * s} C${x - 7 * s} ${y - 6.5 * s} ${x - 3.5 * s} ${y - 7.5 * s} ${x - 1.8 * s} ${y - 5.5 * s} L${x} ${y - 4 * s} L${x + 1.8 * s} ${y - 5.5 * s} C${x + 3.5 * s} ${y - 7.5 * s} ${x + 7 * s} ${y - 6.5 * s} ${x + 7 * s} ${y - 3 * s} C${x + 7 * s} ${y + 1 * s} ${x} ${y + 6 * s} ${x} ${y + 6 * s} Z" fill="#e0426a"/>`;
const tear = (x, y, cls = "") => `<path class="${cls}" d="M${x} ${y} C${x - 6} ${y + 10} ${x - 6} ${y + 16} ${x} ${y + 20} C${x + 6} ${y + 16} ${x + 6} ${y + 10} ${x} ${y} Z" fill="#7db8e8"/>`;
const txt = (x, y, s, t, color = INK, cls = "") => `<text class="${cls}" x="${x}" y="${y}" font-family="sans-serif" font-weight="bold" font-size="${s}" fill="${color}">${t}</text>`;

// ---------- 20 emotions ----------
// e/y = eye Y offset from cy(-18), m = mouth Y offset (+16)
const EMOTIONS = [
  { id: "love",      label: "사랑해",  anim: "bounce", face: (c) => eyeArc(94, c - 18) + eyeArc(146, c - 18) + mouthOpen(c + 12) + blush(c + 4) + heart(190, 54, 2.6, "fx") + heart(52, 74, 1.8, "fx2") },
  { id: "hearteyes", label: "심쿵",    anim: "pulse",  face: (c) => eyeHeart(94, c - 16) + eyeHeart(146, c - 16) + mouthOpen(c + 14) },
  { id: "wink",      label: "윙크",    anim: "bounce", face: (c) => eyeArc(94, c - 18) + eyeDot(146, c - 16) + mouthSmile(c + 16) + blush(c + 2) + heart(184, 66, 1.7, "fx") },
  { id: "happy",     label: "신나",    anim: "bounce", face: (c) => eyeArc(94, c - 18) + eyeArc(146, c - 18) + mouthOpen(c + 12) + blush(c + 6) },
  { id: "lol",       label: "ㅋㅋㅋ",  anim: "shake",  face: (c) => eyeX(94, c - 16) + eyeX(146, c - 16) + mouthOpen(c + 12) + txt(168, c - 34, 26, "ㅋㅋ", "#b0455c", "fx") },
  { id: "sad",       label: "슬퍼",    anim: "sway",   face: (c) => eyeDot(94, c - 14) + eyeDot(146, c - 14) + mouthFrown(c + 16) + tear(100, c - 4, "fx") },
  { id: "cry",       label: "엉엉",    anim: "shake",  face: (c) => `<path d="M84 ${c - 22} Q94 ${c - 14} 104 ${c - 22}" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M136 ${c - 22} Q146 ${c - 14} 156 ${c - 22}" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>` + mouthOpen(c + 12) + tear(94, c - 6, "fx") + tear(146, c - 6, "fx2") },
  { id: "angry",     label: "화나",    anim: "shake",  face: (c) => `<path d="M82 ${c - 30} L106 ${c - 20} M158 ${c - 30} L134 ${c - 20}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` + eyeDot(94, c - 12) + eyeDot(146, c - 12) + mouthWave(c + 16) + `<path class="fx" d="M186 ${c - 52} l10 -10 M192 ${c - 40} l14 -4 M178 ${c - 58} l4 -14" stroke="#e0426a" stroke-width="5" stroke-linecap="round"/>` },
  { id: "pout",      label: "삐짐",    anim: "sway",   face: (c) => eyeDot(94, c - 16) + eyeDot(146, c - 16) + mouthFlat(c + 14) + blush(c + 4, true) + txt(158, c + 40, 20, "흥", "#b0455c") },
  { id: "sleepy",    label: "졸려",    anim: "sway",   face: (c) => eyeLine(94, c - 14) + eyeLine(146, c - 14) + mouthO(c + 14) + txt(158, c - 40, 24, "Z", INK, "fx") + txt(178, c - 58, 18, "z", INK, "fx2") },
  { id: "surprised", label: "헉",      anim: "pulse",  face: (c) => eyeBig(94, c - 16) + eyeBig(146, c - 16) + mouthO(c + 14) + txt(182, c - 44, 34, "!", "#e0426a", "fx") },
  { id: "shy",       label: "부끄",    anim: "sway",   face: (c) => eyeArc(94, c - 18) + eyeArc(146, c - 18) + mouthSmile(c + 14) + blush(c + 4, true) + `<circle cx="72" cy="${c + 22}" r="12" fill="#fff" opacity="0.5"/><circle cx="168" cy="${c + 22}" r="12" fill="#fff" opacity="0.5"/>` },
  { id: "tongue",    label: "메롱",    anim: "bounce", face: (c) => eyeArc(94, c - 18) + eyeX(146, c - 16) + `<path d="M104 ${c + 12} Q120 ${c + 22} 136 ${c + 12}" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/><path class="fx" d="M114 ${c + 16} Q120 ${c + 40} 128 ${c + 16} Z" fill="#f27d95" stroke="#d76c81" stroke-width="2"/>` },
  { id: "ok",        label: "오케이",  anim: "bounce", face: (c) => eyeArc(94, c - 18) + eyeArc(146, c - 18) + mouthSmile(c + 16) + `<circle class="fx" cx="188" cy="${c + 34}" r="22" fill="#fff" stroke="#7fb069" stroke-width="4"/>` + txt(175, c + 41, 18, "OK", "#7fb069", "fx") },
  { id: "good",      label: "최고",    anim: "bounce", face: (c) => eyeArc(94, c - 18) + eyeArc(146, c - 18) + mouthOpen(c + 12) + `<g class="fx"><rect x="176" y="${c + 24}" width="16" height="24" rx="6" fill="${INK}"/><circle cx="196" cy="${c + 22}" r="10" fill="${INK}"/></g>` },
  { id: "clap",      label: "짝짝",    anim: "pulse",  face: (c) => eyeArc(94, c - 18) + eyeArc(146, c - 18) + mouthOpen(c + 12) + `<ellipse class="fx" cx="52" cy="${c + 44}" rx="13" ry="17" fill="#f2a5b5"/><ellipse class="fx2" cx="188" cy="${c + 44}" rx="13" ry="17" fill="#f2a5b5"/><path d="M34 ${c + 26} l-8 -8 M206 ${c + 26} l8 -8 M30 ${c + 46} l-11 0 M210 ${c + 46} l11 0" stroke="#e0a63f" stroke-width="4" stroke-linecap="round"/>` },
  { id: "hungry",    label: "배고파",  anim: "sway",   face: (c) => eyeDot(94, c - 16) + eyeDot(146, c - 16) + `<path d="M104 ${c + 10} Q120 ${c + 24} 136 ${c + 10}" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>` + tear(138, c + 16, "fx") + txt(56, c - 44, 20, "밥…", "#b0455c") },
  { id: "sick",      label: "아파",    anim: "sway",   face: (c) => eyeX(94, c - 16) + eyeX(146, c - 16) + mouthWave(c + 16) + `<rect x="86" y="${c - 58}" width="68" height="20" rx="10" fill="#fff" stroke="#7db8e8" stroke-width="3"/><path d="M96 ${c - 48} h48" stroke="#7db8e8" stroke-width="3" stroke-dasharray="5 5"/>` + tear(170, c - 24, "fx") },
  { id: "party",     label: "축하해",  anim: "pulse",  face: (c) => eyeStar(94, c - 16) + eyeStar(146, c - 16) + mouthOpen(c + 12) + `<g class="fx">${[[48, 56, "#f5b433"], [66, 40, "#7fb069"], [186, 44, "#7db8e8"], [200, 64, "#e0426a"]].map(([x, y, col]) => `<circle cx="${x}" cy="${y}" r="5" fill="${col}"/>`).join("")}</g><path d="M112 30 L136 22 L128 46 Z" fill="#e0426a"/>` },
  { id: "kiss",      label: "뽀뽀",    anim: "bounce", face: (c) => eyeArc(94, c - 18) + eyeLine(146, c - 14) + heart(120, c + 16, 1.6) + blush(c + 2) + heart(186, c - 30, 2.2, "fx") },
];

// ---------- animations (animated sets only) ----------
const ANIM_CSS = {
  bounce: "@keyframes m{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}.c{animation:m 1.1s ease-in-out infinite}",
  pulse: "@keyframes m{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}.c{animation:m 0.9s ease-in-out infinite;transform-origin:120px 130px}",
  shake: "@keyframes m{0%,100%{transform:translateX(0)}25%{transform:translateX(-7px)}75%{transform:translateX(7px)}}.c{animation:m 0.5s linear infinite}",
  sway: "@keyframes m{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}.c{animation:m 1.6s ease-in-out infinite;transform-origin:120px 200px}",
};
const FX_CSS =
  "@keyframes f{0%{opacity:0;transform:translateY(6px)}30%{opacity:1}100%{opacity:0;transform:translateY(-14px)}}.fx{animation:f 1.4s ease-out infinite}.fx2{animation:f 1.4s ease-out 0.5s infinite}";

// ---------- generate ----------
let count = 0;
for (const set of SETS) {
  mkdirSync(`public/emoticons/${set.id}`, { recursive: true });
  for (const emo of EMOTIONS) {
    const style = set.animated
      ? `<style>${ANIM_CSS[emo.anim]}${FX_CSS}</style>`
      : "";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">${style}<g class="c">${set.body}${emo.face(set.cy)}</g></svg>`;
    writeFileSync(`public/emoticons/${set.id}/${emo.id}.svg`, svg);
    count++;
  }
}

// manifest for the picker UI
const manifest = `// AUTO-GENERATED by scripts/build-emoticons.mjs — do not edit by hand.
export const EMOTICON_SETS = ${JSON.stringify(
  SETS.map((s) => ({ id: s.id, name: s.name, animated: s.animated })),
)} as const;

export const EMOTICON_EMOTIONS = ${JSON.stringify(
  EMOTIONS.map((e) => ({ id: e.id, label: e.label })),
)} as const;

export function emoticonSrc(setId: string, emoId: string): string {
  return \`/emoticons/\${setId}/\${emoId}.svg\`;
}

/** Matches a message that is exactly one emoticon: [[emo:set:id]] */
export const EMO_RE = /^\\[\\[emo:([a-z]+):([a-z]+)\\]\\]$/;
`;
writeFileSync("src/data/emoticons.ts", manifest);
console.log(`generated ${count} emoticons (${SETS.length} sets × ${EMOTIONS.length})`);
