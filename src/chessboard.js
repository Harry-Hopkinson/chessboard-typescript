import { start } from "./api";
import { configure } from "./config";
import { defaults } from "./state";
import { renderWrap } from "./wrap";
import * as events from "./events";
import { render, renderResized, updateBounds } from "./render";
import * as svg from "./svg";
import * as util from "./util";
export function chessboard(element, config) {
    const maybeState = defaults();
    configure(maybeState, config || {});
    function redrawAll() {
        const prevUnbind = "dom" in maybeState ? maybeState.dom.unbind : undefined;
        const elements = renderWrap(element, maybeState), bounds = util.memo(() => elements.board.getBoundingClientRect()), redrawNow = (skipSvg) => {
            render(state);
            if (!skipSvg && elements.svg)
                svg.renderSvg(state, elements.svg, elements.customSvg);
        }, onResize = () => {
            updateBounds(state);
            renderResized(state);
        };
        const state = maybeState;
        state.dom = {
            elements,
            bounds,
            redraw: debounceRedraw(redrawNow),
            redrawNow,
            unbind: prevUnbind,
        };
        state.drawable.prevSvgHash = "";
        updateBounds(state);
        redrawNow(false);
        events.bindBoard(state, onResize);
        if (!prevUnbind)
            state.dom.unbind = events.bindDocument(state, onResize);
        state.events.insert && state.events.insert(elements);
        return state;
    }
    return start(redrawAll(), redrawAll);
}
function debounceRedraw(redrawNow) {
    let redrawing = false;
    return () => {
        if (redrawing)
            return;
        redrawing = true;
        requestAnimationFrame(() => {
            redrawNow();
            redrawing = false;
        });
    };
}
