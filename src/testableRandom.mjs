// The randomness can't be removed completely, but now it's localized to just this one
// function. We can now write tests directly against this function, so we can test the
// random number generation in isolation, decoupled from other business logic.
export function diceRoll() {
  const min = 1;
  const max = 6;
  return Math.floor(Math.random() * (max + 1 - min) + min);
}

// By generating the random values outside this function and passing them as parameters,
// this becomes a pure function and is easy to test.
export function diceHandValue(die1, die2) {
  if (die1 === die2) {
    // one pair
    return 100 + die1;
  } else {
    // high die
    return Math.max(die1, die2);
  }
}
