import { useEffect, useReducer } from "react";
import ActionBar from "../components/ActionBar";
import DiscardCenter from "../components/DiscardCenter";
import PlayerHand from "../components/PlayerHand";
import ResultOverlay from "../components/ResultOverlay";
import SeatPanel from "../components/SeatPanel";
import StatusHeader from "../components/StatusHeader";
import { chooseAiClaim, chooseAiDiscard, chooseAiSelfAction } from "../game/ai/strategy";
import { getClaimPriorityQueue } from "../game/core/arbitration";
import { createInitialGameState, SEAT_LABEL } from "../game/core/setup";
import { formatTile } from "../game/core/tiles";
import { getClaimCandidates, getSelfActionOptions } from "../game/rules/claims";
import { buildHumanPendingClaim, gameReducer } from "../game/state/reducer";

const AI_DELAY_MS = 900;

function getTablePrompt(state) {
  if (state.phase === "roundEnd") {
    return state.winner
      ? `${SEAT_LABEL[state.winner.seat]}家已经胡牌，本局结束。`
      : "牌墙已经摸空，本局流局。";
  }

  if (state.pendingClaim?.seat === "south") {
    if (state.pendingClaim.context === "selfActionCheck") {
      return "你可以选择自摸或杠；倒计时结束后将自动视为放弃。";
    }

    const discardText = state.pendingClaim.discard
      ? `上家打出了 ${formatTile(state.pendingClaim.discard.code)}，`
      : "";
    return `${discardText}你可以进行吃、碰、杠或胡。`;
  }

  if (state.currentTurn === "south") {
    if (state.phase === "draw") {
      return "轮到你摸牌。";
    }
    if (state.phase === "selfActionCheck") {
      return "系统正在判定你是否可以自摸或杠。";
    }
    if (state.phase === "discard") {
      return "请选择一张手牌，然后点击“打出所选牌”。";
    }
  }

  if (state.phase === "claimWindow") {
    return "其他玩家正在判定是否吃碰杠胡。";
  }

  return `${SEAT_LABEL[state.currentTurn]}家正在思考。`;
}

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialGameState);
  const currentPlayer = state.players[state.currentTurn];
  const southPlayer = state.players.south;

  useEffect(() => {
    if (state.phase !== "draw" || state.pendingClaim || state.winner) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      dispatch({ type: "drawForCurrentTurn" });
    }, 520);

    return () => window.clearTimeout(timeoutId);
  }, [state.phase, state.pendingClaim, state.winner]);

  useEffect(() => {
    if (state.phase !== "selfActionCheck" || state.pendingClaim || state.winner) {
      return undefined;
    }

    const options = getSelfActionOptions(currentPlayer);
    if (!options.length) {
      dispatch({ type: "setPhase", phase: "discard" });
      return undefined;
    }

    if (currentPlayer.isHuman) {
      dispatch({
        type: "openPendingClaim",
        pendingClaim: buildHumanPendingClaim(options, currentPlayer.seat, currentPlayer.seat),
      });
      return undefined;
    }

    const chosen = chooseAiSelfAction(options);
    if (!chosen) {
      dispatch({ type: "setPhase", phase: "discard" });
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      dispatch({ type: "applyClaim", seat: currentPlayer.seat, option: chosen });
    }, AI_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [currentPlayer, state.pendingClaim, state.phase, state.winner]);

  useEffect(() => {
    if (state.phase !== "discard" || currentPlayer.isHuman || state.pendingClaim || state.winner) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      const tile = chooseAiDiscard(currentPlayer.hand);
      dispatch({ type: "discardTile", seat: currentPlayer.seat, tileId: tile.id });
    }, AI_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [currentPlayer, state.pendingClaim, state.phase, state.winner]);

  useEffect(() => {
    if (state.phase !== "claimWindow" || state.pendingClaim || state.winner || !state.lastDiscard) {
      return undefined;
    }

    if (!state.claimQueue.length) {
      const queue = getClaimPriorityQueue(
        state.lastDiscard.seat,
        getClaimCandidates(state, state.lastDiscard),
      );

      if (!queue.length) {
        dispatch({ type: "passPendingClaim" });
        return undefined;
      }

      dispatch({ type: "setClaimQueue", queue });
      return undefined;
    }

    const activeClaim = state.claimQueue[0];
    const claimant = state.players[activeClaim.seat];

    if (claimant.isHuman) {
      dispatch({
        type: "openPendingClaim",
        pendingClaim: buildHumanPendingClaim(
          activeClaim.options,
          activeClaim.seat,
          activeClaim.fromSeat,
          activeClaim.discard,
        ),
      });
      return undefined;
    }

    const chosen = chooseAiClaim(activeClaim.options, claimant.hand);
    const timeoutId = window.setTimeout(() => {
      if (chosen) {
        dispatch({ type: "applyClaim", seat: activeClaim.seat, option: chosen });
      } else {
        dispatch({ type: "passPendingClaim" });
      }
    }, AI_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [state]);

  useEffect(() => {
    if (!state.pendingClaim || !state.players[state.pendingClaim.seat].isHuman || state.winner) {
      return undefined;
    }

    if (state.actionTimerMs <= 0) {
      dispatch({ type: "passPendingClaim" });
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      dispatch({ type: "tickTimer" });
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [state.actionTimerMs, state.pendingClaim, state.players, state.winner]);

  const pendingOptions = state.pendingClaim?.seat === "south" ? state.pendingClaim.options : [];
  const canDiscard =
    state.phase === "discard" &&
    state.currentTurn === "south" &&
    !state.pendingClaim &&
    Boolean(state.selectedTileId);
  const showFloatingActionBar = pendingOptions.length > 0 || canDiscard;

  return (
    <div className="mahjong-app min-h-screen text-stone-50">
      <main className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-4 px-4 py-4 lg:px-5 lg:py-5">
        <StatusHeader
          remainingCount={state.remainingCount}
          currentTurn={state.currentTurn}
          dealer={state.dealer}
          phase={state.phase}
          turnNumber={state.turnNumber}
        />

        <div className="mahjong-table relative flex flex-1 flex-col gap-4 overflow-hidden rounded-[2.6rem] border border-white/10 p-4 shadow-[0_35px_80px_rgba(0,0,0,0.36)]">
          <div className="pointer-events-none absolute inset-5 rounded-[2rem] border border-white/6" />

          <div className="grid flex-1 grid-cols-[minmax(11rem,13rem)_minmax(0,1fr)_minmax(11rem,13rem)] grid-rows-[minmax(9rem,auto)_minmax(0,1fr)_minmax(13rem,auto)] gap-4">
            <div className="col-start-2 row-start-1">
              <SeatPanel
                seat="east"
                seatLabel={SEAT_LABEL.east}
                handCount={state.players.east.hand.length}
                melds={state.players.east.melds}
                isCurrentTurn={state.currentTurn === "east"}
                orientation="top"
              />
            </div>

            <div className="col-start-1 row-start-2">
              <SeatPanel
                seat="west"
                seatLabel={SEAT_LABEL.west}
                handCount={state.players.west.hand.length}
                melds={state.players.west.melds}
                isCurrentTurn={state.currentTurn === "west"}
                orientation="left"
              />
            </div>

            <div className="col-start-2 row-start-2">
              <DiscardCenter
                players={state.players}
                lastDiscard={state.lastDiscard}
                prompt={getTablePrompt(state)}
                logs={state.logs}
              />
            </div>

            <div className="col-start-3 row-start-2">
              <SeatPanel
                seat="north"
                seatLabel={SEAT_LABEL.north}
                handCount={state.players.north.hand.length}
                melds={state.players.north.melds}
                isCurrentTurn={state.currentTurn === "north"}
                orientation="right"
              />
            </div>

            <div className="col-span-3 row-start-3">
              <PlayerHand
                hand={southPlayer.hand}
                melds={southPlayer.melds}
                selectedTileId={state.selectedTileId}
                canInteract={state.phase === "discard" && state.currentTurn === "south" && !state.pendingClaim}
                hasFloatingActionBar={showFloatingActionBar}
                onSelectTile={(tileId) => dispatch({ type: "selectTile", tileId })}
              />
            </div>
          </div>

          <ActionBar
            pendingOptions={pendingOptions}
            countdownMs={state.actionTimerMs}
            discardEnabled={canDiscard}
            onDiscard={() =>
              state.selectedTileId &&
              dispatch({ type: "discardTile", seat: "south", tileId: state.selectedTileId })
            }
            onApplyClaim={(option) => dispatch({ type: "applyClaim", seat: option.seat, option })}
            onPass={() => dispatch({ type: "passPendingClaim" })}
          />

          {state.phase === "roundEnd" ? (
            <ResultOverlay winner={state.winner} onRestart={() => dispatch({ type: "restart" })} />
          ) : null}
        </div>
      </main>
    </div>
  );
}
