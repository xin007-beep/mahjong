import { createInitialGameState, nextSeat, SEAT_LABEL } from "../core/setup";
import { playSfx } from "../core/sound";
import { formatTile, sortTileInstances } from "../core/tiles";

const CLAIM_TIMEOUT_MS = 6000;

function appendLog(state, message) {
  return [message, ...state.logs].slice(0, 12);
}

function removeTilesById(hand, tileIds) {
  const idSet = new Set(tileIds);
  return hand.filter((tile) => !idSet.has(tile.id));
}

function claimLabel(option) {
  if (option.type === "win") {
    return "胡";
  }
  if (option.type === "pong") {
    return "碰";
  }
  if (option.type === "chow") {
    return "吃";
  }
  return option.concealed ? "暗杠" : "杠";
}

function createMeldFromOption(option) {
  return {
    type: option.type,
    seat: option.seat,
    tiles: sortTileInstances(option.tiles),
    claimedTileId: option.claimedTileId,
    concealed: option.concealed,
  };
}

function updatePlayer(state, seat, updater) {
  return {
    ...state,
    players: {
      ...state.players,
      [seat]: updater(state.players[seat]),
    },
  };
}

function advanceToNextTurn(state) {
  const discardSeat = state.lastDiscard?.seat ?? state.currentTurn;

  return {
    ...state,
    currentTurn: nextSeat(discardSeat),
    phase: "draw",
    claimQueue: [],
    pendingClaim: undefined,
    actionTimerMs: 0,
    lastDiscard: undefined,
    selectedTileId: undefined,
    turnNumber: state.turnNumber + 1,
  };
}

function advanceAfterPass(state) {
  const [, ...rest] = state.claimQueue;

  if (rest.length > 0) {
    return {
      ...state,
      claimQueue: rest,
      pendingClaim: undefined,
      actionTimerMs: 0,
    };
  }

  return advanceToNextTurn({
    ...state,
    claimQueue: [],
    pendingClaim: undefined,
    actionTimerMs: 0,
  });
}

function applyWin(state, seat, tile, by, fromSeat) {
  playSfx("win");

  return {
    ...state,
    winner: {
      seat,
      by,
      tile,
      fromSeat,
    },
    phase: "roundEnd",
    pendingClaim: undefined,
    actionTimerMs: 0,
    claimQueue: [],
    logs: appendLog(
      state,
      `${SEAT_LABEL[seat]}家${by === "selfDraw" ? "自摸" : "荣和"} ${formatTile(tile.code)}，本局结束。`,
    ),
  };
}

export function buildHumanPendingClaim(options, seat, fromSeat, discard) {
  return {
    seat,
    fromSeat,
    discard,
    options,
    context: discard ? "claimWindow" : "selfActionCheck",
    countdownMs: CLAIM_TIMEOUT_MS,
  };
}

