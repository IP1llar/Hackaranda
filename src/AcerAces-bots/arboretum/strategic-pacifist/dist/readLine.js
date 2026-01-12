import { handleMove } from './handleMove.js';
import readline from 'node:readline';
// Handles reading lines
export function beginReadline() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.on('line', (line) => {
        try {
            const { state, messageID } = JSON.parse(line);
            if (state.message === 'NEWGAME' || state.message === 'ENDGAME') {
                sendNEWGAME(state.gameNumber, messageID);
                return;
            }
            if (!state.activeTurn) {
                sendMove(0, messageID);
                return;
            }
            const move = handleMove(state);
            sendMove(move, messageID);
        }
        catch (err) {
            console.error(err);
        }
    });
    function sendMove(move, messageID) {
        const message = JSON.stringify({ move, messageID });
        process.stdout.write(message + '\n');
    }
    function sendNEWGAME(gameNumber, messageID) {
        const response = { result: 'accepted', gameNumber };
        sendMove(response, messageID);
    }
}
//# sourceMappingURL=readLine.js.map