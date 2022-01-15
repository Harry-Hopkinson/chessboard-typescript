import { State } from "./state";
import * as board from "./board";
import { write as fenWrite } from "./fen";
import { Config, configure, applyAnimation } from "./config";
import { anim, render } from "./anim";
import { cancel as dragCancel, dragNewPiece } from "./drag";
import { DrawShape } from "./draw";
import { explosion } from "./explosion";
import * as cg from "./types";

export interface Api {
  set(config: Config): void;
  state: State;
  getFen(): cg.FEN;
  toggleOrientation(): void;
  move(orig: cg.Key, dest: cg.Key): void;
  setPieces(pieces: cg.PiecesDiff): void;
  selectSquare(key: cg.Key | null, force?: boolean): void;
  newPiece(piece: cg.Piece, key: cg.Key): void;
  playPremove(): boolean;
  cancelPremove(): void;
  playPredrop(validate: (drop: cg.Drop) => boolean): boolean;
  cancelPredrop(): void;
  cancelMove(): void;
  stop(): void;
  explode(keys: cg.Key[]): void;
  setShapes(shapes: DrawShape[]): void;
  setAutoShapes(shapes: DrawShape[]): void;
  getKeyAtDomPos(pos: cg.NumberPair): cg.Key | undefined;
  redrawAll: cg.Redraw;
  dragNewPiece(piece: cg.Piece, event: cg.MouchEvent, force?: boolean): void;
  destroy: cg.Unbind;
}

export function start(state: State, redrawAll: cg.Redraw): Api {
  function toggleOrientation(): void {
    board.toggleOrientation(state);
    redrawAll();
  }

  return {
    set(config): void {
      if (config.orientation && config.orientation !== state.orientation) toggleOrientation();
      applyAnimation(state, config);
      (config.fen ? anim : render)(state => configure(state, config), state);
    },

    state,
    getFen: () => fenWrite(state.pieces),
    toggleOrientation,

    setPieces(pieces): void {
      anim(state => board.setPieces(state, pieces), state);
    },

    selectSquare(key, force): void {
      if (key) anim(state => board.selectSquare(state, key, force), state);
      else if (state.selected) {
        board.unselect(state);
        state.dom.redraw();
      }
    },

    move(orig, dest): void {
      anim(state => board.baseMove(state, orig, dest), state);
    },

    newPiece(piece, key): void {
      anim(state => board.baseNewPiece(state, piece, key), state);
    },

    playPremove(): boolean {
      if (state.premovable.current) {
        if (anim(board.playPremove, state)) return true;
        // if the premove couldn"t be played, redraw to clear it up
        state.dom.redraw();
      }
      return false;
    },

    playPredrop(validate): boolean {
      if (state.predroppable.current) {
        const result = board.playPredrop(state, validate);
        state.dom.redraw();
        return result;
      }
      return false;
    },

    cancelPremove(): void {
      render(board.unsetPremove, state);
    },

    cancelPredrop(): void {
      render(board.unsetPredrop, state);
    },

    cancelMove(): void {
      render(state => {
        board.cancelMove(state);
        dragCancel(state);
      }, state);
    },

    stop(): void {
      render(state => {
        board.stop(state);
        dragCancel(state);
      }, state);
    },

    explode(keys: cg.Key[]): void {
      explosion(state, keys);
    },
    
    setAutoShapes(shapes: DrawShape[]): void {
      render(state => (state.drawable.autoShapes = shapes), state);
    },

    setShapes(shapes: DrawShape[]): void {
      render(state => (state.drawable.shapes = shapes), state);
    },

    getKeyAtDomPos(pos): cg.Key | undefined {
      return board.getKeyAtDomPos(pos, board.whitePov(state), state.dom.bounds());
    },

    redrawAll,
    dragNewPiece(piece, event, force): void {
      dragNewPiece(state, piece, event, force);
    },

    destroy(): void {
      board.stop(state);
      state.dom.unbind && state.dom.unbind();
      state.dom.destroyed = true;
    },
  };
}