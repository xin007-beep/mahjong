import { formatTile } from "../game/core/tiles";
import MahjongTile from "./MahjongTile";

function MeldBar({ melds }) {
  if (!melds.length) {
    return null;
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {melds.map((meld, index) => (
        <div
          key={`${meld.type}-${index}`}
          className="rounded-full border border-amber-100/20 bg-black/18 px-3 py-1 text-xs text-amber-50"
        >
          {meld.type === "chow" ? "吃" : meld.type === "pong" ? "碰" : meld.concealed ? "暗杠" : "杠"}{" "}
          {meld.tiles.map((tile) => formatTile(tile.code)).join(" ")}
        </div>
      ))}
    </div>
  );
}

export default function PlayerHand({
  hand,
  melds,
  selectedTileId,
  canInteract,
  hasFloatingActionBar = false,
  onSelectTile,
}) {
  const selectedTile = hand.find((tile) => tile.id === selectedTileId);

  return (
    <section
      className={`mahjong-panel rounded-[2rem] border border-white/8 px-5 py-4 ${
        hasFloatingActionBar ? "pb-28" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-100/52">South Seat</p>
          <h2 className="text-2xl font-semibold text-amber-50">你的手牌</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-sm text-emerald-50/80">
            手牌 {hand.length}
          </div>
          <div className="rounded-full border border-amber-200/15 bg-amber-200/8 px-3 py-1 text-sm text-amber-50/85">
            {selectedTile ? `已选 ${formatTile(selectedTile.code)}` : "点击牌面选择出牌"}
          </div>
        </div>
      </div>

      <MeldBar melds={melds} />

      <div className="flex flex-wrap items-end gap-2">
        {hand.map((tile) => (
          <MahjongTile
            key={tile.id}
            tile={tile}
            selected={selectedTileId === tile.id}
            onClick={canInteract ? () => onSelectTile(tile.id) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
