import { SEAT_LABEL } from "../game/core/setup";

const phaseLabel = {
  draw: "摸牌阶段",
  selfActionCheck: "自摸/杠判定",
  discard: "出牌阶段",
  claimWindow: "吃碰杠胡判定",
  roundEnd: "本局结束",
};

function StatusPill({ label, value }) {
  return (
    <div className="status-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function StatusHeader({ remainingCount, currentTurn, dealer, phase, turnNumber }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-white/8 bg-black/12 px-5 py-4 backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-[0.38em] text-emerald-100/50">Single Player Mahjong</p>
        <h1 className="mt-1 text-3xl font-semibold text-amber-50">单机大众麻将</h1>
        <p className="mt-2 text-sm text-emerald-50/76">新中式桌面，专为平板横屏游玩优化。</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <StatusPill label="剩余牌" value={remainingCount} />
        <StatusPill label="庄家" value={`${SEAT_LABEL[dealer]}家`} />
        <StatusPill label="当前" value={`${SEAT_LABEL[currentTurn]}家`} />
        <StatusPill label="阶段" value={phaseLabel[phase]} />
        <StatusPill label="手数" value={turnNumber} />
      </div>
    </header>
  );
}
