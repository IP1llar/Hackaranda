// Import default strategies
import { randomDraw } from './drawStrategies/randomDraw.js';
import { strategicDraw } from './drawStrategies/strategicDraw.js';
import { greedyPlay } from './playStrategies/greedyPlay.js';
import { strategicPlay } from './playStrategies/strategicPlay.js';
import { safeDiscard } from './discardStrategies/safeDiscard.js';
import { strategicDiscard } from './discardStrategies/strategicDiscard.js';
// Active strategies configuration
export let activeStrategies = {
    draw: strategicDraw,
    play: strategicPlay,
    discard: strategicDiscard
};
// Strategy setter function
export function setStrategies(newStrategies) {
    activeStrategies = { ...activeStrategies, ...newStrategies };
}
// Strategy presets for quick configuration
export const strategyPresets = {
    random: {
        draw: randomDraw,
        play: greedyPlay,
        discard: safeDiscard
    },
    strategic: {
        draw: strategicDraw,
        play: strategicPlay,
        discard: strategicDiscard
    },
    aggressive: {
        draw: strategicDraw,
        play: greedyPlay,
        discard: strategicDiscard
    },
    defensive: {
        draw: strategicDraw,
        play: strategicPlay,
        discard: safeDiscard
    }
};
// Apply a preset
export function applyPreset(presetName) {
    const preset = strategyPresets[presetName];
    if (preset) {
        setStrategies(preset);
    }
}
// Dynamic strategy adaptation based on game state
export function adaptStrategies(state) {
    // Initialize memory if not present
    if (!state.memory) {
        state.memory = {};
    }
    // Determine game phase
    const cardsPlayed = Object.keys(state.playArea).length;
    if (cardsPlayed < 3) {
        state.memory.gamePhase = 'early';
    }
    else if (cardsPlayed < 8) {
        state.memory.gamePhase = 'mid';
    }
    else {
        state.memory.gamePhase = 'late';
    }
    // Adapt strategies based on game phase
    switch (state.memory.gamePhase) {
        case 'early':
            // Early game: focus on building foundation
            setStrategies({
                draw: strategicDraw,
                play: strategicPlay,
                discard: strategicDiscard
            });
            break;
        case 'mid':
            // Mid game: balance expansion and scoring
            setStrategies({
                draw: strategicDraw,
                play: strategicPlay,
                discard: strategicDiscard
            });
            break;
        case 'late':
            // Late game: maximize scoring opportunities
            setStrategies({
                draw: strategicDraw,
                play: greedyPlay,
                discard: strategicDiscard
            });
            break;
    }
}
//# sourceMappingURL=strategies.js.map