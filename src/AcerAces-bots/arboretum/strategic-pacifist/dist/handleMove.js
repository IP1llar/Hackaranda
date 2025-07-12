import { drawMove } from './draw.js';
import { playMove } from './play.js';
import { discardMove } from './discard.js';
import { subTurn } from './types.js';
export function handleMove(state) {
    switch (state.subTurn) {
        case subTurn.FirstDraw:
        case subTurn.SecondDraw:
            return drawMove(state);
        case subTurn.Play:
            return playMove(state);
        case subTurn.Discard:
            return discardMove(state);
    }
}
//# sourceMappingURL=handleMove.js.map