export const species = ["J", "R", "C", "M", "O", "W"];
export const ranks = [1, 2, 3, 4, 5, 6, 7, 8];
export var subTurn;
(function (subTurn) {
    subTurn[subTurn["FirstDraw"] = 0] = "FirstDraw";
    subTurn[subTurn["SecondDraw"] = 1] = "SecondDraw";
    subTurn[subTurn["Play"] = 2] = "Play";
    subTurn[subTurn["Discard"] = 3] = "Discard";
})(subTurn || (subTurn = {}));
export var drawingMove;
(function (drawingMove) {
    drawingMove[drawingMove["Deck"] = 0] = "Deck";
    drawingMove[drawingMove["OwnDiscard"] = 1] = "OwnDiscard";
    drawingMove[drawingMove["OpponentDiscard"] = 2] = "OpponentDiscard";
})(drawingMove || (drawingMove = {}));
//# sourceMappingURL=types.js.map