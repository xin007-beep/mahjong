import { getTileFaceMeta } from "../game/core/tiles";

export default function MahjongTile({
  tile,
  hidden = false,
  selected = false,
  compact = false,
  rotated = false,
  onClick,
}) {
  const meta = tile ? getTileFaceMeta(tile.code) : undefined;
  const sizeClass = compact ? "h-14 w-10 text-sm" : "h-22 w-15 text-base";
  const rotateClass = rotated ? "rotate-90 origin-center" : "";

  if (hidden) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${sizeClass} ${rotateClass} tile-back shrink-0 rounded-xl border border-emerald-950/65 shadow-[0_10px_24px_rgba(4,19,14,0.36)]`}
        aria-label="麻将背面"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${sizeClass} ${rotateClass} tile-face shrink-0 rounded-xl border border-stone-300/90 px-1 py-1 text-center transition duration-150 ${
        selected ? "-translate-y-4 shadow-[0_22px_34px_rgba(4,24,18,0.28)]" : "translate-y-0"
      } ${onClick ? "hover:-translate-y-2" : ""}`}
      aria-label={tile ? `麻将牌 ${tile.code}` : "麻将牌"}
    >
      <div className="flex h-full flex-col items-center justify-between rounded-[0.85rem] bg-gradient-to-b from-white via-stone-50 to-stone-200 px-1 py-1 shadow-[inset_0_2px_0_rgba(255,255,255,0.88)]">
        <span className={`text-[1.15rem] font-bold leading-none ${meta?.accent ?? ""}`}>{meta?.main}</span>
        <span className={`text-[0.6rem] tracking-[0.26em] ${meta?.accent ?? ""}`}>{meta?.sub}</span>
        <span className={`text-sm leading-none ${meta?.accent ?? ""}`}>{meta?.main}</span>
      </div>
    </button>
  );
}
