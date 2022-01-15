import { State } from "./state";
import * as board from "./board.js";
import * as util from "./util";
import { clear as drawClear } from "./draw.js";
import * as cg from "./types.js";
import { anim } from "./anim.js";

export interface DragCurrent {
  orig: cg.Key;
  piece: cg.Piece;
  origPos: cg.NumberPair;
  pos: cg.NumberPair;
  started: boolean;
  element: cg.PieceNode | (() => cg.PieceNode | undefined);
  newPiece?: boolean;
  force?: boolean;
  previouslySelected?: cg.Key;
  originTarget: EventTarget | null;
  keyHasChanged: boolean;
}

export function start(s: State, e: cg.MouchEvent): void {
  if (!e.isTrusted || (e.button !== undefined && e.button !== 0)) return;
  if (e.touches && e.touches.length > 1) return;
  const bounds = s.dom.bounds(),
    position = util.eventPosition(e)!,
    orig = board.getKeyAtDomPos(position, board.whitePov(s), bounds);
  if (!orig) return;
  const piece = s.pieces.get(orig);
  const previouslySelected = s.selected;
  if (!previouslySelected && s.drawable.enabled && (s.drawable.eraseOnClick || !piece || piece.color !== s.turnColor))
    drawClear(s);
  if (
    e.cancelable !== false &&
    (!e.touches || s.blockTouchScroll || piece || previouslySelected || pieceCloseTo(s, position))
  )
    e.preventDefault();
  const hadPremove = !!s.premovable.current;
  const hadPredrop = !!s.predroppable.current;
  s.stats.ctrlKey = e.ctrlKey;
  if (s.selected && board.canMove(s, s.selected, orig)) {
    anim(state => board.selectSquare(state, orig), s);
  } else {
    board.selectSquare(s, orig);
  }
  const stillSelected = s.selected === orig;
  const element = pieceElementByKey(s, orig);
  if (piece && element && stillSelected && board.isDraggable(s, orig)) {
    s.draggable.current = {
      orig,
      piece,
      origPos: position,
      pos: position,
      started: s.draggable.autoDistance && s.stats.dragged,
      element,
      previouslySelected,
      originTarget: e.target,
      keyHasChanged: false,
    };
    element.cgDragging = true;
    element.classList.add("dragging");
    const ghost = s.dom.elements.ghost;
    if (ghost) {
      ghost.className = `ghost ${piece.color} ${piece.role}`;
      util.translate(ghost, util.posToTranslate(bounds)(util.key2pos(orig), board.whitePov(s)));
      util.setVisible(ghost, true);
    }
    processDrag(s);
  } else {
    if (hadPremove) board.unsetPremove(s);
    if (hadPredrop) board.unsetPredrop(s);
  }
  s.dom.redraw();
}

function pieceCloseTo(s: State, pos: cg.NumberPair): boolean {
  const asWhite = board.whitePov(s),
    bounds = s.dom.bounds(),
    radiusSq = Math.pow(bounds.width / 8, 2);
  for (const key of s.pieces.keys()) {
    const center = util.computeSquareCenter(key, asWhite, bounds);
    if (util.distanceSq(center, pos) <= radiusSq) return true;
  }
  return false;
}

export function dragNewPiece(s: State, piece: cg.Piece, e: cg.MouchEvent, force?: boolean): void {
  const key: cg.Key = "a0";
  s.pieces.set(key, piece);
  s.dom.redraw();

  const position = util.eventPosition(e)!;

  s.draggable.current = {
    orig: key,
    piece,
    origPos: position,
    pos: position,
    started: true,
    element: () => pieceElementByKey(s, key),
    originTarget: e.target,
    newPiece: true,
    force: !!force,
    keyHasChanged: false,
  };
  processDrag(s);
}

function processDrag(s: State): void {
  requestAnimationFrame(() => {
    const cur = s.draggable.current;
    if (!cur) return;
    if (s.animation.current?.plan.anims.has(cur.orig)) s.animation.current = undefined;
    const origPiece = s.pieces.get(cur.orig);
    if (!origPiece || !util.samePiece(origPiece, cur.piece)) cancel(s);
    else {
      if (!cur.started && util.distanceSq(cur.pos, cur.origPos) >= Math.pow(s.draggable.distance, 2))
        cur.started = true;
      if (cur.started) {
        if (typeof cur.element === "function") {
          const found = cur.element();
          if (!found) return;
          found.cgDragging = true;
          found.classList.add("dragging");
          cur.element = found;
        }

        const bounds = s.dom.bounds();
        util.translate(cur.element, [
          cur.pos[0] - bounds.left - bounds.width / 16,
          cur.pos[1] - bounds.top - bounds.height / 16,
        ]);

        cur.keyHasChanged ||= cur.orig !== board.getKeyAtDomPos(cur.pos, board.whitePov(s), bounds);
      }
    }
    processDrag(s);
  });
}

export function move(s: State, e: cg.MouchEvent): void {
  if (s.draggable.current && (!e.touches || e.touches.length < 2)) {
    s.draggable.current.pos = util.eventPosition(e)!;
  }
}

export function end(s: State, e: cg.MouchEvent): void {
  const cur = s.draggable.current;
  if (!cur) return;
  if (e.type === "touchend" && e.cancelable !== false) e.preventDefault();
  if (e.type === "touchend" && cur.originTarget !== e.target && !cur.newPiece) {
    s.draggable.current = undefined;
    return;
  }
  board.unsetPremove(s);
  board.unsetPredrop(s);
  const eventPos = util.eventPosition(e) || cur.pos;
  const dest = board.getKeyAtDomPos(eventPos, board.whitePov(s), s.dom.bounds());
  if (dest && cur.started && cur.orig !== dest) {
    if (cur.newPiece) board.dropNewPiece(s, cur.orig, dest, cur.force);
    else {
      s.stats.ctrlKey = e.ctrlKey;
      if (board.userMove(s, cur.orig, dest)) s.stats.dragged = true;
    }
  } else if (cur.newPiece) {
    s.pieces.delete(cur.orig);
  } else if (s.draggable.deleteOnDropOff && !dest) {
    s.pieces.delete(cur.orig);
    board.callUserFunction(s.events.change);
  }
  if ((cur.orig === cur.previouslySelected || cur.keyHasChanged) && (cur.orig === dest || !dest)) board.unselect(s);
  else if (!s.selectable.enabled) board.unselect(s);

  removeDragElements(s);

  s.draggable.current = undefined;
  s.dom.redraw();
}

export function cancel(s: State): void {
  const cur = s.draggable.current;
  if (cur) {
    if (cur.newPiece) s.pieces.delete(cur.orig);
    s.draggable.current = undefined;
    board.unselect(s);
    removeDragElements(s);
    s.dom.redraw();
  }
}

function removeDragElements(s: State): void {
  const e = s.dom.elements;
  if (e.ghost) util.setVisible(e.ghost, false);
}

function pieceElementByKey(s: State, key: cg.Key): cg.PieceNode | undefined {
  let el = s.dom.elements.board.firstChild;
  while (el) {
    if ((el as cg.KeyedNode).cgKey === key && (el as cg.KeyedNode).tagName === "PIECE") return el as cg.PieceNode;
    el = el.nextSibling;
  }
  return;
}