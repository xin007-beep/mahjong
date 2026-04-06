import { sortTileInstances } from "./tiles";

export const SEAT_ORDER = ["east", "south", "west", "north"];

export const SEAT_LABEL = {
  east: "东",
  south: "南",
  west: "西",
  north: "北",
};

const BASE_CODES = [
  "m1",
  "m2",
  "m3",
  "m4",
  "m5",
  "m6",
  "m7",
  "m8",
  "m9",
  "s1",
  "s2",
  "s3",
  "s4",
  "s5",
  "s6",
  "s7",
  "s8",
  "s9",
  "p1",
  "p2",
  "p3",
  "p4",
  "p5",
  "p6",
  "p7",
  "p8",
  "p9",
  "east",
  "south",
  "west",
  "north",
  "red",
  "green",
  "white",
];

let tileIdCounter = 0;

function nextTileId(code) {
  tileIdCounter += 1;
  return `${code}-${tileIdCounter}`;
}

function shuffleTiles(list) {
  const items = [...list];

  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }

  return items;
}

function createPlayer(seat, isHuman) {
  return {
    seat,
    isHuman,
    hand: [],
    discards: [],
    melds: [],
  };
}

function drawMany(wall, count) {
  return wall.splice(0, count);
}

export function nextSeat(seat) {
  return SEAT_ORDER[(SEAT_ORDER.indexOf(seat) + 1) % SEAT_ORDER.length];
}

export function previousSeat(seat) {
  return SEAT_ORDER[(SEAT_ORDER.indexOf(seat) + SEAT_ORDER.length - 1) % SEAT_ORDER.length];
}

export function seatDistance(fromSeat, toSeat) {
  const fromIndex = SEAT_ORDER.indexOf(fromSeat);
  const toIndex = SEAT_ORDER.indexOf(toSeat);
  return (toIndex - fromIndex + SEAT_ORDER.length) % SEAT_ORDER.length;
}

export function createWall() {
  tileIdCounter = 0;
  const tiles = [];

  for (const code of BASE_CODES) {
    for (let index = 0; index < 4; index += 1) {
      tiles.push({ id: nextTileId(code), code });
    }
  }

  return shuffleTiles(tiles);
}

export function createInitialGameState() {
  const wall = createWall();
  const players = {
    east: createPlayer("east", false),
    south: createPlayer("south", true),
    west: createPlayer("west", false),
    north: createPlayer("north", false),
  };

  players.east.hand = sortTileInstances(drawMany(wall, 14));
  players.south.hand = sortTileInstances(drawMany(wall, 13));
  players.west.hand = sortTileInstances(drawMany(wall, 13));
  players.north.hand = sortTileInstances(drawMany(wall, 13));

  return {
    wall,
    deadWall: [],
    players,
    dealer: "east",
    currentTurn: "east",
    phase: "discard",
    pendingClaim: undefined,
    claimQueue: [],
    selectedTileId: undefined,
    remainingCount: wall.length,
    winner: undefined,
    lastDiscard: undefined,
    actionTimerMs: 0,
    turnNumber: 1,
    logs: ["东家坐庄，牌局开始。"],
  };
}
