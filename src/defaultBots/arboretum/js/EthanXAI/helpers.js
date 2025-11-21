/**
 * Helper functions for bot logic
 */

/**
 * Pick a random element from an array
 * @param {Array} array - Array to pick from
 * @returns {*} Random element
 */
function pickRandomFromArray(array) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

/**
 * Find a valid adjacent coordinate in the play area
 * @param {Object} playArea - Current play area
 * @returns {Array} [x, y] coordinate
 */
function findValidCoordinate(playArea) {
  // Get all empty adjacent spaces
  const emptySpaces = getAllEmptyAdjacentSpaces(playArea);
  
  // Return a random empty space
  if (emptySpaces.length > 0) {
    return pickRandomFromArray(emptySpaces);
  }
  
  // Fallback (shouldn't happen in valid game state)
  return [1, 0];
}

/**
 * Get all empty spaces adjacent to existing cards
 * Uses BFS to find all cards and their adjacent empty spaces
 * @param {Object} playArea - Current play area
 * @returns {Array} Array of [x, y] coordinates
 */
function getAllEmptyAdjacentSpaces(playArea) {
  // If play area is empty, return origin
  if (Object.keys(playArea).length === 0) {
    return [[0, 0]];
  }
  
  const toVisit = [[0, 0]];
  const visited = new Set();
  const emptySpaces = [];
  
  while (toVisit.length > 0) {
    const [x, y] = toVisit.pop();
    const coordKey = `${x},${y}`;
    
    // Skip if already visited
    if (visited.has(coordKey)) {
      continue;
    }
    visited.add(coordKey);
    
    // Check if this coordinate has a card
    const card = playArea[x]?.[y];
    
    if (card === undefined) {
      // Empty space - add to results
      emptySpaces.push([x, y]);
      continue;
    }
    
    // Card exists - check all adjacent positions
    const adjacentCoords = [
      [x - 1, y],     // left
      [x + 1, y],     // right
      [x, y - 1],     // down
      [x, y + 1]      // up
    ];
    
    for (const coord of adjacentCoords) {
      const adjKey = `${coord[0]},${coord[1]}`;
      if (!visited.has(adjKey)) {
        toVisit.push(coord);
      }
    }
  }
  
  return emptySpaces;
}

/**
 * Convert a card to a string for comparison
 * @param {Array} card - Card [species, rank]
 * @returns {string} String representation
 */
function cardToString(card) {
  return `${card[0]}-${card[1]}`;
}

/**
 * Get all cards of a specific species from play area
 * @param {Object} playArea - Play area to search
 * @param {string} species - Species to find
 * @returns {Array} Array of cards with their coordinates: [[card, [x, y]], ...]
 */
function getCardsOfSpecies(playArea, species) {
  const cards = [];
  
  for (const x in playArea) {
    for (const y in playArea[x]) {
      const card = playArea[x][y];
      if (card[0] === species) {
        cards.push([card, [parseInt(x), parseInt(y)]]);
      }
    }
  }
  
  return cards;
}

/**
 * Calculate the sum of ranks for a species in hand
 * @param {Array} hand - Your hand
 * @param {string} species - Species to sum
 * @returns {number} Total rank value
 */
function sumSpeciesInHand(hand, species) {
  let sum = 0;
  
  for (const card of hand) {
    const [cardSpecies, rank] = card;
    if (cardSpecies === species) {
      sum += rank;
    }
  }
  
  return sum;
}

/**
 * Get all species present in hand
 * @param {Array} hand - Your hand
 * @returns {Array} Array of unique species
 */
function getSpeciesInHand(hand) {
  const species = new Set();
  
  for (const card of hand) {
    species.add(card[0]);
  }
  
  return Array.from(species);
}

/**
 * Count total cards in play area
 * @param {Object} playArea - Play area to count
 * @returns {number} Number of cards
 */
function countCardsInPlayArea(playArea) {
  let count = 0;
  
  for (const x in playArea) {
    for (const y in playArea[x]) {
      count++;
    }
  }
  
  return count;
}

/**
 * Check if two cards are the same
 * @param {Array} card1 - First card [species, rank]
 * @param {Array} card2 - Second card [species, rank]
 * @returns {boolean} True if cards match
 */
function cardsEqual(card1, card2) {
  return card1[0] === card2[0] && card1[1] === card2[1];
}

module.exports = {
  pickRandomFromArray,
  findValidCoordinate,
  getAllEmptyAdjacentSpaces,
  cardToString,
  getCardsOfSpecies,
  sumSpeciesInHand,
  getSpeciesInHand,
  countCardsInPlayArea,
  cardsEqual
};
