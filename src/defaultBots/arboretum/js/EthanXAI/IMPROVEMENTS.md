# EthanXAI Bot - Strategic Improvement Plan

## Current Performance Analysis 📊

### Test Results Summary:
- **v1 vs v2:** v1 wins 34-25 ✅ (v2 scored points!)
- **v2 vs Decent:** Decent wins 23-4 ❌ (still losing badly)

### Key Observations:

**What's Working:**
- ✅ v2 is maintaining scoring rights on some species (scored 25 points vs v1)
- ✅ Keeping higher-value cards in hand (R6 R7 R8, O2 O5 O6 O8)
- ✅ Playing lower-rank cards to board

**Critical Weakness:**
- ❌ **Not accounting for opponent's strategy/blocking**
- ❌ Opponent can easily identify which species we're collecting
- ❌ Opponent holds high cards to block our scoring rights
- ❌ We're predictable and exploitable

### Example from v2 vs Decent:
- **Our Oak hand:** O2 O5 O6 O8 (sum = 21)
- **Our Oak score:** 0 points
- **Why?** Decent must have had Oak with sum ≥ 22, blocking us completely
- We invested heavily in Oak but got ZERO return

---

## Root Cause: No Opponent Modeling 🎯

Our bot currently:
1. Focuses on maximizing OUR species sums
2. Builds arboretums for OUR paths
3. **Ignores what opponent is collecting**

Decent bot:
1. Sees we're collecting Oak (from our plays/discards)
2. Holds Oak high-cards to block us
3. Focuses on species we're NOT protecting

**Result:** We do all the work, opponent blocks us and scores freely.

---

## Proposed Improvements 🚀

### Phase 1: Opponent Awareness (High Priority)

#### 1. **Track Opponent's Collection Strategy**
```javascript
// Add to heuristics or new module
function inferOpponentStrategy(state) {
  const opponentPlayedSpecies = countSpeciesInPlayArea(state.opponentPlayArea);
  const opponentDiscards = countSpeciesInArray(state.opponentDiscard);
  
  // Species they're playing a lot = they're collecting it
  // Species they're discarding = they're abandoning it
  
  return {
    collecting: [...], // Species with high play area count
    abandoning: [...]  // Species with high discard count
  };
}
```

**Impact:** Know which species to compete for vs abandon

#### 2. **Defensive Card Retention**
```javascript
// When deciding what to keep in hand
function calculateDefensiveValue(card, state, opponentStrategy) {
  const [species, rank] = card;
  
  // If opponent is collecting this species:
  if (opponentStrategy.collecting.includes(species)) {
    // High ranks are VERY valuable (blocking power)
    return rank >= 6 ? 50 : 20;
  }
  
  // If we're collecting it:
  if (ourStrategy.collecting.includes(species)) {
    // Keep for scoring rights
    return rank * 2;
  }
  
  // Otherwise, low value
  return 5;
}
```

**Impact:** Hold high cards of species opponent needs (blocking strategy)

#### 3. **Species Portfolio Strategy**
Instead of greedy collection, use portfolio theory:
- **Primary species (2):** Species opponent is NOT collecting heavily
- **Blocking species (2):** Species opponent IS collecting (hold high cards)
- **Abandoned species (2):** Discard everything

**Questions for you:**
- Should we always have exactly 2 primary species, or dynamic based on hand?
- How early should we commit to a portfolio? (Turn 1? After seeing 5 opponent plays?)
- Should we ever switch species mid-game if opponent starts blocking us?

---

### Phase 2: Improved MCTS Evaluation (Medium Priority)

#### 4. **Rollout Score = Own Score - Opponent Block Potential**
```javascript
function betterApproximateScore(playArea, hand, opponentHand, opponentStrategy) {
  let score = 0;
  
  for (const species of SPECIES) {
    const ourSum = sumSpecies(hand, species);
    const theirSum = sumSpecies(opponentHand, species);
    
    if (ourSum > theirSum) {
      const pathScore = estimatePathScore(playArea, species);
      score += pathScore;
    }
    
    // CRITICAL: Penalize if opponent could easily block us
    if (ourSum - theirSum < 5 && ourSum > 0) {
      // Close call - risky investment
      score -= 10; // Penalty for fragile scoring rights
    }
  }
  
  // Bonus for blocking opponent
  for (const species of opponentStrategy.collecting) {
    const ourSum = sumSpecies(hand, species);
    const theirSum = sumSpecies(opponentHand, species);
    if (ourSum > theirSum) {
      score += 15; // Blocking bonus
    }
  }
  
  return score;
}
```

**Questions for you:**
- What should the penalty be for "risky" species (close scoring rights)?
- Should we completely abandon species if opponent has clear advantage (e.g., they have 3 high cards, we have 2 low)?
- How much should we value blocking vs. building our own paths?

#### 5. **Determinization with Opponent Modeling**
```javascript
// When sampling opponent's hand, bias toward their strategy
function smartDeterminizeOpponentHand(state, opponentStrategy) {
  const unseenCards = getUnseenCards(state);
  
  // Bias: opponent likely holds HIGH cards of species they're collecting
  const biasedSample = [];
  
  for (const species of opponentStrategy.collecting) {
    const highCards = unseenCards.filter(c => 
      c[0] === species && c[1] >= 6
    );
    // More likely to have these
    biasedSample.push(...sampleSome(highCards, 2));
  }
  
  // Fill rest randomly
  // ...
}
```

