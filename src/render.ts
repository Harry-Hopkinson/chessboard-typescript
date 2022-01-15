import { State } from "./state";
import { key2pos, createEl, posToTranslate as posToTranslateFromBounds, translate } from "./util";
import { whitePov } from "./board";
import { AnimCurrent, AnimVectors, AnimVector, AnimFadings } from "./anim";
import { DragCurrent } from "./drag";
import * as cg from "./types";

type PieceName = string; // `$color $role`

type SquareClasses = Map<cg.Key, string>;

export function render(s: State): void {
  const asWhite: boolean = whitePov(s),
    posToTranslate = posToTranslateFromBounds(s.dom.bounds()),
    boardEl: HTMLElement = s.dom.elements.board,
    pieces: cg.Pieces = s.pieces,
    curAnim: AnimCurrent | undefined = s.animation.current,
    anims: AnimVectors = curAnim ? curAnim.plan.anims : new Map(),
    fadings: AnimFadings = curAnim ? curAnim.plan.fadings : new Map(),
    curDrag: DragCurrent | undefined = s.draggable.current,
    squares: SquareClasses = computeSquareClasses(s),
    samePieces: Set<cg.Key> = new Set(),
    sameSquares: Set<cg.Key> = new Set(),
    movedPieces: Map<PieceName, cg.PieceNode[]> = new Map(),
    movedSquares: Map<string, cg.SquareNode[]> = new Map();
  let k: cg.Key,
    el: cg.PieceNode | cg.SquareNode | undefined,
    pieceAtKey: cg.Piece | undefined,
    elPieceName: PieceName,
    anim: AnimVector | undefined,
    fading: cg.Piece | undefined,
    pMvdset: cg.PieceNode[] | undefined,
    pMvd: cg.PieceNode | undefined,
    sMvdset: cg.SquareNode[] | undefined,
    sMvd: cg.SquareNode | undefined;

  el = boardEl.firstChild as cg.PieceNode | cg.SquareNode | undefined;
  while (el) {
    k = el.cgKey;
    if (isPieceNode(el)) {
      pieceAtKey = pieces.get(k);
      anim = anims.get(k);
      fading = fadings.get(k);
      elPieceName = el.cgPiece;
      if (el.cgDragging && (!curDrag || curDrag.orig !== k)) {
        el.classList.remove("dragging");
        translate(el, posToTranslate(key2pos(k), asWhite));
        el.cgDragging = false;
      }
      if (!fading && el.cgFading) {
        el.cgFading = false;
        el.classList.remove("fading");
      }
      if (pieceAtKey) {
        if (anim && el.cgAnimating && elPieceName === pieceNameOf(pieceAtKey)) {
          const pos = key2pos(k);
          pos[0] += anim[2];
          pos[1] += anim[3];
          el.classList.add("anim");
          translate(el, posToTranslate(pos, asWhite));
        } else if (el.cgAnimating) {
          el.cgAnimating = false;
          el.classList.remove("anim");
          translate(el, posToTranslate(key2pos(k), asWhite));
          if (s.addPieceZIndex) el.style.zIndex = posZIndex(key2pos(k), asWhite);
        }
        if (elPieceName === pieceNameOf(pieceAtKey) && (!fading || !el.cgFading)) {
          samePieces.add(k);
        }
        else {
          if (fading && elPieceName === pieceNameOf(fading)) {
            el.classList.add("fading");
            el.cgFading = true;
          } else {
            appendValue(movedPieces, elPieceName, el);
          }
        }
      }
      else {
        appendValue(movedPieces, elPieceName, el);
      }
    } else if (isSquareNode(el)) {
      const cn = el.className;
      if (squares.get(k) === cn) sameSquares.add(k);
      else appendValue(movedSquares, cn, el);
    }
    el = el.nextSibling as cg.PieceNode | cg.SquareNode | undefined;
  }

  for (const [sk, className] of squares) {
    if (!sameSquares.has(sk)) {
      sMvdset = movedSquares.get(className);
      sMvd = sMvdset && sMvdset.pop();
      const translation = posToTranslate(key2pos(sk), asWhite);
      if (sMvd) {
        sMvd.cgKey = sk;
        translate(sMvd, translation);
      } else {
        const squareNode = createEl("square", className) as cg.SquareNode;
        squareNode.cgKey = sk;
        translate(squareNode, translation);
        boardEl.insertBefore(squareNode, boardEl.firstChild);
      }
    }
  }
  for (const [k, p] of pieces) {
    anim = anims.get(k);
    if (!samePieces.has(k)) {
      pMvdset = movedPieces.get(pieceNameOf(p));
      pMvd = pMvdset && pMvdset.pop();
      if (pMvd) {
        pMvd.cgKey = k;
        if (pMvd.cgFading) {
          pMvd.classList.remove("fading");
          pMvd.cgFading = false;
        }
        const pos = key2pos(k);
        if (s.addPieceZIndex) pMvd.style.zIndex = posZIndex(pos, asWhite);
        if (anim) {
          pMvd.cgAnimating = true;
          pMvd.classList.add("anim");
          pos[0] += anim[2];
          pos[1] += anim[3];
        }
        translate(pMvd, posToTranslate(pos, asWhite));
      }
      else {
        const pieceName = pieceNameOf(p),
          pieceNode = createEl("piece", pieceName) as cg.PieceNode,
          pos = key2pos(k);

        pieceNode.cgPiece = pieceName;
        pieceNode.cgKey = k;
        if (anim) {
          pieceNode.cgAnimating = true;
          pos[0] += anim[2];
          pos[1] += anim[3];
        }
        translate(pieceNode, posToTranslate(pos, asWhite));

        if (s.addPieceZIndex) pieceNode.style.zIndex = posZIndex(pos, asWhite);

        boardEl.appendChild(pieceNode);
      }
    }
  }

  for (const nodes of movedPieces.values()) removeNodes(s, nodes);
  for (const nodes of movedSquares.values()) removeNodes(s, nodes);
}

