# Modular Strategic Pacifist (Modular-SP) Bot

A highly modular and adaptable Arboretum bot implementation that allows for easy strategy swapping and dynamic adaptation.

## Architecture Overview

The Modular-SP bot is built around a pluggable strategy system where each decision type (draw, play, discard) can be independently configured and swapped at runtime.

### Core Components

1. **Strategy Types** (`strategies.ts`)
   - Defines the interface for each strategy type
   - Manages active strategy configuration
   - Provides preset configurations and dynamic adaptation

2. **Strategy Implementations**
   - `drawStrategies/` - Drawing decision logic
   - `playStrategies/` - Card placement logic  
   - `discardStrategies/` - Discard selection logic

3. **Shared Utilities** (`helpers.ts`)
   - Common game analysis functions
   - Scoring and evaluation utilities
   - Card categorization and path finding

4. **Main Handler** (`handleMove.ts`)
   - Routes game state to appropriate strategy
   - Manages strategy adaptation

## Strategy Types

### Draw Strategies
- **`randomDraw`** - Simple random selection from available options
- **`strategicDraw`** - Based on strategic-pacifist logic with hand analysis

### Play Strategies  
- **`greedyPlay`** - Maximizes immediate scoring opportunities
- **`strategicPlay`** - Balanced approach considering future paths and blocking

### Discard Strategies
- **`safeDiscard`** - Discards lowest value cards
- **`strategicDiscard`** - Considers opponent's hand and card categorization

## Usage

### Basic Usage
```typescript
import { handleMove } from './handleMove.js';

// The bot automatically uses strategic strategies by default
const move = handleMove(gameState);
```

### Strategy Configuration
```typescript
import { setStrategies, applyPreset } from './strategies.js';

// Use a preset configuration
applyPreset('aggressive'); // Uses strategic draw + greedy play + strategic discard

// Or configure individual strategies
setStrategies({
    draw: randomDraw,
    play: greedyPlay,
    discard: safeDiscard
});
```

### Available Presets
- **`random`** - All random/simple strategies
- **`strategic`** - All strategic strategies (default)
- **`aggressive`** - Strategic draw + greedy play + strategic discard
- **`defensive`** - Strategic draw + strategic play + safe discard

### Dynamic Adaptation
The bot automatically adapts strategies based on game phase:
- **Early game** (< 3 cards played): Foundation building focus
- **Mid game** (3-8 cards played): Balanced expansion
- **Late game** (> 8 cards played): Scoring maximization

## Creating Custom Strategies

### Draw Strategy Example
```typescript
// drawStrategies/myCustomDraw.ts
import type { playerState, move } from '../types.js';
import { drawingMove } from '../types.js';

export function myCustomDraw(state: playerState<move>): move {
    // Your custom logic here
    if (state.memory?.myCustomFlag) {
        return drawingMove.OpponentDiscard;
    }
    return drawingMove.Deck;
}
```

### Play Strategy Example
```typescript
// playStrategies/myCustomPlay.ts
import type { playerState, move } from '../types.js';

export function myCustomPlay(state: playerState<move>): move {
    // Your custom placement logic
    const card = state.hand[0]!;
    const coord: [number, number] = [0, 0];
    return { card, coord };
}
```

### Using Custom Strategies
```typescript
import { setStrategies } from './strategies.js';
import { myCustomDraw } from './drawStrategies/myCustomDraw.js';
import { myCustomPlay } from './playStrategies/myCustomPlay.js';

setStrategies({
    draw: myCustomDraw,
    play: myCustomPlay
    // discard remains unchanged
});
```

## Stateful Strategies

Strategies can maintain state using the `memory` field:

```typescript
export function statefulStrategy(state: playerState<move>): move {
    // Initialize memory if needed
    if (!state.memory) {
        state.memory = { myCounter: 0 };
    }
    
    // Use and update memory
    state.memory.myCounter++;
    
    if (state.memory.myCounter > 5) {
        // Change behavior after 5 moves
        return alternativeMove(state);
    }
    
    return defaultMove(state);
}
```

## Building and Running

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run the bot
npm start
```

## Docker

```bash
# Build image
docker build -t modular-sp .

# Run container
docker run -i modular-sp
```

## Key Features

- **Hot-swappable strategies** - Change strategies at runtime
- **Preset configurations** - Quick strategy combinations
- **Dynamic adaptation** - Automatic strategy adjustment based on game state
- **Stateful strategies** - Maintain context between moves
- **Type safety** - Full TypeScript implementation
- **Modular design** - Easy to extend and modify

## Performance Considerations

- Strategy switching has minimal overhead
- Memory usage is controlled through the `memory` field
- All strategies are pure functions for better testing
- TypeScript compilation ensures runtime safety

## Testing Strategies

```typescript
// Test individual strategies
import { strategicDraw } from './drawStrategies/strategicDraw.js';

const testState = { /* mock game state */ };
const result = strategicDraw(testState);
// Assert expected behavior
```

## Contributing

1. Create new strategy files in appropriate directories
2. Export strategy functions with proper typing
3. Add to strategy presets if creating a complete strategy set
4. Update documentation for new strategies

## License

This implementation is part of the AcerAces bot collection for Arboretum. 