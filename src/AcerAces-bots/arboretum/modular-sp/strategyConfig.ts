// Example strategy configurations for the Modular-SP bot
// This file demonstrates how to configure different strategy combinations

import { setStrategies, applyPreset } from './strategies.js';
import { adaptiveDraw } from './drawStrategies/adaptiveDraw.js';
import { randomDraw } from './drawStrategies/randomDraw.js';
import { strategicDraw } from './drawStrategies/strategicDraw.js';
import { greedyPlay } from './playStrategies/greedyPlay.js';
import { strategicPlay } from './playStrategies/strategicPlay.js';
import { safeDiscard } from './discardStrategies/safeDiscard.js';
import { strategicDiscard } from './discardStrategies/strategicDiscard.js';

// Example 1: Use built-in presets
export function configureRandomBot() {
    applyPreset('random');
    console.log('Configured bot with random strategies');
}

export function configureStrategicBot() {
    applyPreset('strategic');
    console.log('Configured bot with strategic strategies');
}

export function configureAggressiveBot() {
    applyPreset('aggressive');
    console.log('Configured bot with aggressive strategies');
}

export function configureDefensiveBot() {
    applyPreset('defensive');
    console.log('Configured bot with defensive strategies');
}

// Example 2: Custom strategy combinations
export function configureHybridBot() {
    setStrategies({
        draw: adaptiveDraw,      // Adaptive drawing with memory
        play: greedyPlay,        // Aggressive placement
        discard: strategicDiscard // Strategic discarding
    });
    console.log('Configured bot with hybrid strategies');
}

export function configureConservativeBot() {
    setStrategies({
        draw: strategicDraw,     // Strategic drawing
        play: strategicPlay,     // Balanced placement
        discard: safeDiscard     // Safe discarding
    });
    console.log('Configured bot with conservative strategies');
}

export function configureExperimentalBot() {
    setStrategies({
        draw: randomDraw,        // Random drawing
        play: strategicPlay,     // Strategic placement
        discard: strategicDiscard // Strategic discarding
    });
    console.log('Configured bot with experimental strategies');
}

// Example 3: Dynamic strategy switching based on opponent
export function configureAdaptiveBot(opponentId: string) {
    if (opponentId.includes('aggressive') || opponentId.includes('greedy')) {
        // Against aggressive opponents, be more defensive
        setStrategies({
            draw: strategicDraw,
            play: strategicPlay,
            discard: safeDiscard
        });
        console.log('Configured defensive strategy against aggressive opponent');
    } else if (opponentId.includes('random') || opponentId.includes('simple')) {
        // Against random opponents, be more aggressive
        setStrategies({
            draw: strategicDraw,
            play: greedyPlay,
            discard: strategicDiscard
        });
        console.log('Configured aggressive strategy against random opponent');
    } else {
        // Default balanced approach
        applyPreset('strategic');
        console.log('Configured balanced strategy for unknown opponent');
    }
}

// Example 4: Game phase specific configurations
export function configurePhaseBasedBot(gamePhase: 'early' | 'mid' | 'late') {
    switch (gamePhase) {
        case 'early':
            // Early game: focus on building foundation
            setStrategies({
                draw: strategicDraw,
                play: strategicPlay,
                discard: strategicDiscard
            });
            console.log('Configured early game strategies');
            break;
        case 'mid':
            // Mid game: balance expansion and scoring
            setStrategies({
                draw: adaptiveDraw,
                play: strategicPlay,
                discard: strategicDiscard
            });
            console.log('Configured mid game strategies');
            break;
        case 'late':
            // Late game: maximize scoring
            setStrategies({
                draw: strategicDraw,
                play: greedyPlay,
                discard: strategicDiscard
            });
            console.log('Configured late game strategies');
            break;
    }
}

// Example 5: Tournament configuration
export function configureTournamentBot(tournamentType: string) {
    switch (tournamentType) {
        case 'swiss':
            // Swiss tournaments: balanced approach
            applyPreset('strategic');
            break;
        case 'knockout':
            // Knockout tournaments: more aggressive
            applyPreset('aggressive');
            break;
        case 'round-robin':
            // Round robin: adaptive approach
            configureHybridBot();
            break;
        default:
            applyPreset('strategic');
    }
    console.log(`Configured for ${tournamentType} tournament`);
}

// Example 6: Performance-based adaptation
export function configurePerformanceBasedBot(winRate: number) {
    if (winRate > 0.7) {
        // High win rate: stay conservative
        applyPreset('defensive');
        console.log('High win rate: using defensive strategies');
    } else if (winRate < 0.3) {
        // Low win rate: try aggressive approach
        applyPreset('aggressive');
        console.log('Low win rate: using aggressive strategies');
    } else {
        // Medium win rate: balanced approach
        applyPreset('strategic');
        console.log('Medium win rate: using balanced strategies');
    }
}

// Example 7: Memory-based strategy switching
export function configureMemoryBasedBot(state: any) {
    if (!state.memory) {
        state.memory = { strategySwitches: 0 };
    }
    
    // Switch strategies every 10 games
    if (state.memory.strategySwitches % 10 === 0) {
        const strategies = ['strategic', 'aggressive', 'defensive', 'hybrid'];
        const randomStrategy = strategies[Math.floor(Math.random() * strategies.length)];
        
        switch (randomStrategy) {
            case 'strategic':
                applyPreset('strategic');
                break;
            case 'aggressive':
                applyPreset('aggressive');
                break;
            case 'defensive':
                applyPreset('defensive');
                break;
            case 'hybrid':
                configureHybridBot();
                break;
        }
        
        console.log(`Switched to ${randomStrategy} strategy`);
    }
    
    state.memory.strategySwitches++;
} 