export function renderResized(s: State): void {
  const asWhite: boolean = whitePov(s),
    posToTranslate = posToTranslateFromBounds(s.dom.bounds());
  let el = s.dom.elements.board.firstChild as cg.PieceNode | cg.SquareNode | undefined;
  while (el) {
    if ((isPieceNode(el) && !el.cgAnimating) || isSquareNode(el)) {
      translate(el, posToTranslate(key2pos(el.cgKey), asWhite));
    }
    el = el.nextSibling as cg.PieceNode | cg.SquareNode | undefined;
  }
}

export function updateBounds(s: State): void {
  const bounds = s.dom.elements.wrap.getBoundingClientRect();
  const container = s.dom.elements.container;
  const ratio = bounds.height / bounds.width;
  const width = (Math.floor((bounds.width * window.devicePixelRatio) / 8) * 8) / window.devicePixelRatio;
  const height = width * ratio;
  container.style.width = width + "px";
  container.style.height = height + "px";
  s.dom.bounds.clear();

  if (s.addDimensionsCssVars) {
    document.documentElement.style.setProperty("--cg-width", width + "px");
    document.documentElement.style.setProperty("--cg-height", height + "px");
  }
}

function isPieceNode(el: cg.PieceNode | cg.SquareNode): el is cg.PieceNode {
  return el.tagName === "PIECE";
}
function isSquareNode(el: cg.PieceNode | cg.SquareNode): el is cg.SquareNode {
  return el.tagName === "SQUARE";
}

function removeNodes(s: State, nodes: HTMLElement[]): void {
  for (const node of nodes) s.dom.elements.board.removeChild(node);
}

function posZIndex(pos: cg.Pos, asWhite: boolean): string {
  const minZ = 3;
  const rank = pos[1];
  const z = asWhite ? minZ + 7 - rank : minZ + rank;

  return `${z}`;
}

function pieceNameOf(piece: cg.Piece): string {
  return `${piece.color} ${piece.role}`;
}

function computeSquareClasses(s: State): SquareClasses {
  const squares: SquareClasses = new Map();
  if (s.lastMove && s.highlight.lastMove)
    for (const k of s.lastMove) {
      addSquare(squares, k, "last-move");
    }
  if (s.check && s.highlight.check) addSquare(squares, s.check, "check");
  if (s.selected) {
    addSquare(squares, s.selected, "selected");
    if (s.movable.showDests) {
      const dests = s.movable.dests?.get(s.selected);
      if (dests)
        for (const k of dests) {
          addSquare(squares, k, "move-dest" + (s.pieces.has(k) ? " oc" : ""));
        }
      const pDests = s.premovable.dests;
      if (pDests)
        for (const k of pDests) {
          addSquare(squares, k, "premove-dest" + (s.pieces.has(k) ? " oc" : ""));
        }
    }
  }
  const premove = s.premovable.current;
  if (premove) for (const k of premove) addSquare(squares, k, "current-premove");
  else if (s.predroppable.current) addSquare(squares, s.predroppable.current.key, "current-premove");

  const o = s.exploding;
  if (o) for (const k of o.keys) addSquare(squares, k, "exploding" + o.stage);

  return squares;
}

function addSquare(squares: SquareClasses, key: cg.Key, klass: string): void {
  const classes = squares.get(key);
  if (classes) squares.set(key, `${classes} ${klass}`);
  else squares.set(key, klass);
}

function appendValue<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const arr = map.get(key);
  if (arr) arr.push(value);
  else map.set(key, [value]);
}