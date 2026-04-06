import { seatDistance } from "./setup";

const claimPriority = {
  win: 3,
  kong: 2,
  pong: 2,
  chow: 1,
};

export function getClaimPriorityQueue(discardSeat, candidates) {
  const entries = Object.entries(candidates)
    .map(([seat, options]) => {
      if (!options.length) {
        return undefined;
      }

      const highestPriority = Math.max(...options.map((option) => claimPriority[option.type]));
      return {
        seat,
        options: options.filter((option) => claimPriority[option.type] === highestPriority),
        priority: highestPriority,
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (right.priority !== left.priority) {
        return right.priority - left.priority;
      }

      return seatDistance(discardSeat, left.seat) - seatDistance(discardSeat, right.seat);
    });

  return entries.map((entry) => ({
    seat: entry.seat,
    fromSeat: discardSeat,
    options: entry.options,
    discard:
      entry.options[0].tiles.find((tile) => tile.id === entry.options[0].claimedTileId) ??
      entry.options[0].tiles[0],
  }));
}