**Questions for you:**
- Should determinization always assume opponent plays optimally (worst case)?
- Or use probabilistic inference (they MIGHT have high cards)?
- How much should late-game determinization differ from early game?

---

### Phase 3: Tactical Improvements (Lower Priority)

#### 6. **Discard Deception**
```javascript
// Sometimes discard cards we actually want to collect
// To mislead opponent about our strategy
function deceptiveDiscard(state) {
  if (Math.random() < 0.2 && earlyGame(state)) {
    // 20% chance in early game: discard a card we're collecting
    // To hide our strategy
  }
}
```

**Questions for you:**
- Is deception worth the cost? (We lose a card)
- At what stage should we stop being deceptive and go all-in?

#### 7. **Dynamic Time Allocation**
```javascript
// Spend MORE time on critical decisions
function getDynamicTimeBudget(state, moveType) {
  if (moveType === 'play' && lateGame(state)) {
    return 800; // More time for crucial plays
  }
  if (moveType === 'draw' && earlyGame(state)) {
    return 200; // Less time for simple draws
  }
  return 600; // Default
}
```

**Questions for you:**
- Which moves deserve more thinking time?
- Should we save time budget across a turn? (Fast draw = more time for play)

---

## Questions for Direction 🤔

### Strategic Philosophy:
1. **Aggression vs. Defense:** Should we prioritize blocking opponent (defensive) or building our own paths (aggressive)? 50/50? 70/30?

2. **Species Commitment:** When should we "lock in" to 2-3 species? Turn 3? After first discard phase? Never (stay flexible)?

3. **Risk Tolerance:** Should we prefer:
   - Safe species (opponent not collecting, lower ceiling)
   - Contested species (opponent IS collecting, higher ceiling but risky)

4. **Information Use:** How much should we trust inferences about opponent's hand?
   - Conservative: Assume they have perfect cards
   - Realistic: Use probability based on visible cards
   - Optimistic: Assume they don't have blockers

### Implementation Priorities:
Which improvements should I tackle first? Rank these:
- [ ] Opponent strategy tracking
- [ ] Defensive card retention  
- [ ] Species portfolio strategy
- [ ] MCTS evaluation with blocking
- [ ] Smart determinization
- [ ] Discard deception
- [ ] Dynamic time allocation

### Win Condition:
What's the target?
- Beat Random 80%?
- Beat Decent 50%?
- Beat Decent 30% (if Decent is very strong)?

---

## Debugging Information Needed 🔍

To improve development, I need to log:

### 1. **Decision Rationale**
```javascript
// For each move, log:
{
  move: "play J3 at [1,0]",
  heuristicChoice: "J4 at [0,1]",
  mctsChoice: "J3 at [1,0]",
  mctsWinRate: 0.63,
  confidence: 0.18,
  usedMCTS: true,
  reason: "MCTS confident (18% gap)"
}
```

**Why:** Understand when MCTS helps vs hurts

### 2. **Species Strategy Log**
```javascript
{
  turn: 5,
  ourStrategy: {
    collecting: ["M", "W"],
    blocking: ["J", "R"],
    abandoned: ["C", "O"]
  },
  opponentStrategy: {
    collecting: ["J", "C"],  // inferred
    abandoning: ["W"]        // inferred
  },
  handSums: { M: 18, W: 15, J: 7, ... }
}
```

**Why:** Track if our portfolio strategy is working

### 3. **MCTS Statistics**
```javascript
{
  phase: "play",
  timeBudget: 600,
  timeUsed: 587,
  simulationsRun: 234,
  movesEvaluated: 42,
  bestMove: { winRate: 0.65, trials: 128 },
  secondBest: { winRate: 0.47, trials: 106 }
}
```

**Why:** Optimize time usage and simulation count

### 4. **Scoring Rights Timeline**
```javascript
{
  turn: 8,
  scoringRights: {
    gained: ["M"],  // Species we got rights to
    lost: ["J"],    // Species opponent took from us
    maintained: ["W", "C"]
  },
  projectedScore: 28,
  opponentProjectedScore: 31
}
```

**Why:** Track when we lose scoring rights (blocking events)

### 5. **Rollout Accuracy**
```javascript
{
  predicted: { ourScore: 25, theirScore: 20 },
  actual: { ourScore: 18, theirScore: 27 },
  error: 14  // Sum of absolute errors
}
```

**Why:** Tune approximate scoring function

### Implementation:
Should logging be:
- **Always on:** Write to stderr (visible in console)
- **Debug mode:** Environment variable `DEBUG=true`
- **Post-game only:** Summary after game ends

**Storage:**
- Log to file? (e.g., `logs/ethan-xai-game-{id}.json`)
- Or just console output?

---

## Next Steps 

Once you answer the questions above, I'll implement in this order:
1. Opponent strategy tracking module
2. Defensive card retention in heuristics
3. Updated MCTS evaluation with blocking
4. Logging/debugging infrastructure
5. Test and iterate

What's your priority? 🚀
