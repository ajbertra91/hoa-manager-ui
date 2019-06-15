export function dispatchEvents(specs) {
    const {name, el, value} = specs;
    el.dispatchEvent(new CustomEvent(name, {bubbles: true, detail: value}));
}