export const SUIT_CODES = ["m", "s", "p"];
export const HONOR_CODES = ["east", "south", "west", "north", "red", "green", "white"];

const suitedCodes = SUIT_CODES.flatMap((suit) =>
  [1, 2, 3, 4, 5, 6, 7, 8, 9].map((rank) => `${suit}${rank}`),
);

export const ALL_TILE_CODES = [...suitedCodes, ...HONOR_CODES];

const suitLabelMap = {
  m: "万",
  s: "条",
  p: "筒",
};

const honorLabelMap = {
  east: "东",
  south: "南",
  west: "西",
  north: "北",
  red: "中",
  green: "發",
  white: "白",
};

export function getTileIndex(code) {
  return ALL_TILE_CODES.indexOf(code);
}

export function isHonorTile(code) {
  return HONOR_CODES.includes(code);
}

export function getTileSuit(code) {
  if (isHonorTile(code)) {
    return undefined;
  }

  return code[0];
}

export function getTileRank(code) {
  if (isHonorTile(code)) {
    return undefined;
  }

  return Number(code.slice(1));
}

export function compareTileCodes(left, right) {
  return getTileIndex(left) - getTileIndex(right);
}

export function sortTileInstances(tiles) {
  return [...tiles].sort((left, right) => {
    const codeDiff = compareTileCodes(left.code, right.code);
    if (codeDiff !== 0) {
      return codeDiff;
    }

    return left.id.localeCompare(right.id);
  });
}

export function formatTile(code) {
  if (isHonorTile(code)) {
    return honorLabelMap[code];
  }

  return `${code.slice(1)}${suitLabelMap[code[0]]}`;
}

export function getTileFaceMeta(code) {
  if (isHonorTile(code)) {
    const accent =
      code === "red" ? "text-rose-700" : code === "green" ? "text-emerald-700" : "text-slate-700";
    const sub = ["east", "south", "west", "north"].includes(code) ? "风牌" : "箭牌";

    return {
      main: honorLabelMap[code],
      sub,
      accent,
    };
  }

  const suit = getTileSuit(code);
  const accent =
    suit === "m" ? "text-stone-800" : suit === "s" ? "text-emerald-700" : "text-sky-700";

  return {
    main: code.slice(1),
    sub: suitLabelMap[suit],
    accent,
  };
}

export function tileCountsFromCodes(codes) {
  const counts = new Array(ALL_TILE_CODES.length).fill(0);

  for (const code of codes) {
    counts[getTileIndex(code)] += 1;
  }

  return counts;
}
