#!/usr/bin/env python3
"""
EthanXAI Bot Log Analyzer
Parses and analyzes JSONL log files from bot games
"""

import json
import sys
from collections import defaultdict, Counter
from statistics import mean, median
from typing import Dict, List, Any

def load_logs(file_path: str) -> List[Dict]:
    """Load logs from JSONL file"""
    logs = []
    with open(file_path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                logs.append(json.loads(line))
            except json.JSONDecodeError as e:
                print(f"Warning: Failed to parse line: {line[:100]}...", file=sys.stderr)
    return logs

def analyze_decisions(logs: List[Dict]) -> Dict:
    """Analyze decision-making patterns"""
    decisions = [l for l in logs if l.get('type') == 'DECISION']
    
    total = len(decisions)
    mcts_used = len([d for d in decisions if d.get('usedMCTS')])
    
    by_phase = defaultdict(lambda: {'total': 0, 'mcts': 0})
    for d in decisions:
        phase = d.get('moveType', 'unknown')
        by_phase[phase]['total'] += 1
        if d.get('usedMCTS'):
            by_phase[phase]['mcts'] += 1
    
    return {
        'total_decisions': total,
        'mcts_used': mcts_used,
        'mcts_percentage': (mcts_used / total * 100) if total > 0 else 0,
        'by_phase': dict(by_phase)
    }

def analyze_mcts_performance(logs: List[Dict]) -> Dict:
    """Analyze MCTS simulation performance"""
    mcts_logs = [l for l in logs if l.get('type') == 'MCTS_STATS']
    
    if not mcts_logs:
        return {}
    
    time_used = [l['timeUsed'] for l in mcts_logs]
    sims_run = [l['simulationsRun'] for l in mcts_logs]
    confidence = [l['confidence'] for l in mcts_logs]
    win_rates = [l['bestMove']['winRate'] for l in mcts_logs]
    
    by_phase = defaultdict(list)
    for l in mcts_logs:
        phase = l.get('phase', 'unknown')
        by_phase[phase].append({
            'time': l['timeUsed'],
            'sims': l['simulationsRun'],
            'confidence': l['confidence']
        })
    
    return {
        'total_mcts_runs': len(mcts_logs),
        'avg_time_ms': mean(time_used),
        'avg_simulations': mean(sims_run),
        'avg_confidence': mean(confidence),
        'avg_best_win_rate': mean(win_rates),
        'median_time_ms': median(time_used),
        'by_phase': {
            phase: {
                'count': len(stats),
                'avg_time': mean(s['time'] for s in stats),
                'avg_sims': mean(s['sims'] for s in stats),
                'avg_confidence': mean(s['confidence'] for s in stats)
            }
            for phase, stats in by_phase.items()
        }
    }

def analyze_species_strategy(logs: List[Dict]) -> Dict:
    """Analyze species collection patterns"""
    strategy_logs = [l for l in logs if l.get('type') == 'SPECIES_STRATEGY']
    
    if not strategy_logs:
        return {}
    
    # Track what we collected over time
    our_species = Counter()
    opponent_species = Counter()
    
    for l in strategy_logs:
        for s in l['ourStrategy']['collecting']:
            our_species[s] += 1
        for s in l['opponentStrategy']['collecting']:
            opponent_species[s] += 1
    
    return {
        'total_turns_logged': len(strategy_logs),
        'our_most_collected': our_species.most_common(3),
        'opponent_most_collected': opponent_species.most_common(3)
    }

def analyze_scoring_rights(logs: List[Dict]) -> Dict:
    """Analyze scoring rights evolution"""
    rights_logs = [l for l in logs if l.get('type') == 'SCORING_RIGHTS']
    
    if not rights_logs:
        return {}
    
    gained = Counter()
    lost = Counter()
    
    score_progression = []
    
    for l in rights_logs:
        for s in l.get('gained', []):
            gained[s] += 1
        for s in l.get('lost', []):
            lost[s] += 1
        
        score_progression.append({
            'turn': l['turn'],
            'our_score': l['projectedOurScore'],
            'their_score': l['projectedTheirScore'],
            'diff': l['projectedDiff']
        })
    
    return {
        'total_turns': len(rights_logs),
        'species_gained_most': gained.most_common(3),
        'species_lost_most': lost.most_common(3),
        'final_projected_score': score_progression[-1] if score_progression else None,
        'score_progression': score_progression
    }

def analyze_timing(logs: List[Dict]) -> Dict:
    """Analyze operation timing"""
    timing_logs = [l for l in logs if l.get('type') == 'TIMING']
    
    if not timing_logs:
        return {}
    
    by_operation = defaultdict(list)
    for l in timing_logs:
        op = l.get('operation', 'unknown')
        by_operation[op].append(l['duration'])
    
    return {
        'operations': {
            op: {
                'count': len(durations),
                'avg_ms': mean(durations),
                'max_ms': max(durations),
                'min_ms': min(durations)
            }
            for op, durations in by_operation.items()
        }
    }

def print_summary(analysis: Dict):
    """Print formatted analysis summary"""
    print("\n" + "="*60)
    print("ETHAN XAI BOT - GAME LOG ANALYSIS")
    print("="*60)
    
    # Decisions
    if 'decisions' in analysis:
        d = analysis['decisions']
        print(f"\n📊 DECISION MAKING:")
        print(f"   Total decisions: {d['total_decisions']}")
        print(f"   MCTS used: {d['mcts_used']} ({d['mcts_percentage']:.1f}%)")
        print(f"   By phase:")
        for phase, stats in d['by_phase'].items():
            pct = (stats['mcts'] / stats['total'] * 100) if stats['total'] > 0 else 0
            print(f"      {phase}: {stats['mcts']}/{stats['total']} ({pct:.1f}%)")
    
    # MCTS Performance
    if 'mcts' in analysis and analysis['mcts']:
        m = analysis['mcts']
        print(f"\n🎯 MCTS PERFORMANCE:")
        print(f"   Total MCTS runs: {m['total_mcts_runs']}")
        print(f"   Avg time: {m['avg_time_ms']:.0f}ms (median: {m['median_time_ms']:.0f}ms)")
        print(f"   Avg simulations: {m['avg_simulations']:.0f}")
        print(f"   Avg confidence: {m['avg_confidence']:.3f}")
        print(f"   Avg best move win rate: {m['avg_best_win_rate']:.3f}")
    
    # Species Strategy
    if 'species' in analysis and analysis['species']:
        s = analysis['species']
        print(f"\n🌳 SPECIES STRATEGY:")
        print(f"   Turns analyzed: {s['total_turns_logged']}")
        print(f"   Our top species: {s['our_most_collected']}")
        print(f"   Opponent top species: {s['opponent_most_collected']}")
    
    # Scoring Rights
    if 'scoring' in analysis and analysis['scoring']:
        sc = analysis['scoring']
        print(f"\n🏆 SCORING RIGHTS:")
        print(f"   Species gained most: {sc['species_gained_most']}")
        print(f"   Species lost most: {sc['species_lost_most']}")
        if sc['final_projected_score']:
            final = sc['final_projected_score']
            print(f"   Final projection: Us {final['our_score']} - Them {final['their_score']} (diff: {final['diff']:.1f})")
    
    # Timing
    if 'timing' in analysis and analysis['timing']:
        t = analysis['timing']
        print(f"\n⏱️  TIMING:")
        for op, stats in t['operations'].items():
            print(f"   {op}: {stats['avg_ms']:.1f}ms avg ({stats['min_ms']}-{stats['max_ms']}ms)")
    
    print("\n" + "="*60 + "\n")

def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze_logs.py <log_file.jsonl>")
        print("\nTo get logs from Docker container:")
        print("  docker run -v $(pwd)/logs:/tmp/ethan-xai-logs ...")
        sys.exit(1)
    
    log_file = sys.argv[1]
    
    print(f"Loading logs from: {log_file}")
    logs = load_logs(log_file)
    print(f"Loaded {len(logs)} log entries")
    
    analysis = {
        'decisions': analyze_decisions(logs),
        'mcts': analyze_mcts_performance(logs),
        'species': analyze_species_strategy(logs),
        'scoring': analyze_scoring_rights(logs),
        'timing': analyze_timing(logs)
    }
    
    print_summary(analysis)
    
    # Optional: Write detailed analysis to JSON
    if '--json' in sys.argv:
        output_file = log_file.replace('.jsonl', '_analysis.json')
        with open(output_file, 'w') as f:
            json.dump(analysis, f, indent=2)
        print(f"Detailed analysis written to: {output_file}")

if __name__ == '__main__':
    main()
