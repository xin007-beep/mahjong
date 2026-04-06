import { describe, expect, it } from "vitest";
import { chooseAiClaim, chooseAiDiscard } from "../game/ai/strategy";
import { getClaimPriorityQueue } from "../game/core/arbitration";
import { createInitialGameState } from "../game/core/setup";
import { checkWin } from "../game/rules/win";
import { gameReducer } from "../game/state/reducer";

function tile(id, code) {
  return { id, code };
}

describe("checkWin", () => {
  it("accepts a standard four melds and one pair hand", () => {
    expect(
      checkWin(["m1", "m2", "m3", "m4", "m5", "m6", "s2", "s3", "s4", "p7", "p8", "p9", "red", "red"]),
    ).toBe(true);
  });

  it("supports honor triplets", () => {
    expect(
      checkWin([
        "east",
        "east",
        "east",
        "south",
        "south",
        "south",
        "p3",
        "p4",
        "p5",
        "m7",
        "m8",
        "m9",
        "white",
        "white",
      ]),
    ).toBe(true);
  });

  it("supports exposed meld count with concealed remainder", () => {
    expect(checkWin(["m1", "m2", "m3", "s4", "s5", "s6", "p7", "p8", "p9", "red", "red"], 1)).toBe(true);
  });

  it("rejects invalid combinations", () => {
    expect(
      checkWin(["m1", "m1", "m2", "m2", "m3", "m4", "m5", "m6", "s1", "s2", "s3", "p7", "p8", "white"]),
    ).toBe(false);
  });

  it("handles multiple recursive decomposition paths", () => {
    expect(
      checkWin(["m1", "m1", "m2", "m2", "m3", "m3", "m4", "m4", "m5", "m5", "m6", "m6", "m7", "m7"]),
    ).toBe(true);
  });
});

describe("arbitration and ai", () => {
  it("prioritizes winning over pong and chow", () => {
    const discard = tile("d1", "m3");
    const queue = getClaimPriorityQueue("east", {
      east: [],
      south: [
        {
          type: "pong",
          seat: "south",
          fromSeat: "east",
          tiles: [tile("a", "m3"), tile("b", "m3"), discard],
          claimedTileId: discard.id,
        },
      ],
      west: [
        {
          type: "win",
          seat: "west",
          fromSeat: "east",
          tiles: [discard],
          claimedTileId: discard.id,
        },
      ],
      north: [
        {
          type: "chow",
          seat: "north",
          fromSeat: "east",
          tiles: [tile("c", "m1"), tile("d", "m2"), discard],
          claimedTileId: discard.id,
        },
      ],
    });

    expect(queue[0].seat).toBe("west");
    expect(queue[0].options[0].type).toBe("win");
  });

  it("discards isolated honors first", () => {
    const discard = chooseAiDiscard([
      tile("1", "east"),
      tile("2", "m2"),
      tile("3", "m3"),
      tile("4", "m4"),
      tile("5", "s5"),
      tile("6", "s6"),
      tile("7", "p7"),
      tile("8", "p8"),
    ]);

    expect(discard.code).toBe("east");
  });

  it("always chooses win when available", () => {
    const options = [
      {
        type: "pong",
        seat: "east",
        fromSeat: "south",
        tiles: [tile("a", "m1"), tile("b", "m1"), tile("c", "m1")],
      },
      {
        type: "win",
        seat: "east",
        fromSeat: "south",
        tiles: [tile("w", "red")],
      },
    ];

    expect(chooseAiClaim(options, createInitialGameState().players.east.hand)?.type).toBe("win");
  });
});

describe("reducer turn control", () => {
  it("continues claim queue when one ai passes", () => {
    const discard = tile("d1", "m3");
    const state = {
      ...createInitialGameState(),
      phase: "claimWindow",
      currentTurn: "east",
      lastDiscard: { seat: "east", tile: discard },
      claimQueue: [
        {
          seat: "west",
          fromSeat: "east",
          discard,
          options: [
            {
              type: "chow",
              seat: "west",
              fromSeat: "east",
              tiles: [tile("a", "m1"), tile("b", "m2"), discard],
              claimedTileId: discard.id,
            },
          ],
        },
        {
          seat: "north",
          fromSeat: "east",
          discard,
          options: [
            {
              type: "pong",
              seat: "north",
              fromSeat: "east",
              tiles: [tile("c", "m3"), tile("d", "m3"), discard],
              claimedTileId: discard.id,
            },
          ],
        },
      ],
    };

    const nextState = gameReducer(state, { type: "passPendingClaim" });

    expect(nextState.phase).toBe("claimWindow");
    expect(nextState.claimQueue).toHaveLength(1);
    expect(nextState.claimQueue[0].seat).toBe("north");
  });
});
