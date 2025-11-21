# EthanXAI Bot - Logging & Analysis Guide

## How Logging Works

The bot writes detailed JSON logs to **both**:
1. **stderr** (visible in console during games)
2. **Log files** (saved to `/tmp/ethan-xai-logs/` inside Docker container)

Logs are written in JSONL format (one JSON object per line).

## Accessing Log Files

### Method 1: Mount a Volume (Recommended)

When running the Docker container, mount a local directory to persist logs:

```bash
# Create logs directory
mkdir -p ./logs/ethan-xai

# Run with volume mount
docker run -v $(pwd)/logs/ethan-xai:/tmp/ethan-xai-logs -i arboretum-ethan-xai-bot:v3
```

### Method 2: Copy from Container

After a game, copy logs from the container:

```bash
# Find container ID
docker ps -a | grep ethan-xai

# Copy logs out
docker cp <container-id>:/tmp/ethan-xai-logs ./logs/
```

### Method 3: View Console Output

Logs are also printed to stderr, so you'll see them in the console during games prefixed with the bot name.

## Log Types

The bot generates these log types:

### 1. DECISION
Records each move decision (draw/play/discard)
- Which move was chosen
- Whether MCTS or heuristic was used
- Confidence level

### 2. MCTS_STATS
Statistics from Monte Carlo simulations
- Time used
- Number of simulations run
- Best move win rate
- Confidence gap

### 3. SPECIES_STRATEGY
Species collection patterns
- Which species we're collecting
- Which species opponent is collecting
- Hand composition by species

### 4. SCORING_RIGHTS
Scoring rights evolution
- Which species we gained/lost/maintained scoring rights for
- Projected scores for both players

### 5. TIMING
Operation performance
- How long each move type takes

## Analyzing Logs

### Using the Python Analyzer

```bash
# Make executable
chmod +x analyze_logs.py

# Analyze a log file
python3 analyze_logs.py logs/ethan-xai/game-123456.jsonl

# Generate JSON analysis report
python3 analyze_logs.py logs/ethan-xai/game-123456.jsonl --json
```

### Output Example

```
============================================================
ETHAN XAI BOT - GAME LOG ANALYSIS
============================================================

📊 DECISION MAKING:
   Total decisions: 156
   MCTS used: 23 (14.7%)
   By phase:
      draw: 12/78 (15.4%)
      play: 8/39 (20.5%)
      discard: 3/39 (7.7%)

🎯 MCTS PERFORMANCE:
   Total MCTS runs: 156
   Avg time: 587ms (median: 600ms)
   Avg simulations: 1456
   Avg confidence: 0.082
   Avg best move win rate: 0.654

🌳 SPECIES STRATEGY:
   Turns analyzed: 26
   Our top species: [('O', 20), ('W', 18), ('M', 12)]
   Opponent top species: [('J', 15), ('C', 12), ('R', 10)]

🏆 SCORING RIGHTS:
   Species gained most: [('O', 1), ('W', 1)]
   Species lost most: [('J', 2), ('R', 1)]
   Final projection: Us 65 - Them 52 (diff: 13.0)
```

### Manual Analysis with jq

Filter specific log types:

```bash
# Show all decisions
cat game-123456.jsonl | jq 'select(.type == "DECISION")'

# Count MCTS usage
cat game-123456.jsonl | jq 'select(.type == "DECISION") | .usedMCTS' | grep true | wc -l

# Show species strategy evolution
cat game-123456.jsonl | jq 'select(.type == "SPECIES_STRATEGY") | {turn, ourStrategy, opponentStrategy}'

# Find slowest operations
cat game-123456.jsonl | jq 'select(.type == "TIMING") | {operation, duration}' | sort -k2 -n
```

## Environment Variables

Control logging behavior:

```bash
# Disable logging
docker run -e LOG_ENABLED=false ...

# Set custom log directory
docker run -e LOG_DIR=/custom/path ...

# Set custom game ID
docker run -e GAME_ID=my-test-game ...
```

## Troubleshooting

### Logs not appearing in mounted volume

Check that the volume mount is correct:
```bash
docker run -v $(pwd)/logs:/tmp/ethan-xai-logs ...
```

### Permission issues

Ensure the mounted directory is writable:
```bash
chmod 777 ./logs/ethan-xai
```

### Logs still in container

If container exits immediately, logs might not flush. Use:
```bash
docker logs <container-id>
```

## Next Steps

After collecting logs:

1. **Identify patterns** - Which species work best? When does MCTS help?
2. **Spot weaknesses** - When do we lose scoring rights? 
3. **Tune parameters** - Adjust MCTS time budget based on which phases need it
4. **Validate improvements** - Compare logs before/after strategy changes

## Example Workflow

```bash
# 1. Create logs directory
mkdir -p ./logs/ethan-xai

# 2. Run game with logging (modify your npm start to include volume mount)
# Add this to where Docker is run in the framework

# 3. Analyze logs
python3 analyze_logs.py logs/ethan-xai/game-*.jsonl

# 4. Compare multiple games
for log in logs/ethan-xai/*.jsonl; do
  echo "=== $log ==="
  python3 analyze_logs.py "$log" | grep "Final projection"
done
```
