import { HeadlessState } from "./state";
import { setCheck, setSelected } from "./board";
import { read as fenRead } from "./fen";
import { DrawShape, DrawBrushes } from "./draw";
import * as cg from "./types";

export interface Config {
  fen?: cg.FEN;
  orientation?: cg.Color;
  turnColor?: cg.Color;
  check?: cg.Color | boolean;
  lastMove?: cg.Key[];
  selected?: cg.Key;
  coordinates?: boolean;
  autoCastle?: boolean;
  viewOnly?: boolean;
  disableContextMenu?: boolean;
  addPieceZIndex?: boolean;
  addDimensionsCssVars?: boolean;
  blockTouchScroll?: boolean;
  highlight?: {
    lastMove?: boolean;
    check?: boolean;
  };
  animation?: {
    enabled?: boolean;
    duration?: number;
  };
  movable?: {
    free?: boolean;
    color?: cg.Color | "both";
    dests?: cg.Dests;
    showDests?: boolean;
    events?: {
      after?: (orig: cg.Key, dest: cg.Key, metadata: cg.MoveMetadata) => void;
      afterNewPiece?: (role: cg.Role, key: cg.Key, metadata: cg.MoveMetadata) => void;
    };
    rookCastle?: boolean;
  };
  premovable?: {
    enabled?: boolean;
    showDests?: boolean;
    castle?: boolean;
    dests?: cg.Key[];
    events?: {
      set?: (orig: cg.Key, dest: cg.Key, metadata?: cg.SetPremoveMetadata) => void;
      unset?: () => void;
    };
  };
  predroppable?: {
    enabled?: boolean;
    events?: {
      set?: (role: cg.Role, key: cg.Key) => void;
      unset?: () => void;
    };
  };
  draggable?: {
    enabled?: boolean;
    distance?: number;
    autoDistance?: boolean;
    showGhost?: boolean;
    deleteOnDropOff?: boolean;
  };
  selectable?: {
    enabled?: boolean;
  };
  events?: {
    change?: () => void;
    move?: (orig: cg.Key, dest: cg.Key, capturedPiece?: cg.Piece) => void;
    dropNewPiece?: (piece: cg.Piece, key: cg.Key) => void;
    select?: (key: cg.Key) => void;
    insert?: (elements: cg.Elements) => void;
  };
  drawable?: {
    enabled?: boolean;
    visible?: boolean;
    defaultSnapToValidMove?: boolean;
    eraseOnClick?: boolean;
    shapes?: DrawShape[];
    autoShapes?: DrawShape[];
    brushes?: DrawBrushes;
    pieces?: {
      baseUrl?: string;
    };
    onChange?: (shapes: DrawShape[]) => void;
  };
}

export function applyAnimation(state: HeadlessState, config: Config): void {
  if (config.animation) {
    deepMerge(state.animation, config.animation);
    if ((state.animation.duration || 0) < 70) state.animation.enabled = false;
  }
}

export function configure(state: HeadlessState, config: Config): void {
  if (config.movable?.dests) state.movable.dests = undefined;
  if (config.drawable?.autoShapes) state.drawable.autoShapes = [];

  deepMerge(state, config);

  if (config.fen) {
    state.pieces = fenRead(config.fen);
    state.drawable.shapes = [];
  }

  if ("check" in config) setCheck(state, config.check || false);
  if ("lastMove" in config && !config.lastMove) state.lastMove = undefined;
  else if (config.lastMove) state.lastMove = config.lastMove;

  if (state.selected) setSelected(state, state.selected);

  applyAnimation(state, config);

  if (!state.movable.rookCastle && state.movable.dests) {
    const rank = state.movable.color === "white" ? "1" : "8",
      kingStartPos = ("e" + rank) as cg.Key,
      dests = state.movable.dests.get(kingStartPos),
      king = state.pieces.get(kingStartPos);
    if (!dests || !king || king.role !== "king") return;
    state.movable.dests.set(
      kingStartPos,
      dests.filter(
        d =>
          !(d === "a" + rank && dests.includes(("c" + rank) as cg.Key)) &&
          !(d === "h" + rank && dests.includes(("g" + rank) as cg.Key))
      )
    );
  }
}

function deepMerge(base: any, extend: any): void {
  for (const key in extend) {
    if (isObject(base[key]) && isObject(extend[key])) deepMerge(base[key], extend[key]);
    else base[key] = extend[key];
  }
}

function isObject(o: unknown): boolean {
  return typeof o === "object";
}