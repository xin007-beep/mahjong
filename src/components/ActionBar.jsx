import { formatTile } from "../game/core/tiles";

function optionLabel(option) {
  if (option.type === "win") {
    return "胡";
  }
  if (option.type === "pong") {
    return "碰";
  }
  if (option.type === "kong") {
    return option.concealed ? "暗杠" : "杠";
  }
  return "吃";
}

function optionDetail(option) {
  if (option.type === "win") {
    return "";
  }

  return option.tiles.map((tile) => formatTile(tile.code)).join(" ");
}

export default function ActionBar({
  pendingOptions,
  countdownMs,
  discardEnabled,
  onDiscard,
  onApplyClaim,
  onPass,
}) {
  if (!pendingOptions.length && !discardEnabled) {
    return null;
  }

  return (
    <section className="pointer-events-auto absolute inset-x-0 bottom-2 z-20 mx-auto flex w-fit min-w-[26rem] max-w-[calc(100%-2.5rem)] flex-wrap items-center justify-center gap-3 rounded-[1.8rem] border border-amber-100/12 bg-[rgba(5,20,15,0.92)] px-5 py-4 shadow-[0_28px_60px_rgba(0,0,0,0.36)] backdrop-blur-xl">
      {pendingOptions.length ? (
        <>
          <div className="mr-2 text-center">
            <p className="text-xs uppercase tracking-[0.32em] text-emerald-100/50">可操作</p>
            <p className="text-lg font-semibold text-amber-50">{Math.ceil(countdownMs / 1000)} 秒</p>
          </div>
          {pendingOptions.map((option, index) => (
            <button
              key={`${option.type}-${index}`}
              type="button"
              onClick={() => onApplyClaim(option)}
              className="rounded-full border border-amber-300/25 bg-gradient-to-b from-amber-200/25 to-amber-500/20 px-5 py-2 text-sm font-semibold text-amber-50 transition hover:-translate-y-0.5 hover:border-amber-200/45 hover:bg-amber-300/20"
            >
              {optionLabel(option)}
              {optionDetail(option) ? ` ${optionDetail(option)}` : ""}
            </button>
          ))}
          <button
            type="button"
            onClick={onPass}
            className="rounded-full border border-white/12 bg-white/8 px-5 py-2 text-sm font-semibold text-emerald-50 transition hover:bg-white/12"
          >
            过
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={onDiscard}
          className="rounded-full border border-amber-200/25 bg-gradient-to-b from-amber-200/25 to-amber-500/25 px-8 py-3 text-base font-semibold text-amber-50 transition hover:-translate-y-0.5 hover:border-amber-100/40"
        >
          打出所选牌
        </button>
      )}
    </section>
  );
}
