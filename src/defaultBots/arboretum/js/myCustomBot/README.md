# My Custom Arboretum Bot

This is a skeleton bot for playing Arboretum with a modular file structure. Add your custom logic to make it smarter!

## File Structure

- **index.js** - Main entry point that starts the bot
- **readLine.js** - Handles stdin/stdout communication with the game server
- **handleMove.js** - Routes moves to appropriate handlers based on game phase
- **draw.js** - Logic for choosing which pile to draw from
- **play.js** - Logic for choosing which card to play and where
- **discard.js** - Logic for choosing which card to discard
- **helpers.js** - Shared utility functions for calculations

## How to Use

1. **Add your logic** to the TODO sections in:
   - `draw.js` - Implement `drawMove()` to strategically choose draw sources
   - `play.js` - Implement `playMove()` to place cards optimally
   - `discard.js` - Implement `discardMove()` to discard wisely

2. **Use helper functions** from `helpers.js`:
   - `pickRandomFromArray()` - Random selection
   - `findValidCoordinate()` - Find valid placement spots
   - `getCardsOfSpecies()` - Filter cards by species
   - `sumSpeciesInHand()` - Calculate species totals
   - And more utility functions for your strategy

3. **Build the bot** (from project root):
   ```bash
   npm start
   ```
   Select "Build Default Bots"

4. **Test your bot** (from project root):
   ```bash
   npm start
   ```
   Select "Begin Best Of" and choose "My Custom Bot"

## Strategy Tips

- **Drawing**: Check `state.discard` and `state.opponentDiscard` for useful cards
- **Playing**: Build paths with cards of the same species, ascending ranks
- **Discarding**: Keep high-value cards of species you're collecting
- **Scoring**: You score a path if you have the highest sum of that species in hand

## Game State

The `state` object contains:
- `hand` - Your cards
- `playArea` - Your arboretum
- `opponentPlayArea` - Opponent's arboretum
- `discard` / `opponentDiscard` - Discard piles
- `deck` - Cards remaining in deck
- `subTurn` - Current phase (0=draw1, 1=draw2, 2=play, 3=discard)

## Card Format

Cards are arrays: `[species, rank]`
- Species: `"J"`, `"R"`, `"C"`, `"M"`, `"O"`, `"W"`
- Rank: `1` to `8`

Example: `["J", 3]` is Jacaranda 3
