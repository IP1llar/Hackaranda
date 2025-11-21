import { arboretum } from "./arboretum/index.js";
import { tictactoe } from "./tictactoe/index.js";
import { regicide } from "./regicide/index.js";
import type { gameInterface } from "./types.js";

export { arboretum, tictactoe, regicide };

const gameTypes: Record<
  gameTitle,
  gameInterface<any, any, any, any, any, any>
> = {
  tictactoe: tictactoe,
  arboretum: arboretum,
  regicide: regicide,
};

export type gameTitle = "arboretum" | "tictactoe" | "regicide";
export const allGameTitles: gameTitle[] = ["arboretum", "tictactoe", "regicide"];
export default gameTypes;
