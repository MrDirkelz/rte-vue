import { h } from "vue";
import type { Component } from "vue";
import type { ToolbarItem } from "../types";

export const LinkIcon = h(
    "svg",
    {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "1.5",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        class: "rte-icon-svg",
        style: "width: 1.25em; height: 1.25em;",
    },
    [
        h("path", {
            d: "M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244",
        }),
    ],
);

export const LinkSlashIcon = h(
    "svg",
    {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "1.5",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        class: "rte-icon-svg",
        style: "width: 1.25em; height: 1.25em;",
    },
    [
        h("path", {
            d: "M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1",
        }),
        h("line", { x1: "3", y1: "3", x2: "21", y2: "21" }),
    ],
);

export const defaultToolbarIcons: Partial<Record<ToolbarItem, Component>> = {
    link: LinkIcon,
    unlink: LinkSlashIcon,
};
