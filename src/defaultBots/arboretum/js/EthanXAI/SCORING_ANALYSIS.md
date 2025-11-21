# Arboretum Scoring System - Actual Rules

## How Scoring REALLY Works

### Basic Path Score Formula

```
Base Score = path.length (number of cards in path)

BONUSES:
+ path.length (if same species AND path length ≥ 4)
+ 1 (if starts with rank 1)
+ 2 (if ends with rank 8)
```

### Important: Path Length = 1 scores ZERO!

```javascript
if (path.length === 1) {
  return 0;  // Single card = no score!
}
```

A lone card doesn't score at all!

---

## Scoring Examples From Tests

### Example 1: Simple Paths

**Layout:**
```
O6 - O5
     O4 - O1
```

**Oak path:** O1 → O4 → O5 → O6 (4 cards, ascending, connected)

**Score calculation:**
- Base: 4 (path length)
- Same species bonus (≥4): +4 
- Starts with 1: +1
- Ends with 8: +0
- **Total: 9 points**

### Example 2: Short Paths (No Bonus)

**Layout:**
```
J8
J3
```

**Jacaranda path:** J3 → J8 (2 cards)

**Score calculation:**
- Base: 2 (path length)
- Same species bonus: +0 (only for ≥4 cards)
- Starts with 1: +0
- Ends with 8: +2
- **Total: 4 points**

But wait, the test shows J scores 7! Let me check...

**Actually:** J3 → ... → J8 must be part of longer path
- J3 → ?? → ?? → J8 (4+ cards)
- Base: 4
- Same species: +4
- Ends with 8: +2
- **Total: 10 points minimum**

### Example 3: Perfect 8-Card Path (Maximum)

**Layout (from test):**
```
O1 - O2 - O3 - O4 - O5 - O6 - O7 - O8
```

**Oak path:** All 8 cards in sequence

**Score calculation:**
- Base: 8 (path length)
- Same species bonus (≥4): +8
- Starts with 1: +1
- Ends with 8: +2
- **Total: 19 points** ✅ (matches test!)

---

## Scoring Ranges (CORRECTED)

### 2-Card Path
```
Base: 2
Bonus: 0 (too short for species bonus)
Start 1: +1 (max)
End 8: +2 (max)
Range: 2-5 points
```

### 3-Card Path
```
Base: 3
Bonus: 0 (still too short)
Start 1: +1
End 8: +2
Range: 3-6 points
```

### 4-Card Path (Bonus Triggers!)
```
Base: 4
Bonus: +4 (same species ≥4)
Start 1: +1
End 8: +2
Range: 8-11 points
```

**Notice the jump!** 3 cards = max 6 points, 4 cards = min 8 points

### 5-Card Path
```
Base: 5
Bonus: +5
Start 1: +1
End 8: +2
Range: 10-13 points
```

### 6-Card Path
```
Base: 6
Bonus: +6
Start 1: +1
End 8: +2
Range: 12-15 points
```

### 8-Card Path (Maximum Possible)
```
Base: 8
Bonus: +8
Start 1: +1
End 8: +2
Total: 19 points (absolute maximum per species)
```

---

## Key Insights

### 1. The 4-Card Threshold is CRITICAL

**3-card path:** Max 6 points
**4-card path:** Min 8 points

The bonus **doubles** the score for paths ≥4 cards!

**Strategic implication:** Getting that 4th card of a species is HUGE

### 2. Single Cards Are Worthless

You MUST have at least 2 connected cards to score anything.

**Strategic implication:** Don't play isolated cards unless setting up future connections

### 3. Start/End Bonuses Are Small

- Rank 1 start: +1 point
- Rank 8 end: +2 points

**Together:** Only +3 points max (15-20% of typical path score)

**Strategic implication:** 
- Don't sacrifice connectivity for 1s/8s
- But if you're building a 4+ path anyway, prioritize 1-start or 8-end

### 4. Maximum Realistic Scores

**Per species:**
- Small path (2-3 cards): 2-6 points
- Medium path (4-5 cards): 8-13 points
- Large path (6+ cards): 12-19 points

**Total game score:**
- Weak: 10-20 points (1-2 species, short paths)
- Average: 25-40 points (2-3 species, medium paths)
- Strong: 45-60 points (3-4 species, longer paths)
- Exceptional: 70+ points (4+ species with 4+ card paths)

