"use client";

import { useEffect, useRef, useState } from "react";
import {
  EMOTICON_SETS,
  EMOTICON_EMOTIONS,
  emoticonSrc,
  EMO_RE,
} from "@/data/emoticons";
import type { Message } from "@/lib/types";

/* ============================= emoticons ============================= */

export function EmoticonPicker({ onPick }: { onPick: (content: string) => void }) {
  const [setId, setSetId] = useState<string>(EMOTICON_SETS[0].id);

  return (
    <div className="border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex gap-1 overflow-x-auto px-3 pt-2">
        {EMOTICON_SETS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSetId(s.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${
              setId === s.id
                ? "bg-love text-white"
                : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800"
            }`}
          >
            {s.name}
            {s.animated && " ✨"}
          </button>
        ))}
      </div>
      <div className="grid max-h-56 grid-cols-5 gap-1 overflow-y-auto p-3">
        {EMOTICON_EMOTIONS.map((e) => (
          <button
            key={e.id}
            type="button"
            title={e.label}
            onClick={() => onPick(`[[emo:${setId}:${e.id}]]`)}
            className="rounded-xl p-1 transition hover:bg-blush active:scale-95"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={emoticonSrc(setId, e.id)} alt={e.label} className="h-14 w-14" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* =============================== games =============================== */

const BALANCE_QUESTIONS: [string, string, string][] = [
  ["평생 한 가지만 먹기", "치킨", "피자"],
  ["여행 간다면", "산", "바다"],
  ["데이트는", "집콕", "밖으로"],
  ["더 싫은 것", "더위", "추위"],
  ["초능력을 고른다면", "투명인간", "순간이동"],
  ["아침엔", "밥", "빵"],
  ["연락은", "전화", "문자"],
  ["영화 볼 때", "집에서", "영화관"],
  ["기념일 선물", "서프라이즈", "같이 고르기"],
  ["더 설레는 말", "보고싶어", "사랑해"],
  ["노후엔", "도시", "시골"],
  ["둘 중 하나만", "주말 늦잠", "주말 여행"],
];

export const GAME_RES = {
  rps: /^\[\[game:rps:([a-z0-9-]+)\]\]$/,
  rpsm: /^\[\[game:rpsm:([a-z0-9-]+):(rock|paper|scissors)\]\]$/,
  dice: /^\[\[game:dice:([1-6])\]\]$/,
  bal: /^\[\[game:bal:([a-z0-9-]+):(.+)\|(.+)\|(.+)\]\]$/,
  bala: /^\[\[game:bala:([a-z0-9-]+):(A|B)\]\]$/,
  timer: /^\[\[game:timer:([a-z0-9-]+)\]\]$/,
  timerr: /^\[\[game:timerr:([a-z0-9-]+):(\d+)\]\]$/,
  ladder: /^\[\[game:ladder:([a-z0-9-]+):(.+)\]\]$/,
  ladderp: /^\[\[game:ladderp:([a-z0-9-]+):([1-4])\]\]$/,
  pick: /^\[\[game:pick:(나|상대):(.+)\]\]$/,
};

const PENALTIES = [
  "설거지 담당",
  "커피 사기",
  "5분 마사지 해주기",
  "소원 하나 들어주기",
  "저녁 메뉴 정하기 포기",
  "애교 한 번 부리기",
  "다음 데이트 코스 짜기",
  "아이스크림 사기",
];
const penalty = () => PENALTIES[Math.floor(Math.random() * PENALTIES.length)];

/** Deterministic 1-4 from a game id — neither player controls the outcome. */
function losingLine(gameId: string): number {
  let h = 0;
  for (const ch of gameId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (h % 4) + 1;
}

export function randomDice(): string {
  return `[[game:dice:${1 + Math.floor(Math.random() * 6)}]]`;
}
export function newRps(): string {
  return `[[game:rps:${crypto.randomUUID().slice(0, 8)}]]`;
}
export function newBalance(): string {
  const [q, a, b] =
    BALANCE_QUESTIONS[Math.floor(Math.random() * BALANCE_QUESTIONS.length)];
  return `[[game:bal:${crypto.randomUUID().slice(0, 8)}:${q}|${a}|${b}]]`;
}

export function GameMenu({ onSend }: { onSend: (content: string) => void }) {
  const gid = () => crypto.randomUUID().slice(0, 8);
  const items = [
    { label: "가위바위보 ✊", make: newRps },
    { label: "주사위 🎲", make: randomDice },
    { label: "밸런스게임 ⚖️", make: newBalance },
    { label: "10초 맞추기 ⏱️", make: () => `[[game:timer:${gid()}]]` },
    { label: "사다리 타기 🪜", make: () => `[[game:ladder:${gid()}:${penalty()}]]` },
    {
      label: "복불복 뽑기 🎰",
      make: () =>
        `[[game:pick:${Math.random() < 0.5 ? "나" : "상대"}:${penalty()}]]`,
    },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 border-t border-neutral-200 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900">
      {items.map((g) => (
        <button
          key={g.label}
          type="button"
          onClick={() => onSend(g.make())}
          className="rounded-xl bg-blush py-2.5 text-[13px] font-medium text-love transition active:scale-95 dark:bg-love/15"
        >
          {g.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- 10초 맞추기 (timer stops being visible after 3s) ---------- */

function TimerCard({
  gameId,
  myId,
  all,
  onSend,
}: {
  gameId: string;
  myId: string;
  all: Message[];
  onSend: (content: string) => void;
}) {
  const [startAt, setStartAt] = useState<number | null>(null);
  const [shown, setShown] = useState("0.00");
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear the ticking interval on stop/unmount.
  useEffect(() => {
    return () => {
      if (ivRef.current) clearInterval(ivRef.current);
    };
  }, []);

  const results = all
    .map((m) => ({ m, match: m.content.match(GAME_RES.timerr) }))
    .filter((x) => x.match && x.match[1] === gameId)
    .map((x) => ({ sender: x.m.sender_id, ms: Number(x.match![2]) }));
  const mine = results.find((r) => r.sender === myId);
  const theirs = results.find((r) => r.sender !== myId);

  function start() {
    const t0 = Date.now();
    setStartAt(t0);
    ivRef.current = setInterval(() => {
      const el = Date.now() - t0;
      // classic rule: the clock hides after 3s — feel the remaining 7s!
      setShown(el < 3000 ? (el / 1000).toFixed(2) : "?.??");
    }, 50);
  }

  function stop() {
    if (startAt == null) return;
    if (ivRef.current) clearInterval(ivRef.current);
    const ms = Date.now() - startAt;
    setStartAt(null);
    onSend(`[[game:timerr:${gameId}:${ms}]]`);
  }

  const fmt = (ms: number) => `${(ms / 1000).toFixed(2)}초`;
  const diff = (ms: number) => Math.abs(ms - 10000);

  return (
    <div className="rounded-2xl border border-beige bg-white p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900">
      <p className="mb-2 font-semibold">⏱️ 10초 맞추기</p>
      <p className="mb-2 text-xs text-neutral-400">
        시작 후 감으로 정확히 10초에 멈추세요! (3초 뒤 시계가 숨겨져요)
      </p>
      {!mine ? (
        startAt == null ? (
          <button
            type="button"
            onClick={start}
            className="w-full rounded-xl bg-love py-2.5 font-medium text-white transition active:scale-95"
          >
            시작!
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="w-full rounded-xl bg-plum py-2.5 font-medium text-white transition active:scale-95"
          >
            멈춰!! <span className="tabular-nums">{shown}</span>
          </button>
        )
      ) : (
        <p>
          나: <b className="tabular-nums">{fmt(mine.ms)}</b>
          {theirs ? (
            <>
              {" "}
              / 상대: <b className="tabular-nums">{fmt(theirs.ms)}</b> —{" "}
              <span className="font-bold text-love">
                {diff(mine.ms) === diff(theirs.ms)
                  ? "무승부!"
                  : diff(mine.ms) < diff(theirs.ms)
                    ? "내가 승리! 🎉"
                    : "상대 승리!"}
              </span>
            </>
          ) : (
            <span className="text-neutral-400"> / 상대 기다리는 중…</span>
          )}
        </p>
      )}
    </div>
  );
}

/* ---------- message body renderer (emoticon / game / text) ---------- */

const RPS_EMOJI = { rock: "✊", paper: "✋", scissors: "✌️" } as const;
type RpsMove = keyof typeof RPS_EMOJI;

function rpsWinner(a: RpsMove, b: RpsMove): 0 | 1 | 2 {
  if (a === b) return 0;
  const beats: Record<RpsMove, RpsMove> = {
    rock: "scissors",
    paper: "rock",
    scissors: "paper",
  };
  return beats[a] === b ? 1 : 2;
}

const card =
  "rounded-2xl border border-beige bg-white p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900";

export function MessageBody({
  message,
  myId,
  all,
  onSend,
}: {
  message: Message;
  myId: string;
  all: Message[];
  onSend: (content: string) => void;
}) {
  const c = message.content;
  const mine = message.sender_id === myId;

  // --- emoticon ---
  const emo = c.match(EMO_RE);
  if (emo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={emoticonSrc(emo[1], emo[2])} alt="이모티콘" className="h-28 w-28" />
    );
  }

  // --- dice ---
  const dice = c.match(GAME_RES.dice);
  if (dice) {
    return (
      <div className={card}>
        🎲 주사위 결과: <span className="text-lg font-bold text-love">{dice[1]}</span>
      </div>
    );
  }

  // --- rock paper scissors invite ---
  const rps = c.match(GAME_RES.rps);
  if (rps) {
    const gameId = rps[1];
    const moves = all
      .map((m) => ({ m, match: m.content.match(GAME_RES.rpsm) }))
      .filter((x) => x.match && x.match[1] === gameId)
      .map((x) => ({ sender: x.m.sender_id, move: x.match![2] as RpsMove }));
    const myMove = moves.find((m) => m.sender === myId);
    const theirMove = moves.find((m) => m.sender !== myId);

    return (
      <div className={card}>
        <p className="mb-2 font-semibold">가위바위보! ✊✋✌️</p>
        {!myMove ? (
          <div className="flex gap-2">
            {(Object.keys(RPS_EMOJI) as RpsMove[]).map((mv) => (
              <button
                key={mv}
                type="button"
                onClick={() => onSend(`[[game:rpsm:${gameId}:${mv}]]`)}
                className="flex-1 rounded-xl bg-blush py-2 text-xl transition active:scale-90 dark:bg-love/15"
              >
                {RPS_EMOJI[mv]}
              </button>
            ))}
          </div>
        ) : !theirMove ? (
          <p className="text-neutral-400">상대방을 기다리는 중… (나: 선택 완료)</p>
        ) : (
          (() => {
            const r = rpsWinner(myMove.move, theirMove.move);
            return (
              <p>
                나 {RPS_EMOJI[myMove.move]} vs {RPS_EMOJI[theirMove.move]} 상대 →{" "}
                <span className="font-bold text-love">
                  {r === 0 ? "무승부!" : r === 1 ? "내가 승리! 🎉" : "상대 승리!"}
                </span>
              </p>
            );
          })()
        )}
      </div>
    );
  }

  // --- rps move (rendered small, move hidden until both are in) ---
  const rpsm = c.match(GAME_RES.rpsm);
  if (rpsm) {
    return (
      <p className="text-xs text-neutral-400">
        {mine ? "나" : "상대"}: 가위바위보 선택 완료 🤫
      </p>
    );
  }

  // --- balance game ---
  const bal = c.match(GAME_RES.bal);
  if (bal) {
    const [, gameId, q, a, b] = bal;
    const answers = all
      .map((m) => ({ m, match: m.content.match(GAME_RES.bala) }))
      .filter((x) => x.match && x.match[1] === gameId)
      .map((x) => ({ sender: x.m.sender_id, pick: x.match![2] as "A" | "B" }));
    const myAns = answers.find((x) => x.sender === myId);
    const theirAns = answers.find((x) => x.sender !== myId);

    return (
      <div className={card}>
        <p className="mb-2 font-semibold">⚖️ {q}</p>
        {!myAns ? (
          <div className="flex gap-2">
            {(["A", "B"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => onSend(`[[game:bala:${gameId}:${k}]]`)}
                className="flex-1 rounded-xl bg-blush py-2 text-sm font-medium text-love transition active:scale-95 dark:bg-love/15"
              >
                {k === "A" ? a : b}
              </button>
            ))}
          </div>
        ) : (
          <p>
            나: <b>{myAns.pick === "A" ? a : b}</b>
            {theirAns ? (
              <>
                {" "}
                / 상대: <b>{theirAns.pick === "A" ? a : b}</b> —{" "}
                <span className="font-bold text-love">
                  {myAns.pick === theirAns.pick ? "통했다! 💕" : "취향 차이 😂"}
                </span>
              </>
            ) : (
              <span className="text-neutral-400"> / 상대 기다리는 중…</span>
            )}
          </p>
        )}
      </div>
    );
  }

  // --- 10초 맞추기 ---
  const timer = c.match(GAME_RES.timer);
  if (timer) {
    return <TimerCard gameId={timer[1]} myId={myId} all={all} onSend={onSend} />;
  }
  const timerr = c.match(GAME_RES.timerr);
  if (timerr) {
    return (
      <p className="text-xs text-neutral-400">
        {mine ? "나" : "상대"}: {(Number(timerr[2]) / 1000).toFixed(2)}초에 멈춤 ⏱️
      </p>
    );
  }

  // --- 사다리 타기 (4 lines, 1 losing line derived from the game id) ---
  const ladder = c.match(GAME_RES.ladder);
  if (ladder) {
    const [, gameId, prize] = ladder;
    const lose = losingLine(gameId);
    const picks = all
      .map((m) => ({ m, match: m.content.match(GAME_RES.ladderp) }))
      .filter((x) => x.match && x.match[1] === gameId)
      .map((x) => ({ sender: x.m.sender_id, line: Number(x.match![2]) }));
    const myPick = picks.find((p) => p.sender === myId);
    const theirPick = picks.find((p) => p.sender !== myId);
    const done = myPick && theirPick;

    return (
      <div className={card}>
        <p className="mb-1 font-semibold">🪜 사다리 타기</p>
        <p className="mb-2 text-xs text-neutral-400">당첨(1줄): {prize}</p>
        {!myPick ? (
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onSend(`[[game:ladderp:${gameId}:${n}]]`)}
                className="flex-1 rounded-xl bg-blush py-2 font-bold text-love transition active:scale-90 dark:bg-love/15"
              >
                {n}
              </button>
            ))}
          </div>
        ) : !done ? (
          <p className="text-neutral-400">
            나: {myPick.line}번 줄 / 상대 기다리는 중…
          </p>
        ) : (
          <p>
            나 {myPick.line}번 · 상대 {theirPick!.line}번 → 꽝은 {lose}번!{" "}
            <span className="font-bold text-love">
              {myPick.line === lose && theirPick!.line === lose
                ? "둘 다 당첨?! 😱"
                : myPick.line === lose
                  ? `내가 당첨… (${prize}) 😭`
                  : theirPick!.line === lose
                    ? `상대 당첨! (${prize}) 🎉`
                    : "둘 다 무사통과! 🍀"}
            </span>
          </p>
        )}
      </div>
    );
  }
  const ladderp = c.match(GAME_RES.ladderp);
  if (ladderp) {
    return (
      <p className="text-xs text-neutral-400">
        {mine ? "나" : "상대"}: 사다리 {ladderp[2]}번 줄 선택
      </p>
    );
  }

  // --- 복불복 뽑기 (instant) ---
  const pick = c.match(GAME_RES.pick);
  if (pick) {
    const who = mine ? pick[1] : pick[1] === "나" ? "상대" : "나";
    return (
      <div className={card}>
        🎰 복불복 결과: <b className="text-love">{who}</b> →{" "}
        <b>{pick[2]}</b>
      </div>
    );
  }

  // --- balance answer (small status line) ---
  const bala = c.match(GAME_RES.bala);
  if (bala) {
    return (
      <p className="text-xs text-neutral-400">
        {mine ? "나" : "상대"}: 밸런스게임 응답 완료
      </p>
    );
  }

  // --- plain text bubble ---
  return (
    <div
      className={`max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${
        mine
          ? "rounded-br-sm bg-love text-white"
          : "rounded-bl-sm bg-white text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
      }`}
    >
      {c}
    </div>
  );
}
