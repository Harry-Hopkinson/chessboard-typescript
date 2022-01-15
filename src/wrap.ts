import { HeadlessState } from "./state.js";
import { setVisible, createEl } from "./util.js";
import { colors, files, ranks, Elements } from "./types.js";
import { createElement as createSVG, setAttributes } from "./svg.js";

export function renderWrap(element: HTMLElement, s: HeadlessState): Elements {
  element.innerHTML = "";
  element.classList.add("cg-wrap");

  for (const c of colors) element.classList.toggle("orientation-" + c, s.orientation === c);
  element.classList.toggle("manipulable", !s.viewOnly);

  const container = createEl("cg-container");
  element.appendChild(container);
  const board = createEl("cg-board");
  container.appendChild(board);

  let svg: SVGElement | undefined;
  let customSvg: SVGElement | undefined;
  if (s.drawable.visible) {
    svg = setAttributes(createSVG("svg"), {
      class: "cg-shapes",
      viewBox: "-4 -4 8 8",
      preserveAspectRatio: "xMidYMid slice",
    });
    svg.appendChild(createSVG("defs"));
    svg.appendChild(createSVG("g"));
    customSvg = setAttributes(createSVG("svg"), {
      class: "cg-custom-svgs",
      viewBox: "-3.5 -3.5 8 8",
      preserveAspectRatio: "xMidYMid slice",
    });
    customSvg.appendChild(createSVG("g"));
    container.appendChild(svg);
    container.appendChild(customSvg);
  }

  if (s.coordinates) {
    const orientClass = s.orientation === "black" ? " black" : "";
    const ranksPositionClass = s.ranksPosition === "left" ? " left" : "";
    container.appendChild(renderCoords(ranks, "ranks" + orientClass + ranksPositionClass));
    container.appendChild(renderCoords(files, "files" + orientClass));
  }

  let ghost: HTMLElement | undefined;
  if (s.draggable.showGhost) {
    ghost = createEl("piece", "ghost");
    setVisible(ghost, false);
    container.appendChild(ghost);
  }

  return {
    board,
    container,
    wrap: element,
    ghost,
    svg,
    customSvg,
  };
}

function renderCoords(elems: readonly string[], className: string): HTMLElement {
  const el = createEl("coords", className);
  let f: HTMLElement;
  for (const elem of elems) {
    f = createEl("coord");
    f.textContent = elem;
    el.appendChild(f);
  }
  return el;
}