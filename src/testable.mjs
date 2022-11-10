// TODO: Singletons or global variables
// TODO: File system
// TODO: Network sockets

// Time: days until Christmas

const millisPerDay = 24 * 60 * 60 * 1000;

export function daysUntilChristmas(now) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const christmasDay = new Date(now.getFullYear(), 12 - 1, 25);
  if (today.getTime() > christmasDay.getTime()) {
    christmasDay.setFullYear(now.getFullYear() + 1);
  }
  const diffMillis = christmasDay.getTime() - today.getTime();
  return Math.floor(diffMillis / millisPerDay);
}

// TODO: Concurrency

// Randomness: rolling dice in a dice game

export function diceRoll() {
  const min = 1;
  const max = 6;
  return Math.floor(Math.random() * (max + 1 - min) + min);
}

export function diceHandValue(die1, die2) {
  if (die1 === die2) {
    // one pair
    return 100 + die1;
  } else {
    // high die
    return Math.max(die1, die2);
  }
}
