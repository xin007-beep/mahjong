import { previousSeat } from "../core/setup";
import { compareTileCodes, getTileRank, getTileSuit, isHonorTile } from "../core/tiles";
import { checkWin, wouldWinWithTile } from "./win";

function sortClaimTiles(tiles) {
  return [...tiles].sort((left, right) => compareTileCodes(left.code, right.code));
}

function matchingHandTiles(hand, code, limit) {
  return hand.filter((tile) => tile.code === code).slice(0, limit);
}

export function canPong(hand, discardTile) {
  return hand.filter((tile) => tile.code === discardTile.code).length >= 2;
}

export function getChowOptions(hand, discardTile, fromSeat, currentSeat) {
  if (previousSeat(currentSeat) !== fromSeat || isHonorTile(discardTile.code)) {
    return [];
  }

  const suit = getTileSuit(discardTile.code);
  const rank = getTileRank(discardTile.code);
  const patterns = [
    [rank - 2, rank - 1],
    [rank - 1, rank + 1],
    [rank + 1, rank + 2],
  ];

  return patterns
    .filter(([first, second]) => first >= 1 && second <= 9)
    .map(([first, second]) => {
      const firstCode = `${suit}${first}`;
      const secondCode = `${suit}${second}`;
      const firstTile = hand.find((tile) => tile.code === firstCode);
      const secondTile = hand.find((tile) => tile.code === secondCode && tile.id !== firstTile?.id);

      if (!firstTile || !secondTile) {
        return undefined;
      }

      return {
        type: "chow",
        seat: currentSeat,
        fromSeat,
        tiles: sortClaimTiles([firstTile, discardTile, secondTile]),
        claimedTileId: discardTile.id,
      };
    })
    .filter(Boolean);
}

export function getKongOptions(hand, discardTile) {
  if (discardTile) {
    const matching = matchingHandTiles(hand, discardTile.code, 3);
    if (matching.length !== 3) {
      return [];
    }

    return [
      {
        type: "kong",
        tiles: sortClaimTiles([...matching, discardTile]),
        claimedTileId: discardTile.id,
      },
    ];
  }

  const grouped = new Map();
  for (const tile of hand) {
    const bucket = grouped.get(tile.code) ?? [];
    bucket.push(tile);
    grouped.set(tile.code, bucket);
  }

  return [...grouped.values()]
    .filter((tiles) => tiles.length === 4)
    .map((tiles) => ({
      type: "kong",
      tiles: sortClaimTiles(tiles),
      concealed: true,
    }));
}

function buildOpenKongOption(player, discardTile, fromSeat) {
  const matching = matchingHandTiles(player.hand, discardTile.code, 3);
  if (matching.length !== 3) {
    return undefined;
  }

  return {
    type: "kong",
    seat: player.seat,
    fromSeat,
    tiles: sortClaimTiles([...matching, discardTile]),
    claimedTileId: discardTile.id,
  };
}

function buildPongOption(player, discardTile, fromSeat) {
  if (!canPong(player.hand, discardTile)) {
    return undefined;
  }

  return {
    type: "pong",
    seat: player.seat,
    fromSeat,
    tiles: sortClaimTiles([...matchingHandTiles(player.hand, discardTile.code, 2), discardTile]),
    claimedTileId: discardTile.id,
  };
}

export function getClaimCandidates(state, discardEvent) {
  const candidates = {
    east: [],
    south: [],
    west: [],
    north: [],
  };

  for (const seat of Object.keys(state.players)) {
    if (seat === discardEvent.seat) {
      continue;
    }

    const player = state.players[seat];
    const concealedCodes = player.hand.map((tile) => tile.code);
    const options = [];

    if (wouldWinWithTile(concealedCodes, discardEvent.tile.code, player.melds.length)) {
      options.push({
        type: "win",
        seat,
        fromSeat: discardEvent.seat,
        tiles: [discardEvent.tile],
        claimedTileId: discardEvent.tile.id,
      });
    }

    const kong = buildOpenKongOption(player, discardEvent.tile, discardEvent.seat);
    if (kong) {
      options.push(kong);
    }

    const pong = buildPongOption(player, discardEvent.tile, discardEvent.seat);
    if (pong) {
      options.push(pong);
    }

    options.push(...getChowOptions(player.hand, discardEvent.tile, discardEvent.seat, seat));
    candidates[seat] = options;
  }

  return candidates;
}

export function getSelfActionOptions(player) {
  const options = [];
  const concealedCodes = player.hand.map((tile) => tile.code);

  if (checkWin(concealedCodes, player.melds.length)) {
    const winningTile = player.hand[player.hand.length - 1];
    options.push({
      type: "win",
      seat: player.seat,
      fromSeat: player.seat,
      tiles: winningTile ? [winningTile] : [],
    });
  }

  options.push(
    ...getKongOptions(player.hand).map((option) => ({
      ...option,
      seat: player.seat,
      fromSeat: player.seat,
    })),
  );

  return options;
}