---

## How Our Bot Misunderstood Scoring

### What We Thought:
```javascript
// We approximated path score as: sum of ranks × 0.7
// For O1+O4+O5+O6 (sum=16): 16 × 0.7 = 11.2 points
```

### Actual Score:
```javascript
// Real calculation:
// Length: 4
// Bonus (≥4 same species): +4
// Starts with 1: +1
// Total: 9 points
```

**We were close!** But our approximation didn't account for:
1. The length mattering more than rank values
2. The critical 4-card threshold
3. Single cards scoring zero

---

## What This Means For Strategy

### Priority 1: Build 4+ Card Paths

**3-card path:** 3-6 points (weak)
**4-card path:** 8-11 points (2x better!)

The jump from 3→4 cards is worth more than any other single card addition.

### Priority 2: Multiple Species > One Giant Path

**Scenario A:** One 8-card path
- Score: 19 points

**Scenario B:** Two 4-card paths
- Score: 8 + 8 = 16 points (close!)
- But you need scoring rights on both species

**Scenario C:** Three 4-card paths
- Score: 8 + 8 + 8 = 24 points (better!)

Diversification is powerful if you can maintain scoring rights.

### Priority 3: Connectivity > Card Rank

A connected O1-O2-O3-O4 scores 9 points.
A disconnected O5, O6, O7, O8 scores ZERO.

**Implication:** Don't prioritize high-rank cards for board play - prioritize cards that extend existing paths.

### Priority 4: Scoring Rights Are Everything

Perfect 8-card path with scoring rights: 19 points
Perfect 8-card path without rights: 0 points

Losing scoring rights negates ALL your work on that species.

---

## How This Should Change Our Bot

### Current Heuristics Problems

**Play heuristic:** Penalizes playing ranks 6-8 (-30 penalty)
- **Issue:** Rank doesn't matter much for scoring! Length does.
- **Fix:** Prioritize extending existing paths to 4+ cards, regardless of rank

**Discard heuristic:** Keep high-rank cards
- **Correct!** This is for scoring rights, which is good

**MCTS evaluation:** approximateScore uses rankSum × 0.7
- **Issue:** Doesn't capture 4-card bonus properly
- **Fix:** Count paths ≥4 cards and give them proper weight

### Proposed Fixes

**1. Play Heuristic v3:**
```javascript
// Prioritize moves that:
// 1. Extend existing path from 3→4 cards (+100 value)
// 2. Extend existing path from 2→3 cards (+20 value)
// 3. Start new path adjacent to existing card (+10 value)
// 4. Card rank is irrelevant for path scoring
```

**2. MCTS Evaluation v3:**
```javascript
function betterApproximateScore(playArea, hand, opponentHand) {
  let score = 0;
  
  for (species with scoring rights) {
    const pathLength = countConnectedCards(playArea, species);
    
    if (pathLength >= 4) {
      score += pathLength * 2;  // Double for bonus
    } else {
      score += pathLength;
    }
    
    // Start/end bonuses
    if (hasRank1(path)) score += 1;
    if (hasRank8(path)) score += 2;
  }
  
  // Scoring rights bonuses (keep these!)
  score += scoringRightsCount * 10;
  score += handValue * 0.5;
  
  return score;
}
```

**3. Strategic Focus:**
- Aim for 3-4 species with 4+ card paths each (24-40 points)
- Rather than 1-2 species with long paths (15-25 points)
- Maintain scoring rights on ALL collected species (critical!)

---

## Summary

**Key Rules:**
1. Path length matters more than card ranks
2. 4-card threshold doubles your score
3. Single cards score ZERO
4. Start/end bonuses are small (+1, +2)
5. Maximum per species: 19 points

**Strategic Priorities:**
1. Get to 4 cards per species (massive bonus)
2. Maintain scoring rights (or score nothing)
3. Build multiple 4-card paths > one giant path
4. Connectivity > card ranks for board play

**Bot Changes Needed:**
1. Fix play heuristic to value path extension over rank
2. Update MCTS evaluation to properly weight 4+ card paths
3. Adjust strategy to target 3-4 species with 4+ cards each
