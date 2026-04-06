import { SEAT_LABEL } from "../game/core/setup";
import { formatTile } from "../game/core/tiles";

function DiscardArea({ seat, player }) {
  return (
    <div className="rounded-[1.4rem] border border-white/8 bg-black/14 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-amber-50">{SEAT_LABEL[seat]}家</span>
        <span className="text-xs text-emerald-50/65">{player.discards.length} 张</span>
      </div>
      <div className="grid max-h-40 grid-cols-4 gap-2 overflow-y-auto pr-1">
        {player.discards.map((tile) => (
          <div
            key={tile.id}
            className="rounded-lg border border-stone-200/75 bg-gradient-to-b from-stone-50 to-stone-200 px-1 py-1 text-center text-xs font-medium text-stone-800 shadow-[0_4px_10px_rgba(0,0,0,0.16)]"
          >
            {formatTile(tile.code)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DiscardCenter({ players, lastDiscard, prompt, logs }) {
  return (
    <section className="mahjong-panel flex h-full min-h-[19rem] flex-col rounded-[2rem] border border-white/8 px-5 py-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-100/55">Discard Pond</p>
          <h3 className="text-2xl font-semibold text-amber-50">牌池中心</h3>
        </div>
        <div className="rounded-full border border-amber-200/20 bg-amber-100/8 px-4 py-2 text-sm text-amber-50/90">
          {lastDiscard
            ? `最近打出：${SEAT_LABEL[lastDiscard.seat]}家 ${formatTile(lastDiscard.tile.code)}`
            : "等待本轮出牌"}
        </div>
      </div>

      <div className="mb-4 rounded-[1.4rem] border border-emerald-100/10 bg-emerald-100/5 px-4 py-3 text-sm leading-7 text-emerald-50/86">
        {prompt}
      </div>

      <div className="grid flex-1 grid-cols-[minmax(0,1fr)_16rem] gap-4">
        <div className="grid grid-cols-2 gap-3">
          {Object.keys(players).map((seat) => (
            <DiscardArea key={seat} seat={seat} player={players[seat]} />
          ))}
        </div>

        <div className="rounded-[1.4rem] border border-white/8 bg-black/14 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-amber-50">对局播报</span>
            <span className="text-xs text-emerald-50/60">最新 6 条</span>
          </div>
          <div className="space-y-2">
            {logs.slice(0, 6).map((log, index) => (
              <div
                key={`${log}-${index}`}
                className="rounded-xl border border-white/6 bg-white/6 px-3 py-2 text-sm text-emerald-50/82"
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
