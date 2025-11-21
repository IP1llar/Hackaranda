# Ethan XAI Bot - Version Changelog

## v4 - Path-Focused Strategy (Current)

**Release Date:** November 16, 2025

### Major Changes

#### 1. Fixed Scoring Approximation
- **Before:** Used `rankSum × 0.7` (incorrect model)
- **After:** Uses path length with proper 4+ card bonus
- Now correctly models: `base = pathLength`, `4+ cards = ×2`, `+1/+2 for rank 1/8`

#### 2. Updated Play Heuristic
- **Reduced rank penalties:** Playing high cards is now less penalized
  - Rank 7-8: -15 (was -30)
  - Rank 5-6: -5 (was -10)
- **Reason:** Connectivity matters more than card rank for scoring

#### 3. Massively Enhanced Path Building
- **4th card bonus:** +100 value (doubles score!)
- **3rd card bonus:** +30 value (one away from threshold)
- **2nd card bonus:** +15 value (starting a path)
- **Sequential placement:** +30 per adjacent sequential card
- **Same-species adjacency:** +20 per connection

#### 4. Better Evaluation in MCTS
- `approximateScore()` now estimates path lengths correctly
- Properly weights 4+ card paths (2× multiplier)
- Still includes strategic bonuses (+10 per scoring right, +0.5× hand value)

### Expected Improvements
- Better path construction (targets 4+ cards per species)
- More accurate move evaluation in MCTS
- Higher win rate against intermediate opponents

### Files Modified
- `scoring.js` - Fixed `approximateScore()` function
- `heuristics.js` - Updated `heuristicPlayMove()` and `estimatePlayScore()`

---

## v3 - Comprehensive Logging

**Release Date:** November 15, 2025

### Changes
- Added JSON logging to stderr and `/tmp/ethan-xai-logs/`
- 9 log types: DECISION, MCTS_STATS, SPECIES_STRATEGY, SCORING_RIGHTS, TIMING, etc.
- Created `analyze_logs.py` for post-game analysis
- Added opponent modeling infrastructure
- Created `LOGGING.md` documentation

### Performance
- Same strategy as v2
- Won 4-23 vs Decent bot (14.8% win rate)

### Files Added
- `logging.js`, `logToFile.js`, `opponentModel.js`
- `analyze_logs.py`, `LOGGING.md`

---

## v2 - Keep High Cards Strategy

**Release Date:** November 15, 2025

### Changes
- Play low-rank cards (1-3) to board
- Keep high-rank cards (6-8) in hand for scoring rights
- Prioritize discarding abandoned species

### Performance
- Won 25-34 vs v1 (42% win rate)
- Won 4-23 vs Decent bot (14.8% win rate)
- Massive improvement over v1 but still exploitable

### Problem Identified
- No opponent blocking strategy
- Couldn't compete with Decent's defensive play

---

## v1 - Pure MCTS (Initial)

**Release Date:** November 15, 2025

### Changes
- First implementation with MCTS
- 600ms time budget, 15% confidence threshold
- Basic heuristics (random fallback)

### Performance
- Lost 0-36 vs Decent bot (0% win rate)
- Scored zero points (lost all scoring rights)

### Critical Issue
- Didn't keep high cards in hand
- Lost all scoring rights every game
- Board building without strategic card retention

---

## Strategy Evolution Summary

| Version | Key Strategy | Performance vs Decent |
|---------|-------------|----------------------|
| v1 | Pure MCTS, no card retention | 0-36 (0%) |
| v2 | Keep high cards for rights | 4-23 (14.8%) |
| v3 | v2 + Logging | 4-23 (14.8%) |
| v4 | Path building (4+ cards) | TBD |

## Next Steps (Potential v5)

Based on `IMPROVEMENTS.md`:
1. Opponent blocking strategy
2. Filter legal moves before MCTS (90 → 20 moves)
3. Lower MCTS confidence threshold
4. Better determinization for hidden information
