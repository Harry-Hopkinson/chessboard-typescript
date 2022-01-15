import * as fen from './fen';
import { AnimCurrent } from './anim';
import { DragCurrent } from './drag';
import { Drawable } from './draw';
import { timer } from './util';
import * as cg from './types';

export interface HeadlessState {
  pieces: cg.Pieces;
  orientation: cg.Color;
  turnColor: cg.Color;
  check?: cg.Key;
  lastMove?: cg.Key[];
  selected?: cg.Key;
  coordinates: boolean;
  ranksPosition: cg.RanksPosition;
  autoCastle: boolean;
  viewOnly: boolean;
  disableContextMenu: boolean;
  addPieceZIndex: boolean;
  addDimensionsCssVars: boolean;
  blockTouchScroll: boolean;
  pieceKey: boolean;
  highlight: {
    lastMove: boolean;
    check: boolean;
  };
  animation: {
    enabled: boolean;
    duration: number;
    current?: AnimCurrent;
  };
  movable: {
    free: boolean;
    color?: cg.Color | 'both';
    dests?: cg.Dests;
    showDests: boolean;
    events: {
      after?: (orig: cg.Key, dest: cg.Key, metadata: cg.MoveMetadata) => void;
      afterNewPiece?: (role: cg.Role, key: cg.Key, metadata: cg.MoveMetadata) => void;
    };
    rookCastle: boolean;
  };
  premovable: {
    enabled: boolean;
    showDests: boolean;
    castle: boolean;
    dests?: cg.Key[];
    current?: cg.KeyPair;
    events: {
      set?: (orig: cg.Key, dest: cg.Key, metadata?: cg.SetPremoveMetadata) => void;
      unset?: () => void;
    };
  };
  predroppable: {
    enabled: boolean;
    current?: {
      role: cg.Role;
      key: cg.Key;
    };
    events: {
      set?: (role: cg.Role, key: cg.Key) => void;
      unset?: () => void;
    };
  };
  draggable: {
    enabled: boolean;
    distance: number;
    autoDistance: boolean;
    showGhost: boolean;
    deleteOnDropOff: boolean;
    current?: DragCurrent;
  };
  dropmode: {
    active: boolean;
    piece?: cg.Piece;
  };
  selectable: {
    enabled: boolean;
  };
  stats: {
    dragged: boolean;
    ctrlKey?: boolean;
  };
  events: {
    change?: () => void;
    move?: (orig: cg.Key, dest: cg.Key, capturedPiece?: cg.Piece) => void;
    dropNewPiece?: (piece: cg.Piece, key: cg.Key) => void;
    select?: (key: cg.Key) => void;
    insert?: (elements: cg.Elements) => void;
  };
  drawable: Drawable;
  exploding?: cg.Exploding;
  hold: cg.Timer;
}

export interface State extends HeadlessState {
  dom: cg.Dom;
}

export function defaults(): HeadlessState {
  return {
    pieces: fen.read(fen.initial),
    orientation: 'white',
    turnColor: 'white',
    coordinates: true,
    ranksPosition: 'right',
    autoCastle: true,
    viewOnly: false,
    disableContextMenu: false,
    addPieceZIndex: false,
    addDimensionsCssVars: false,
    blockTouchScroll: false,
    pieceKey: false,
    highlight: {
      lastMove: true,
      check: true,
    },
    animation: {
      enabled: true,
      duration: 200,
    },
    movable: {
      free: true,
      color: 'both',
      showDests: true,
      events: {},
      rookCastle: true,
    },
    premovable: {
      enabled: true,
      showDests: true,
      castle: true,
      events: {},
    },
    predroppable: {
      enabled: false,
      events: {},
    },
    draggable: {
      enabled: true,
      distance: 3,
      autoDistance: true,
      showGhost: true,
      deleteOnDropOff: false,
    },
    dropmode: {
      active: false,
    },
    selectable: {
      enabled: true,
    },
    stats: {
      dragged: !('ontouchstart' in window),
    },
    events: {},
    drawable: {
      enabled: true,
      visible: true,
      defaultSnapToValidMove: true,
      eraseOnClick: true,
      shapes: [],
      autoShapes: [],
      brushes: {
        green: { key: 'g', color: '#15781B', opacity: 1, lineWidth: 10 },
        red: { key: 'r', color: '#882020', opacity: 1, lineWidth: 10 },
        blue: { key: 'b', color: '#003088', opacity: 1, lineWidth: 10 },
        yellow: { key: 'y', color: '#e68f00', opacity: 1, lineWidth: 10 },
        paleBlue: { key: 'pb', color: '#003088', opacity: 0.4, lineWidth: 15 },
        paleGreen: { key: 'pg', color: '#15781B', opacity: 0.4, lineWidth: 15 },
        paleRed: { key: 'pr', color: '#882020', opacity: 0.4, lineWidth: 15 },
        paleGrey: {
          key: 'pgr',
          color: '#4a4a4a',
          opacity: 0.35,
          lineWidth: 15,
        },
      },
      pieces: {
        baseUrl: 'https://lichess1.org/assets/piece/cburnett/',
      },
      prevSvgHash: '',
    },
    hold: timer(),
  };
}