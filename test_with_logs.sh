#!/bin/bash
# Helper script to test the bot with log collection
# Usage: ./test_with_logs.sh

set -e

# Create logs directory
LOGS_DIR="$(pwd)/logs/ethan-xai"
mkdir -p "$LOGS_DIR"

echo "📁 Logs will be saved to: $LOGS_DIR"
echo ""

# Set environment variable for the game framework to pass to Docker
export DOCKER_VOLUME_MOUNT="-v $LOGS_DIR:/tmp/ethan-xai-logs"

echo "🎮 Starting game with logging enabled..."
echo "   Note: You'll see JSON logs in the console during the game"
echo "   They're also being saved to files in $LOGS_DIR"
echo ""

# Run npm start (this will use the bot)
npm start

echo ""
echo "✅ Game complete!"
echo ""
echo "📊 To analyze logs:"
echo "   cd src/defaultBots/arboretum/js/EthanXAI"
echo "   python3 analyze_logs.py $LOGS_DIR/game-*.jsonl"
echo ""
echo "📁 Log files:"
ls -lh "$LOGS_DIR"
