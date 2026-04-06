import {
  ALL_TILE_CODES,
  compareTileCodes,
  getTileRank,
  getTileSuit,
  isHonorTile,
  tileCountsFromCodes,
} from "../core/tiles";

function countForCode(code, counts) {
  return counts[ALL_TILE_CODES.indexOf(code)] ?? 0;
}

function discardScore(code, counts) {
  const sameCount = countForCode(code, counts);

  if (isHonorTile(code)) {
    return sameCount >= 2 ? -5 : 11;
  }

  const suit = getTileSuit(code);
  const rank = getTileRank(code);
  const prevOne = rank > 1 ? countForCode(`${suit}${rank - 1}`, counts) : 0;
  const nextOne = rank < 9 ? countForCode(`${suit}${rank + 1}`, counts) : 0;
  const prevTwo = rank > 2 ? countForCode(`${suit}${rank - 2}`, counts) : 0;
  const nextTwo = rank < 8 ? countForCode(`${suit}${rank + 2}`, counts) : 0;

  let score = 4;

  if (sameCount >= 2) {
    score -= 5;
  }
  if (prevOne > 0) {
    score -= 3;
  }
  if (nextOne > 0) {
    score -= 3;
  }
  if (prevTwo > 0) {
    score -= 1;
  }
  if (nextTwo > 0) {
    score -= 1;
  }
  if (rank === 1 || rank === 9) {
    score += 1;
  }
  if (prevOne === 0 && nextOne === 0 && sameCount === 1) {
    score += 5;
  }

  return score;
}

function chowBenefit(option, hand) {
  if (option.type !== "chow") {
    return -99;
  }

  const discardTile = option.tiles.find((tile) => tile.id === option.claimedTileId);
  if (!discardTile || isHonorTile(discardTile.code)) {
    return -99;
  }

  const claimedRank = getTileRank(discardTile.code);
  const ranks = option.tiles
    .map((tile) => getTileRank(tile.code) ?? 0)
    .sort((left, right) => left - right);

  const pairBreakPenalty = option.tiles
    .filter((tile) => tile.id !== option.claimedTileId)
    .reduce((sum, tile) => {
      const count = hand.filter((handTile) => handTile.code === tile.code).length;
      return sum + (count >= 2 ? 1 : 0);
    }, 0);

  let benefit = ranks[1] === claimedRank ? 3 : 2;
  benefit -= pairBreakPenalty;
  return benefit;
}

export function chooseAiDiscard(hand) {
  const counts = tileCountsFromCodes(hand.map((tile) => tile.code));

  return [...hand].sort((left, right) => {
    const leftScore = discardScore(left.code, counts);
    const rightScore = discardScore(right.code, counts);

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    const codeDiff = compareTileCodes(right.code, left.code);
    if (codeDiff !== 0) {
      return codeDiff;
    }

    return right.id.localeCompare(left.id);
  })[0];
}

export function chooseAiClaim(options, hand) {
  const win = options.find((option) => option.type === "win");
  if (win) {
    return win;
  }

  const kong = options.find((option) => option.type === "kong");
  if (kong) {
    return kong;
  }

  const pong = options.find((option) => option.type === "pong");
  if (pong) {
    return pong;
  }

  const chowOptions = options.filter((option) => option.type === "chow");
  if (!chowOptions.length) {
    return undefined;
  }

  const bestChow = [...chowOptions].sort(
    (left, right) => chowBenefit(right, hand) - chowBenefit(left, hand),
  )[0];

  return chowBenefit(bestChow, hand) >= 2 ? bestChow : undefined;
}

export function chooseAiSelfAction(options) {
  const win = options.find((option) => option.type === "win");
  if (win) {
    return win;
  }

  return options.find((option) => option.type === "kong");
}
