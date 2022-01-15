import * as drag from "./drag";
import * as draw from "./draw";
import { drop } from "./drop";
import { isRightButton } from "./util";
export function bindBoard(s, onResize) {
    const boardEl = s.dom.elements.board;
    if ("ResizeObserver" in window)
        new ResizeObserver(onResize).observe(s.dom.elements.wrap);
    if (s.viewOnly)
        return;
    const onStart = startDragOrDraw(s);
    boardEl.addEventListener("touchstart", onStart, {
        passive: false,
    });
    boardEl.addEventListener("mousedown", onStart, {
        passive: false,
    });
    if (s.disableContextMenu || s.drawable.enabled) {
        boardEl.addEventListener("contextmenu", e => e.preventDefault());
    }
}
export function bindDocument(s, onResize) {
    const unbinds = [];
    if (!("ResizeObserver" in window))
        unbinds.push(unbindable(document.body, "chessground.resize", onResize));
    if (!s.viewOnly) {
        const onmove = dragOrDraw(s, drag.move, draw.move);
        const onend = dragOrDraw(s, drag.end, draw.end);
        for (const ev of ["touchmove", "mousemove"])
            unbinds.push(unbindable(document, ev, onmove));
        for (const ev of ["touchend", "mouseup"])
            unbinds.push(unbindable(document, ev, onend));
        const onScroll = () => s.dom.bounds.clear();
        unbinds.push(unbindable(document, "scroll", onScroll, { capture: true, passive: true }));
        unbinds.push(unbindable(window, "resize", onScroll, { passive: true }));
    }
    return () => unbinds.forEach(f => f());
}
function unbindable(el, eventName, callback, options) {
    el.addEventListener(eventName, callback, options);
    return () => el.removeEventListener(eventName, callback, options);
}
function startDragOrDraw(s) {
    return e => {
        if (s.draggable.current)
            drag.cancel(s);
        else if (s.drawable.current)
            draw.cancel(s);
        else if (e.shiftKey || isRightButton(e)) {
            if (s.drawable.enabled)
                draw.start(s, e);
        }
        else if (!s.viewOnly) {
            if (s.dropmode.active)
                drop(s, e);
            else
                drag.start(s, e);
        }
    };
}
function dragOrDraw(s, withDrag, withDraw) {
    return e => {
        if (s.drawable.current) {
            if (s.drawable.enabled)
                withDraw(s, e);
        }
        else if (!s.viewOnly)
            withDrag(s, e);
    };
}
//# sourceMappingURL=events.js.map