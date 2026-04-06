import { SEAT_LABEL } from "../game/core/setup";
import { formatTile } from "../game/core/tiles";

export default function ResultOverlay({ winner, onRestart }) {
  const title = winner ? `${SEAT_LABEL[winner.seat]}家胡牌` : "本局流局";
  const summary = winner
    ? winner.by === "selfDraw"
      ? `${SEAT_LABEL[winner.seat]}家自摸 ${formatTile(winner.tile.code)}。`
      : `${SEAT_LABEL[winner.seat]}家荣和 ${SEAT_LABEL[winner.fromSeat]}家打出的 ${formatTile(
          winner.tile.code,
        )}。`
    : "牌墙摸空，没有玩家胡牌。";

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(2,10,7,0.62)] px-6 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[2rem] border border-amber-100/10 bg-[linear-gradient(180deg,rgba(11,32,23,0.97),rgba(9,20,16,0.97))] p-8 text-center shadow-[0_32px_80px_rgba(0,0,0,0.4)]">
        <p className="text-xs uppercase tracking-[0.45em] text-emerald-100/50">Round End</p>
        <h2 className="mt-3 text-4xl font-semibold text-amber-50">{title}</h2>
        <p className="mt-4 text-lg leading-8 text-emerald-50/82">{summary}</p>
        <button
          type="button"
          onClick={onRestart}
          className="mt-8 rounded-full border border-amber-200/20 bg-gradient-to-b from-amber-200/25 to-amber-500/25 px-8 py-3 text-base font-semibold text-amber-50 transition hover:-translate-y-0.5 hover:border-amber-100/40"
        >
          再开一局
        </button>
      </div>
    </div>
  );
}
