export { useRef, useState, useEffect } from "./hooks/index.js";
import { UpdateDispatcher, exposedComponents, Observable, } from "./shared-internals.js";
/**
 * Exposes a component to be grabbed by the initial render process.
 * @param components List of components to add
 * @param optNames Optional list of names if they shall not be auto-retrieved from the components class name.
 */
function expose(components, optNames = []) {
    optNames = Array.from([optNames]).flat();
    var i = 0;
    for (const key in components) {
        const component = components[key];
        var name = (typeof optNames[i] === "undefined" ? key : optNames[i]).toLowerCase();
        exposedComponents[name] = component;
    }
}
class Component {
    constructor(props, generator) {
        this.props = props;
        this.generator = generator;
        this.didMountCallbacks = [];
        this.didUpdateCallbacks = [];
        this.willUnmountCallbacks = [];
        /**
         * Write component to the UpdateDispatcher to be captured by any hooks, close immediately after.
         */
        UpdateDispatcher.next(this);
        UpdateDispatcher.restore();
    }
    render() {
        return this.generator(this.props);
    }
    onComponentDidMount(callback) {
        this.didMountCallbacks.push(callback);
    }
    onComponentDidUpdate(callback) {
        this.didUpdateCallbacks.push(callback);
    }
    onComponentWillUnmount(callback) {
        this.willUnmountCallbacks.push(callback);
    }
}
function SnowblindFragment() {
    return document.createDocumentFragment();
}
/**
 * Searches the DOMTree recursively for components, this will ensure parent nodes will be rendered and their children will be included in the render afterwards
 */
function renderAllIn(element) {
    const recurse = (parentList) => {
        // Filter out scripts
        for (const parent of parentList) {
            if (parent instanceof HTMLScriptElement) {
                continue;
            }
            let nodeName = parent.nodeName.toLowerCase();
            if (exposedComponents.hasOwnProperty(nodeName)) {
                // Element nodeName in the names of exposed components, it must be one!
                let component = exposedComponents[nodeName];
                let isFunction = typeof component === "function";
                if (isFunction) {
                    const props = this.getNodeProperties(parent);
                    new Snowblind.Component(props, component, {
                        hasTheme: false,
                        replace: parent,
                    });
                }
            }
            else {
                // No component here! Let's go deeper!
                recurse(Array.from(parent.children));
            }
        }
    };
    recurse(Array.from(element.children));
}
function render(parent, element) {
    parent.appendChild(element.render());
}
const eventBus = {
    on(event, callback) {
        document.addEventListener(event, (e) => callback(e instanceof CustomEvent ? e.detail : undefined));
    },
    dispatch(event, data) {
        document.dispatchEvent(new CustomEvent(event, {
            detail: data,
        }));
    },
    remove(event, callback) {
        document.removeEventListener(event, callback);
    },
};
/**
 * A function that generates an HTML node from given inputs.
 * @param initializer The HTML type of the component or an initializer function to be called generating the HTML content.
 * @param props An object containing all attributes supposed to be assigned to the component.
 * @param children An array of child elements.
 * @returns The generated node as HTMLElement.
 */
function make(initializer, props, ...children) {
    let node;
    if (typeof initializer === "function") {
        return new Component(props, initializer);
    }
    else {
        node = document.createElement(initializer);
    }
    if (props) {
        for (const [key, value] of Object.entries(props)) {
            if (typeof value === "function") {
                // Try trimming the "on" from the key name
                const eventName = key.replace(/^on/, "").toLowerCase();
                node.addEventListener(eventName, value);
            }
            else if (value instanceof Observable) {
                value.subscribe((newValue) => {
                    node.setAttribute(key, newValue);
                });
                node.setAttribute(key, value.value);
            }
            else {
                node.setAttribute(key, value.toString());
            }
        }
    }
    for (const child of children.flat(Infinity)) {
        if (child instanceof Component) {
            node.appendChild(child.render());
        }
        else if (child instanceof HTMLElement) {
            node.appendChild(child);
        }
        else if (child instanceof Observable) {
            // Store the generated item in a variable so we can access it on each update.
            let lastItem = document.createTextNode(child.value);
            child.subscribe((newValue) => {
                // Change the value of the child node.
                lastItem.textContent = newValue;
            });
            node.appendChild(lastItem);
        }
        else {
            node.appendChild(document.createTextNode(child));
        }
    }
    return node;
}
const Snowblind = {
    Component: Component,
    Fragment: SnowblindFragment,
    make: make,
    render: render,
    renderAllIn: renderAllIn,
    eventBus: eventBus,
};
window.addEventListener("load", () => {
    renderAllIn(document.body);
});
export { Snowblind, expose };
//# sourceMappingURL=snowblind.js.map