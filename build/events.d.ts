import { State } from "./state";
import * as cg from "./types";
export declare function bindBoard(s: State, onResize: () => void): void;
export declare function bindDocument(s: State, onResize: () => void): cg.Unbind;
