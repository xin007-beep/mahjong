import MahjongTile from "./MahjongTile";

function MeldStrip({ melds }) {
  if (!melds.length) {
    return <div className="text-xs text-emerald-100/70">暂无副露</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {melds.map((meld, index) => (
        <div
          key={`${meld.type}-${index}`}
          className="rounded-full border border-amber-200/15 bg-black/18 px-2.5 py-1 text-xs text-amber-50/90"
        >
          {meld.type === "chow" ? "吃" : meld.type === "pong" ? "碰" : meld.concealed ? "暗杠" : "杠"}
        </div>
      ))}
    </div>
  );
}

export default function SeatPanel({
  seat,
  seatLabel,
  handCount,
  melds,
  isCurrentTurn,
  orientation,
}) {
  const rotated = orientation !== "top";

  return (
    <section
      className={`rounded-[1.8rem] border border-white/10 bg-black/18 p-4 backdrop-blur-xl ${
        isCurrentTurn ? "ring-1 ring-amber-300/45 shadow-[0_20px_40px_rgba(0,0,0,0.26)]" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-100/45">{seat}</p>
          <h2 className="text-xl font-semibold text-amber-50">{seatLabel}家</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-emerald-50/80">
          手牌 {handCount}
        </div>
      </div>

      <div className={`flex ${orientation === "top" ? "justify-center" : "justify-start"} gap-1 overflow-hidden`}>
        {Array.from({ length: handCount }).map((_, index) => (
          <MahjongTile key={`${seat}-${index}`} hidden compact rotated={rotated} />
        ))}
      </div>

      <div className="mt-3">
        <MeldStrip melds={melds} />
      </div>
    </section>
  );
}
