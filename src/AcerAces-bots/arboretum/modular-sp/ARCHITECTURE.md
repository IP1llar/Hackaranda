# Modular-SP Architecture Documentation

## Overview

The Modular-SP bot represents a significant evolution from the original strategic-pacifist implementation, introducing a highly modular and adaptable architecture that enables runtime strategy swapping and dynamic adaptation.

## Key Architectural Differences

### Original Strategic-Pacifist vs Modular-SP

| Aspect | Strategic-Pacifist | Modular-SP |
|--------|-------------------|------------|
| **Strategy Coupling** | Tightly coupled in single files | Loosely coupled, independent modules |
| **Strategy Switching** | Requires code changes and rebuild | Runtime hot-swapping via configuration |
| **State Management** | No persistent state between moves | Memory system for stateful strategies |
| **Extensibility** | Requires modifying existing code | Add new strategies without touching existing code |
| **Testing** | Difficult to test individual components | Each strategy can be tested in isolation |
| **Configuration** | Hard-coded strategy logic | Configurable via presets and custom combinations |

## Core Architecture Components

### 1. Strategy Interface System

```typescript
// Clear interfaces for each strategy type
export type DrawStrategy = (state: playerState<move>) => move;
export type PlayStrategy = (state: playerState<move>) => move;
export type DiscardStrategy = (state: playerState<move>) => move;
```

**Benefits:**
- Type safety ensures all strategies conform to expected interface
- Easy to swap implementations without breaking the system
- Clear separation of concerns

### 2. Strategy Registry

```typescript
// Central registry of all available strategies
export let activeStrategies = {
    draw: strategicDraw,
    play: strategicPlay,
    discard: strategicDiscard
};

// Hot-swapping capability
export function setStrategies(newStrategies: Partial<typeof activeStrategies>) {
    activeStrategies = { ...activeStrategies, ...newStrategies };
}
```

**Benefits:**
- Runtime strategy switching
- No need to restart or rebuild
- Easy to implement adaptive behavior

### 3. Preset System

```typescript
export const strategyPresets = {
    random: { draw: randomDraw, play: greedyPlay, discard: safeDiscard },
    strategic: { draw: strategicDraw, play: strategicPlay, discard: strategicDiscard },
    aggressive: { draw: strategicDraw, play: greedyPlay, discard: strategicDiscard },
    defensive: { draw: strategicDraw, play: strategicPlay, discard: safeDiscard }
};
```

**Benefits:**
- Quick configuration for common use cases
- Easy to experiment with different combinations
- Consistent strategy sets across different scenarios

### 4. Memory System

```typescript
export type StrategyMemory = {
    gamePhase?: 'early' | 'mid' | 'late';
    preferredSpecies?: species[];
    opponentPatterns?: { aggressive?: boolean; defensive?: boolean; };
    lastMoves?: { draw?: drawingMove; play?: playMove; discard?: discardMove; };
    [key: string]: any; // Allow custom memory fields
};
```

**Benefits:**
- Strategies can maintain state across moves
- Enables complex adaptive behaviors
- No global state pollution

## Strategy Implementation Patterns

### 1. Pure Function Strategy

```typescript
// Simple, stateless strategy
export function randomDraw(state: playerState<move>): move {
    const options: drawingMove[] = [];
    if (state.deck > 0) options.push(drawingMove.Deck);
    if (state.discard.length > 0) options.push(drawingMove.OwnDiscard);
    if (state.opponentDiscard.length > 0) options.push(drawingMove.OpponentDiscard);
    
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex]!;
}
```

### 2. Stateful Strategy

```typescript
// Strategy that maintains state
export function adaptiveDraw(state: playerState<move>): move {
    if (!state.memory) {
        state.memory = { consecutiveDeckDraws: 0, lastDrawSource: null };
    }
    
    // Use memory to make decisions
    if (state.memory.consecutiveDeckDraws < 3) {
        state.memory.consecutiveDeckDraws++;
        return drawingMove.Deck;
    }
    
    // Reset counter and choose different source
    state.memory.consecutiveDeckDraws = 0;
    return drawingMove.OwnDiscard;
}
```

### 3. Composite Strategy

```typescript
// Strategy that combines multiple approaches
export function hybridPlay(state: playerState<move>): move {
    const gamePhase = determineGamePhase(state);
    
    switch (gamePhase) {
        case 'early':
            return foundationPlay(state);
        case 'mid':
            return expansionPlay(state);
        case 'late':
            return scoringPlay(state);
    }
}
```

