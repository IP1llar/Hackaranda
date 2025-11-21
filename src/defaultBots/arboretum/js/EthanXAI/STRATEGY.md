# 🎯 **EthanXAI MCTS Bot - Implementation Plan**

## **Core Strategy: Adaptive MCTS with Heuristic Fallback**

### **Architecture Overview**
```
Every move type (draw/play/discard):
1. Calculate fast heuristic move (< 5ms)
2. Run MCTS for 600ms
3. If MCTS has high confidence → use MCTS
4. Otherwise → use heuristic fallback
```

---

## **Phase 1: Fast Heuristic Baseline** ⚡

### **Draw Heuristic:**
- Prefer discard piles if card matches most common species in hand
- Otherwise random valid draw

### **Play Heuristic:**
- Try all card+position combinations
- Score each with fast approximate scoring
- Pick highest immediate score

### **Discard Heuristic:**
- Discard card with lowest "keep value"
- Keep value = rank * (count of same species in hand)

---

## **Phase 2: MCTS Engine** 🎲

### **Core Components:**

**1. State Representation:**
```javascript
- Own hand (known)
- Opponent hand (determinized)
- Both play areas
- Both discards
- Deck size
- Current turn/subturn
```

**2. Determinization Strategy:**
```javascript
if (deckSize > 15) {
  // Early game: random opponent hand from remaining cards
  opponentHand = sampleRandomCards(unseenCards, 7);
} else {
  // Late game: information set - use card counting
  opponentHand = constrainedSample(unseenCards, visibleInfo);
}
```

**3. Rollout Policy (Lightweight Heuristics for Speed):**
```javascript
- Draw: prefer matching species > random
- Play: pick random card, place to extend longest path
- Discard: discard lowest rank
- Opponent: same lightweight heuristics
- Stop after: game end OR 10 moves OR 15ms elapsed
```

**4. MCTS Algorithm (Flat, No Tree):**
```javascript
for each legal move:
  trials = 0
  wins = 0
  
  while (time < 600ms):
    // Determinize hidden info
    simulatedState = determinizeState(currentState)
    
    // Apply this move
    newState = applyMove(simulatedState, move)
    
    // Rollout with fast heuristics
    finalScore = fastRollout(newState, maxDepth=10)
    
    trials++
    if (finalScore > opponentScore) wins++
  
  winRate[move] = wins / trials

return move with highest winRate
```

**5. Confidence Check:**
```javascript
bestWinRate = max(winRates)
secondBestWinRate = secondMax(winRates)

if (bestWinRate - secondBestWinRate > 0.15 && trials > 50):
  // MCTS is confident (>15% gap, enough samples)
  return MCTSmove
else:
  return heuristicMove
```

---

## **Phase 3: Efficient Scoring** 📊

### **Fast Path Scoring:**
```javascript
- Don't enumerate all paths (exponential)
- Use BFS to find longest valid path per species
- Valid path: same species, ascending ranks, connected
- Score = sum of ranks in longest path
- Winning species: sum(species in hand) > opponent's sum
```

### **Approximate Scoring (for rollouts):**
```javascript
- Only score species we have 2+ cards of
- Skip detailed path validation
- Use heuristic: cards_in_play * avg_rank
```

---

## **Phase 4: Optimizations** 🚀

### **Performance Tricks:**
1. **Move ordering**: Try promising moves first (extend existing paths)
2. **Early termination**: If one move has >80% win rate after 100 trials, stop
3. **Batch processing**: Evaluate similar positions together
4. **Preallocate arrays**: Avoid GC during hot loop
5. **Bitboards** (if time): Use integers for card representation

### **Code Structure:**
```
mcts.js          - Main MCTS engine
scoring.js       - Fast path scoring
heuristics.js    - Fallback strategies  
simulation.js    - Determinization & rollout
draw.js          - Calls MCTS with draw moves
play.js          - Calls MCTS with play moves
discard.js       - Calls MCTS with discard moves
```

---

## **Success Metrics** 📈

- ✅ Every move completes in < 1s
- ✅ MCTS runs 50+ simulations per move
- ✅ Beats "Random" bot >60% of time
- ✅ Competitive with "Decent" bot

---

## **Implementation Order:**

1. ✅ Fast heuristics (get baseline working)
2. ✅ Efficient scoring function
3. ✅ Determinization logic
4. ✅ MCTS core engine
5. ✅ Integrate into draw/play/discard
6. ✅ Test & tune parameters

---

## **Configuration Parameters:**

```javascript
const CONFIG = {
  MCTS_TIME_BUDGET: 600,        // ms per move for MCTS
  CONFIDENCE_THRESHOLD: 0.15,   // Win rate gap to trust MCTS
  MIN_TRIALS: 50,               // Minimum simulations before confidence check
  ROLLOUT_MAX_DEPTH: 10,        // Max moves per simulation
  ROLLOUT_TIME_LIMIT: 15,       // ms max per rollout
  EARLY_TERMINATION: 0.80,      // Stop if move has 80%+ win rate
  DECK_THRESHOLD: 15,           // Switch to information set determinization
};
```

---

**Ready to implement!** 🚀
