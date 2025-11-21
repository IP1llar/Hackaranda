const readline = require('node:readline');
const { handleMove } = require('./handleMove.js');

/**
 * Handles reading lines from stdin and sending responses to stdout
 */
function beginReadline() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', (line) => {
    try {
      const { state, messageID } = JSON.parse(line);
      
      // Handle special NEWGAME and ENDGAME messages
      if (state.message === 'NEWGAME' || state.message === 'ENDGAME') {
        sendNEWGAME(state.gameNumber, messageID);
        return;
      }

      // If it's not our turn, send a default move
      if (!state.activeTurn) {
        sendMove(0, messageID);
        return;
      }

      // Get move from handleMove function
      const move = handleMove(state);
      sendMove(move, messageID);
      
    } catch (err) {
      console.error(err);
      // Send default move on error to avoid timeout
      console.log(JSON.stringify({ move: 0, messageID: 'error' }));
    }
  });

  /**
   * Send a move to stdout
   */
  function sendMove(move, messageID) {
    const message = JSON.stringify({ move, messageID });
    process.stdout.write(message + '\n');
  }

  /**
   * Acknowledge NEWGAME message
   */
  function sendNEWGAME(gameNumber, messageID) {
    const response = { result: 'accepted', gameNumber };
    sendMove(response, messageID);
  }

  // Handle process exit
  process.on('SIGTERM', () => {
    rl.close();
    process.exit(0);
  });
}

module.exports = { beginReadline };