## Dynamic Adaptation System

### 1. Game Phase Detection

```typescript
export function adaptStrategies(state: playerState<move>) {
    const cardsPlayed = Object.keys(state.playArea).length;
    
    if (cardsPlayed < 3) {
        state.memory.gamePhase = 'early';
        setStrategies({ play: foundationPlay });
    } else if (cardsPlayed < 8) {
        state.memory.gamePhase = 'mid';
        setStrategies({ play: expansionPlay });
    } else {
        state.memory.gamePhase = 'late';
        setStrategies({ play: scoringPlay });
    }
}
```

### 2. Opponent-Based Adaptation

```typescript
export function adaptToOpponent(opponentId: string) {
    if (opponentId.includes('aggressive')) {
        setStrategies({ discard: defensiveDiscard });
    } else if (opponentId.includes('random')) {
        setStrategies({ play: greedyPlay });
    }
}
```

## Performance Considerations

### 1. Strategy Switching Overhead

- **Minimal Impact**: Strategy switching is just function pointer assignment
- **No Recompilation**: Strategies are pre-compiled and cached
- **Memory Efficient**: Only active strategies are loaded

### 2. Memory Management

- **Controlled Growth**: Memory is scoped to individual games
- **Automatic Cleanup**: Memory is reset between games
- **Type Safety**: Memory structure is defined and validated

### 3. Compilation Optimization

- **Tree Shaking**: Unused strategies can be eliminated during build
- **Module Splitting**: Strategies can be loaded on-demand
- **Caching**: Compiled strategies are cached for reuse

## Testing Strategy

### 1. Unit Testing

```typescript
// Test individual strategies in isolation
describe('strategicDraw', () => {
    it('should prefer deck when ahead', () => {
        const state = createMockState({ deck: 10, isAhead: true });
        const result = strategicDraw(state);
        expect(result).toBe(drawingMove.Deck);
    });
});
```

### 2. Integration Testing

```typescript
// Test strategy combinations
describe('aggressive preset', () => {
    it('should use greedy play strategy', () => {
        applyPreset('aggressive');
        expect(activeStrategies.play).toBe(greedyPlay);
    });
});
```

### 3. Performance Testing

```typescript
// Test strategy switching performance
describe('strategy switching', () => {
    it('should complete within 1ms', () => {
        const start = performance.now();
        setStrategies({ draw: randomDraw });
        const end = performance.now();
        expect(end - start).toBeLessThan(1);
    });
});
```

## Migration from Strategic-Pacifist

### 1. Strategy Extraction

Original strategic-pacifist logic has been extracted into:
- `drawStrategies/strategicDraw.ts` - Draw logic from `draw.ts`
- `playStrategies/strategicPlay.ts` - Play logic from `play.ts`
- `discardStrategies/strategicDiscard.ts` - Discard logic from `discard.ts`

### 2. Helper Functions

All utility functions from `helpers.ts` remain unchanged and are shared across strategies.

### 3. Type Compatibility

The `types.ts` file maintains full compatibility with the original implementation.

## Future Enhancements

### 1. Strategy Composition

```typescript
// Future: Compose strategies from smaller components
export function composeStrategy(
    baseStrategy: PlayStrategy,
    modifiers: StrategyModifier[]
): PlayStrategy {
    return (state) => {
        let result = baseStrategy(state);
        for (const modifier of modifiers) {
            result = modifier(result, state);
        }
        return result;
    };
}
```

### 2. Machine Learning Integration

```typescript
// Future: ML-based strategy selection
export function mlStrategySelector(state: playerState<move>): StrategySet {
    const features = extractFeatures(state);
    const prediction = mlModel.predict(features);
    return selectStrategies(prediction);
}
```

### 3. Strategy Evolution

```typescript
// Future: Genetic algorithm for strategy optimization
export function evolveStrategies(
    population: StrategySet[],
    fitnessScores: number[]
): StrategySet[] {
    return geneticAlgorithm.evolve(population, fitnessScores);
}
```

## Conclusion

The Modular-SP architecture provides a solid foundation for:
- **Rapid experimentation** with different strategy combinations
- **Easy maintenance** and extension of bot capabilities
- **Performance optimization** through targeted strategy selection
- **Research and development** of new Arboretum playing techniques

This modular approach makes the bot significantly more adaptable and maintainable compared to the original monolithic implementation, while preserving all the strategic insights and algorithmic improvements from the strategic-pacifist version. 