import { setCheck, setSelected } from "./board";
import { read as fenRead } from "./fen";
export function applyAnimation(state, config) {
    if (config.animation) {
        deepMerge(state.animation, config.animation);
        if ((state.animation.duration || 0) < 70)
            state.animation.enabled = false;
    }
}
export function configure(state, config) {
    var _a, _b;
    if ((_a = config.movable) === null || _a === void 0 ? void 0 : _a.dests)
        state.movable.dests = undefined;
    if ((_b = config.drawable) === null || _b === void 0 ? void 0 : _b.autoShapes)
        state.drawable.autoShapes = [];
    deepMerge(state, config);
    if (config.fen) {
        state.pieces = fenRead(config.fen);
        state.drawable.shapes = [];
    }
    if ("check" in config)
        setCheck(state, config.check || false);
    if ("lastMove" in config && !config.lastMove)
        state.lastMove = undefined;
    else if (config.lastMove)
        state.lastMove = config.lastMove;
    if (state.selected)
        setSelected(state, state.selected);
    applyAnimation(state, config);
    if (!state.movable.rookCastle && state.movable.dests) {
        const rank = state.movable.color === "white" ? "1" : "8", kingStartPos = ("e" + rank), dests = state.movable.dests.get(kingStartPos), king = state.pieces.get(kingStartPos);
        if (!dests || !king || king.role !== "king")
            return;
        state.movable.dests.set(kingStartPos, dests.filter(d => !(d === "a" + rank && dests.includes(("c" + rank))) &&
            !(d === "h" + rank && dests.includes(("g" + rank)))));
    }
}
function deepMerge(base, extend) {
    for (const key in extend) {
        if (isObject(base[key]) && isObject(extend[key]))
            deepMerge(base[key], extend[key]);
        else
            base[key] = extend[key];
    }
}
function isObject(o) {
    return typeof o === "object";
}