export function gameReducer(state, action) {
  switch (action.type) {
    case "restart":
      return createInitialGameState();

    case "selectTile":
      if (state.phase !== "discard" || state.currentTurn !== "south" || state.pendingClaim) {
        return state;
      }

      return {
        ...state,
        selectedTileId: state.selectedTileId === action.tileId ? undefined : action.tileId,
      };

    case "drawForCurrentTurn": {
      if (state.phase !== "draw") {
        return state;
      }

      if (state.wall.length === 0) {
        return {
          ...state,
          phase: "roundEnd",
          winner: undefined,
          logs: appendLog(state, "牌墙摸空，流局。"),
        };
      }

      const [drawnTile, ...remainingWall] = state.wall;
      playSfx("draw");

      const nextState = updatePlayer(
        {
          ...state,
          wall: remainingWall,
          remainingCount: remainingWall.length,
          phase: "selfActionCheck",
          logs: appendLog(state, `${SEAT_LABEL[state.currentTurn]}家摸牌。`),
        },
        state.currentTurn,
        (player) => ({
          ...player,
          hand: sortTileInstances([...player.hand, drawnTile]),
        }),
      );

      return {
        ...nextState,
        selectedTileId: state.currentTurn === "south" ? drawnTile.id : undefined,
      };
    }

    case "discardTile": {
      if (state.phase !== "discard" || action.seat !== state.currentTurn) {
        return state;
      }

      const currentPlayer = state.players[action.seat];
      const tile = currentPlayer.hand.find((handTile) => handTile.id === action.tileId);
      if (!tile) {
        return state;
      }

      const nextState = updatePlayer(state, action.seat, (player) => ({
        ...player,
        hand: sortTileInstances(player.hand.filter((handTile) => handTile.id !== action.tileId)),
        discards: [...player.discards, tile],
      }));

      playSfx("discard");

      return {
        ...nextState,
        phase: "claimWindow",
        lastDiscard: {
          seat: action.seat,
          tile,
        },
        claimQueue: [],
        pendingClaim: undefined,
        actionTimerMs: 0,
        selectedTileId: undefined,
        logs: appendLog(nextState, `${SEAT_LABEL[action.seat]}家打出 ${formatTile(tile.code)}。`),
      };
    }

    case "setPhase":
      return {
        ...state,
        phase: action.phase,
      };

    case "openPendingClaim":
      return {
        ...state,
        pendingClaim: action.pendingClaim,
        actionTimerMs: action.pendingClaim.countdownMs,
      };

    case "setClaimQueue":
      return {
        ...state,
        claimQueue: action.queue,
      };

    case "tickTimer":
      if (!state.pendingClaim) {
        return state;
      }

      return {
        ...state,
        pendingClaim: {
          ...state.pendingClaim,
          countdownMs: Math.max(0, state.pendingClaim.countdownMs - 1000),
        },
        actionTimerMs: Math.max(0, state.actionTimerMs - 1000),
      };

    case "passPendingClaim": {
      if (!state.pendingClaim) {
        if (state.phase !== "claimWindow") {
          return state;
        }

        if (state.claimQueue.length === 0) {
          return advanceToNextTurn(state);
        }

        const currentClaim = state.claimQueue[0];
        return {
          ...advanceAfterPass(state),
          logs: appendLog(state, `${SEAT_LABEL[currentClaim.seat]}家选择过。`),
        };
      }

      if (state.pendingClaim.context === "selfActionCheck") {
        return {
          ...state,
          pendingClaim: undefined,
          actionTimerMs: 0,
          phase: "discard",
          logs: appendLog(state, "你放弃了当前自摸或杠的机会。"),
        };
      }

      return {
        ...advanceAfterPass(state),
        logs: appendLog(state, `${SEAT_LABEL[state.pendingClaim.seat]}家选择过。`),
      };
    }

    case "applyClaim": {
      const option = action.option;
      if (state.pendingClaim && state.pendingClaim.seat !== action.seat) {
        return state;
      }

      if (option.type === "win") {
        const winningTile = option.tiles[0] ?? state.lastDiscard?.tile;
        if (!winningTile) {
          return state;
        }

        return applyWin(
          state,
          action.seat,
          winningTile,
          option.fromSeat === action.seat ? "selfDraw" : "discard",
          option.fromSeat === action.seat ? undefined : option.fromSeat,
        );
      }

      const claimedTileIdSet = new Set(option.claimedTileId ? [option.claimedTileId] : []);
      const consumedTileIds = option.tiles
        .filter((tile) => !claimedTileIdSet.has(tile.id))
        .map((tile) => tile.id);

      const withoutDiscard = option.claimedTileId
        ? updatePlayer(state, option.fromSeat, (player) => ({
            ...player,
            discards: player.discards.filter((tile) => tile.id !== option.claimedTileId),
          }))
        : state;

      const claimState = updatePlayer(withoutDiscard, action.seat, (player) => ({
        ...player,
        hand: sortTileInstances(removeTilesById(player.hand, consumedTileIds)),
        melds: [...player.melds, createMeldFromOption(option)],
      }));

      playSfx("claim");

      return {
        ...claimState,
        currentTurn: action.seat,
        phase: option.type === "kong" ? "draw" : "discard",
        lastDiscard: undefined,
        pendingClaim: undefined,
        actionTimerMs: 0,
        claimQueue: [],
        selectedTileId: undefined,
        logs: appendLog(
          claimState,
          `${SEAT_LABEL[action.seat]}家${claimLabel(option)} ${option.tiles
            .map((tile) => formatTile(tile.code))
            .join(" ")}。`,
        ),
      };
    }

    default:
      return state;
  }
}
