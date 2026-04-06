import { ALL_TILE_CODES, getTileIndex, isHonorTile, tileCountsFromCodes } from "../core/tiles";

function countsKey(counts, remainingMelds) {
  return `${remainingMelds}:${counts.join(",")}`;
}

function canFormMelds(counts, remainingMelds, memo) {
  if (remainingMelds === 0) {
    return counts.every((count) => count === 0);
  }

  const key = countsKey(counts, remainingMelds);
  if (memo.has(key)) {
    return memo.get(key);
  }

  const firstIndex = counts.findIndex((count) => count > 0);
  if (firstIndex === -1) {
    const result = remainingMelds === 0;
    memo.set(key, result);
    return result;
  }

  let result = false;

  if (counts[firstIndex] >= 3) {
    counts[firstIndex] -= 3;
    result = canFormMelds(counts, remainingMelds - 1, memo);
    counts[firstIndex] += 3;
  }

  if (!result && firstIndex < 27 && !isHonorTile(ALL_TILE_CODES[firstIndex])) {
    const suitBase = Math.floor(firstIndex / 9) * 9;
    const rankInSuit = firstIndex - suitBase;

    if (rankInSuit <= 6 && counts[firstIndex + 1] > 0 && counts[firstIndex + 2] > 0) {
      counts[firstIndex] -= 1;
      counts[firstIndex + 1] -= 1;
      counts[firstIndex + 2] -= 1;
      result = canFormMelds(counts, remainingMelds - 1, memo);
      counts[firstIndex] += 1;
      counts[firstIndex + 1] += 1;
      counts[firstIndex + 2] += 1;
    }
  }

  memo.set(key, result);
  return result;
}

export function checkWin(concealedCodes, exposedMeldCount = 0) {
  const remainingMelds = 4 - exposedMeldCount;
  if (remainingMelds < 0) {
    return false;
  }

  if (concealedCodes.length !== remainingMelds * 3 + 2) {
    return false;
  }

  const counts = tileCountsFromCodes(concealedCodes);
  const memo = new Map();

  for (const code of ALL_TILE_CODES) {
    const index = getTileIndex(code);
    if (counts[index] < 2) {
      continue;
    }

    counts[index] -= 2;
    if (canFormMelds(counts, remainingMelds, memo)) {
      counts[index] += 2;
      return true;
    }
    counts[index] += 2;
  }

  return false;
}

export function wouldWinWithTile(concealedCodes, winningCode, exposedMeldCount = 0) {
  return checkWin([...concealedCodes, winningCode], exposedMeldCount);
}
