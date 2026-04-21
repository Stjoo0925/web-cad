/**
 * default-commands.ts
 * Built-in Command Definitions
 *
 * Provides comprehensive CAD commands with options and descriptions.
 * Commands are registered into the CommandRegistry.
 */

import type { CommandDefinition, CommandOption } from "./command-registry.js";

// Common option definitions shared across commands
const POINT_OPTIONS: CommandOption[] = [
  { name: "startPoint", type: "point", description: "Start point (x,y)" },
  { name: "endPoint", type: "point", description: "End point (x,y)" },
];

const CENTER_RADIUS_OPTIONS: CommandOption[] = [
  { name: "center", type: "point", description: "Center point (x,y)", required: true },
  { name: "radius", type: "number", description: "Circle radius" },
  { name: "diameter", type: "number", description: "Circle diameter (alternative to radius)" },
];

const THREE_POINT_OPTIONS: CommandOption[] = [
  { name: "startPoint", type: "point", description: "Start point", required: true },
  { name: "secondPoint", type: "point", description: "Second point", required: true },
  { name: "endPoint", type: "point", description: "End point", required: true },
];

const ENTITY_SELECTION_OPTIONS: CommandOption[] = [
  { name: "entities", type: "selection", description: "Entity IDs to select" },
  { name: "layer", type: "string", description: "Filter by layer" },
  { name: "type", type: "string", description: "Filter by entity type" },
];

const DISTANCE_OPTIONS: CommandOption[] = [
  { name: "distance", type: "number", description: "Distance value", required: true },
  { name: "mode", type: "string", description: "Distance mode (absolute/relative)" },
];

// DRAW Commands
export const LINE_COMMAND: CommandDefinition = {
  name: "LINE",
  aliases: ["L"],
  group: "DRAW",
  description: "Draw a line segment between two points",
  options: [
    { name: "startPoint", type: "point", description: "Start point (x,y)" },
    { name: "endPoint", type: "point", description: "End point (x,y)" },
    { name: "continuous", type: "boolean", description: "Continuous line mode" },
  ],
  execute: async (ctx, args) => {
    const start = args.startPoint as { x: number; y: number } | undefined;
    const end = args.endPoint as { x: number; y: number } | undefined;

    if (!start || !end) {
      return { success: false, error: "Start and end points required" };
    }

    return {
      success: true,
      message: `LINE: ${start.x},${start.y} to ${end.x},${end.y}`,
    };
  },
};

export const CIRCLE_COMMAND: CommandDefinition = {
  name: "CIRCLE",
  aliases: ["C", "CI"],
  group: "DRAW",
  description: "Draw a circle by center and radius",
  options: [
    { name: "center", type: "point", description: "Center point (x,y)", required: true },
    { name: "radius", type: "number", description: "Circle radius" },
    { name: "diameter", type: "number", description: "Circle diameter (alternative to radius)" },
    { name: "3p", type: "boolean", description: "Three-point circle mode" },
  ],
  execute: async (ctx, args) => {
    const center = args.center as { x: number; y: number } | undefined;

    if (!center) {
      return { success: false, error: "Center point required" };
    }

    const radius = args.radius ?? args.diameter ? (args.diameter as number) / 2 : undefined;

    if (!radius) {
      return { success: false, error: "Radius or diameter required" };
    }

    return {
      success: true,
      message: `CIRCLE: center (${center.x},${center.y}), radius ${radius}`,
    };
  },
};

export const ARC_COMMAND: CommandDefinition = {
  name: "ARC",
  aliases: ["A"],
  group: "DRAW",
  description: "Draw an arc",
  options: [
    { name: "startPoint", type: "point", description: "Start point" },
    { name: "secondPoint", type: "point", description: "Second point (for 3-point arc)" },
    { name: "endPoint", type: "point", description: "End point" },
    { name: "center", type: "point", description: "Center point" },
    { name: "radius", type: "number", description: "Arc radius" },
    { name: "startAngle", type: "number", description: "Start angle in degrees" },
    { name: "endAngle", type: "number", description: "End angle in degrees" },
    { name: "includeAngle", type: "boolean", description: "Include angle mode" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "ARC command executed" };
  },
};

export const POLYLINE_COMMAND: CommandDefinition = {
  name: "POLYLINE",
  aliases: ["PL", "P"],
  group: "DRAW",
  description: "Draw a polyline (connected line segments)",
  options: [
    { name: "close", type: "boolean", description: "Close polyline to form polygon" },
    { name: "width", type: "number", description: "Polyline width" },
    { name: "spline", type: "boolean", description: "Fit as spline curve" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "POLYLINE command executed" };
  },
};

export const ELLIPSE_COMMAND: CommandDefinition = {
  name: "ELLIPSE",
  aliases: ["EL"],
  group: "DRAW",
  description: "Draw an ellipse or elliptical arc",
  options: [
    { name: "center", type: "point", description: "Center point", required: true },
    { name: "majorAxis", type: "number", description: "Major axis length" },
    { name: "minorAxis", type: "number", description: "Minor axis length" },
    { name: "rotation", type: "number", description: "Rotation angle" },
    { name: "startAngle", type: "number", description: "Start angle" },
    { name: "endAngle", type: "number", description: "End angle" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "ELLIPSE command executed" };
  },
};

export const SPLINE_COMMAND: CommandDefinition = {
  name: "SPLINE",
  aliases: ["SPL", "SP"],
  group: "DRAW",
  description: "Draw a smooth spline curve through specified points",
  options: [
    { name: "degree", type: "number", defaultValue: 3, description: "Spline degree (2-3)" },
    { name: "fitPoints", type: "selection", description: "Fit points" },
    { name: "close", type: "boolean", description: "Close spline" },
    { name: "startTangent", type: "point", description: "Start tangent direction" },
    { name: "endTangent", type: "point", description: "End tangent direction" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "SPLINE command executed" };
  },
};

export const RECTANGLE_COMMAND: CommandDefinition = {
  name: "RECTANGLE",
  aliases: ["REC", "RECT"],
  group: "DRAW",
  description: "Draw a rectangle by two opposite corners",
  options: [
    { name: "firstCorner", type: "point", description: "First corner", required: true },
    { name: "secondCorner", type: "point", description: "Second corner", required: true },
    { name: "width", type: "number", description: "Rectangle width" },
    { name: "height", type: "number", description: "Rectangle height" },
    { name: "rotation", type: "number", description: "Rotation angle" },
    { name: "chamfer", type: "number", description: "Chamfer distance" },
    { name: "fillet", type: "number", description: "Fillet radius" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "RECTANGLE command executed" };
  },
};

export const HATCH_COMMAND: CommandDefinition = {
  name: "HATCH",
  aliases: ["H", "BH"],
  group: "DRAW",
  description: "Fill enclosed area with pattern",
  options: [
    { name: "pattern", type: "string", defaultValue: "ANSI31", description: "Hatch pattern name" },
    { name: "scale", type: "number", defaultValue: 1, description: "Pattern scale" },
    { name: "angle", type: "number", defaultValue: 0, description: "Pattern angle" },
    { name: "solid", type: "boolean", description: "Solid fill instead of pattern" },
    { name: "layer", type: "layer", description: "Hatch layer" },
    { name: "color", type: "string", description: "Hatch color" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "HATCH command executed" };
  },
};

export const DIMENSION_COMMAND: CommandDefinition = {
  name: "DIMENSION",
  aliases: ["DIM", "D"],
  group: "DRAW",
  description: "Create dimension annotation",
  options: [
    { name: "type", type: "string", defaultValue: "linear", description: "Dimension type (linear/angular/radius/diameter)" },
    { name: "style", type: "string", defaultValue: "STANDARD", description: "Dimension style" },
    { name: "textHeight", type: "number", description: "Text height" },
    { name: "precision", type: "number", defaultValue: 4, description: "Decimal precision" },
    { name: "layer", type: "layer", description: "Dimension layer" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "DIMENSION command executed" };
  },
};

export const TEXT_COMMAND: CommandDefinition = {
  name: "TEXT",
  aliases: ["T", "DT"],
  group: "DRAW",
  description: "Create single-line text",
  options: [
    { name: "position", type: "point", description: "Text position", required: true },
    { name: "height", type: "number", required: true, description: "Text height" },
    { name: "rotation", type: "number", defaultValue: 0, description: "Text rotation angle" },
    { name: "text", type: "string", description: "Text content" },
    { name: "style", type: "string", defaultValue: "STANDARD", description: "Text style" },
    { name: "color", type: "string", description: "Text color" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "TEXT command executed" };
  },
};

export const MTEXT_COMMAND: CommandDefinition = {
  name: "MTEXT",
  aliases: ["MT", "M"],
  group: "DRAW",
  description: "Create multiline text",
  options: [
    { name: "position", type: "point", description: "Text position", required: true },
    { name: "width", type: "number", description: "Text box width" },
    { name: "height", type: "number", required: true, description: "Text height" },
    { name: "rotation", type: "number", defaultValue: 0, description: "Text rotation" },
    { name: "style", type: "string", defaultValue: "STANDARD", description: "Text style" },
    { name: "text", type: "string", description: "Text content" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "MTEXT command executed" };
  },
};

export const INSERT_COMMAND: CommandDefinition = {
  name: "INSERT",
  aliases: ["I"],
  group: "DRAW",
  description: "Insert block or drawing",
  options: [
    { name: "blockName", type: "string", required: true, description: "Block name to insert" },
    { name: "insertPoint", type: "point", description: "Insertion point" },
    { name: "xScale", type: "number", defaultValue: 1, description: "X scale factor" },
    { name: "yScale", type: "number", defaultValue: 1, description: "Y scale factor" },
    { name: "rotation", type: "number", defaultValue: 0, description: "Rotation angle" },
    { name: "columns", type: "number", defaultValue: 1, description: "Column count for array insert" },
    { name: "rows", type: "number", defaultValue: 1, description: "Row count for array insert" },
    { name: "columnSpacing", type: "number", description: "Column spacing" },
    { name: "rowSpacing", type: "number", description: "Row spacing" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "INSERT command executed" };
  },
};

// EDIT Commands
export const MOVE_COMMAND: CommandDefinition = {
  name: "MOVE",
  aliases: ["M"],
  group: "EDIT",
  description: "Move entities by offset",
  options: [
    { name: "basePoint", type: "point", description: "Base point of displacement" },
    { name: "displacement", type: "point", description: "Displacement vector (second point)" },
    { name: "entities", type: "selection", description: "Entities to move" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "MOVE command executed" };
  },
};

export const COPY_COMMAND: CommandDefinition = {
  name: "COPY",
  aliases: ["CO", "CP"],
  group: "EDIT",
  description: "Copy entities",
  options: [
    { name: "basePoint", type: "point", description: "Base point" },
    { name: "secondPoint", type: "point", description: "Second point (displacement)" },
    { name: "entities", type: "selection", description: "Entities to copy" },
    { name: "multiple", type: "boolean", description: "Multiple copy mode" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "COPY command executed" };
  },
};

export const ROTATE_COMMAND: CommandDefinition = {
  name: "ROTATE",
  aliases: ["RO"],
  group: "EDIT",
  description: "Rotate entities around a point",
  options: [
    { name: "basePoint", type: "point", description: "Rotation center point", required: true },
    { name: "angle", type: "number", description: "Rotation angle in degrees" },
    { name: "entities", type: "selection", description: "Entities to rotate" },
    { name: "copy", type: "boolean", description: "Copy instead of move" },
    { name: "reference", type: "boolean", description: "Reference angle mode" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "ROTATE command executed" };
  },
};

export const SCALE_COMMAND: CommandDefinition = {
  name: "SCALE",
  aliases: ["SC"],
  group: "EDIT",
  description: "Scale entities",
  options: [
    { name: "basePoint", type: "point", description: "Scale center point", required: true },
    { name: "scaleFactor", type: "number", description: "Scale factor" },
    { name: "entities", type: "selection", description: "Entities to scale" },
    { name: "copy", type: "boolean", description: "Copy instead of reference" },
    { name: "reference", type: "boolean", description: "Reference length mode" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "SCALE command executed" };
  },
};

export const MIRROR_COMMAND: CommandDefinition = {
  name: "MIRROR",
  aliases: ["MI"],
  group: "EDIT",
  description: "Mirror entities across a line",
  options: [
    { name: "firstPoint", type: "point", description: "First point on mirror line", required: true },
    { name: "secondPoint", type: "point", description: "Second point on mirror line", required: true },
    { name: "entities", type: "selection", description: "Entities to mirror" },
    { name: "delete", type: "boolean", description: "Delete source entities" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "MIRROR command executed" };
  },
};

export const OFFSET_COMMAND: CommandDefinition = {
  name: "OFFSET",
  aliases: ["O"],
  group: "EDIT",
  description: "Create offset copy of entity",
  options: [
    { name: "distance", type: "number", required: true, description: "Offset distance" },
    { name: "entities", type: "selection", description: "Entities to offset" },
    { name: "through", type: "boolean", description: "Through point mode" },
    { name: "layer", type: "layer", description: "Layer for offset entities" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "OFFSET command executed" };
  },
};

export const TRIM_COMMAND: CommandDefinition = {
  name: "TRIM",
  aliases: ["TR"],
  group: "EDIT",
  description: "Trim entities to boundaries",
  options: [
    { name: "cuttingEdges", type: "selection", description: "Cutting edge entities" },
    { name: "entities", type: "selection", description: "Entities to trim" },
    { name: "fence", type: "boolean", description: "Fence selection mode" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "TRIM command executed" };
  },
};

export const EXTEND_COMMAND: CommandDefinition = {
  name: "EXTEND",
  aliases: ["EX"],
  group: "EDIT",
  description: "Extend entities to boundaries",
  options: [
    { name: "boundaryEdges", type: "selection", description: "Boundary edge entities" },
    { name: "entities", type: "selection", description: "Entities to extend" },
    { name: "fence", type: "boolean", description: "Fence selection mode" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "EXTEND command executed" };
  },
};

export const FILLET_COMMAND: CommandDefinition = {
  name: "FILLET",
  aliases: ["F", "FI"],
  group: "EDIT",
  description: "Fillet (round) corners of entities",
  options: [
    { name: "radius", type: "number", defaultValue: 5, description: "Fillet radius" },
    { name: "trim", type: "boolean", defaultValue: true, description: "Trim extending portions" },
    { name: "entities", type: "selection", description: "Two entities to fillet" },
    { name: "polyline", type: "boolean", description: "Fillet all corners of polyline" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "FILLET command executed" };
  },
};

export const CHAMFER_COMMAND: CommandDefinition = {
  name: "CHAMFER",
  aliases: ["CHA"],
  group: "EDIT",
  description: "Chamfer corners of entities",
  options: [
    { name: "distance1", type: "number", defaultValue: 5, description: "First chamfer distance" },
    { name: "distance2", type: "number", defaultValue: 5, description: "Second chamfer distance" },
    { name: "angle", type: "number", description: "Chamfer angle" },
    { name: "trim", type: "boolean", defaultValue: true, description: "Trim extending portions" },
    { name: "entities", type: "selection", description: "Two entities to chamfer" },
    { name: "polyline", type: "boolean", description: "Chamfer all corners of polyline" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "CHAMFER command executed" };
  },
};

export const BREAK_COMMAND: CommandDefinition = {
  name: "BREAK",
  aliases: ["BR"],
  group: "EDIT",
  description: "Break entity at two points",
  options: [
    { name: "firstPoint", type: "point", description: "First break point" },
    { name: "secondPoint", type: "point", description: "Second break point" },
    { name: "entities", type: "selection", description: "Entity to break" },
    { name: "atPoint", type: "point", description: "Single point break (use firstPoint)" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "BREAK command executed" };
  },
};

export const JOIN_COMMAND: CommandDefinition = {
  name: "JOIN",
  aliases: ["J"],
  group: "EDIT",
  description: "Join entities into single entity",
  options: [
    { name: "entities", type: "selection", description: "Entities to join" },
    { name: "type", type: "string", description: "Join type (all/same/adjacent)" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "JOIN command executed" };
  },
};

export const STRETCH_COMMAND: CommandDefinition = {
  name: "STRETCH",
  aliases: ["S"],
  group: "EDIT",
  description: "Stretch entities by moving endpoints",
  options: [
    { name: "basePoint", type: "point", description: "Base point" },
    { name: "displacement", type: "point", description: "Displacement" },
    { name: "fence", type: "boolean", description: "Fence selection mode" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "STRETCH command executed" };
  },
};

export const ARRAY_COMMAND: CommandDefinition = {
  name: "ARRAY",
  aliases: ["AR"],
  group: "EDIT",
  description: "Create array of entities",
  options: [
    { name: "type", type: "string", defaultValue: "rectangular", description: "Array type (rectangular/polar)" },
    { name: "rows", type: "number", defaultValue: 1, description: "Number of rows" },
    { name: "columns", type: "number", defaultValue: 1, description: "Number of columns" },
    { name: "rowSpacing", type: "number", description: "Row spacing" },
    { name: "columnSpacing", type: "number", description: "Column spacing" },
    { name: "angle", type: "number", description: "Array rotation angle" },
    { name: "entities", type: "selection", description: "Entities to array" },
    { name: "polarCenter", type: "point", description: "Polar array center" },
    { name: "itemCount", type: "number", description: "Number of items in polar array" },
    { name: "fillAngle", type: "number", description: "Polar array fill angle" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "ARRAY command executed" };
  },
};

export const ERASE_COMMAND: CommandDefinition = {
  name: "ERASE",
  aliases: ["E", "DEL"],
  group: "EDIT",
  description: "Erase (delete) entities",
  options: [
    { name: "entities", type: "selection", description: "Entities to erase" },
    { name: "all", type: "boolean", description: "Erase all entities" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "ERASE command executed" };
  },
};

// LAYER Commands
export const LAYER_COMMAND: CommandDefinition = {
  name: "LAYER",
  aliases: ["LA", "LAY"],
  group: "LAYER",
  description: "Layer management and properties",
  options: [
    { name: "name", type: "string", description: "Layer name" },
    { name: "color", type: "string", description: "Layer color" },
    { name: "linetype", type: "linetype", description: "Layer linetype" },
    { name: "lineweight", type: "number", description: "Layer lineweight" },
    { name: "on", type: "boolean", description: "Turn layer on" },
    { name: "off", type: "boolean", description: "Turn layer off" },
    { name: "lock", type: "boolean", description: "Lock layer" },
    { name: "unlock", type: "boolean", description: "Unlock layer" },
    { name: "freeze", type: "boolean", description: "Freeze layer" },
    { name: "thaw", type: "boolean", description: "Thaw layer" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "LAYER command executed" };
  },
};

export const COLOR_COMMAND: CommandDefinition = {
  name: "COLOR",
  aliases: ["COL", "C"],
  group: "LAYER",
  description: "Set current color",
  options: [
    { name: "color", type: "string", description: "Color name or number (1-255)" },
    { name: "rgb", type: "string", description: "RGB color value (r,g,b)" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "COLOR command executed" };
  },
};

export const LINETYPE_COMMAND: CommandDefinition = {
  name: "LINETYPE",
  aliases: ["LT", "LTYPE"],
  group: "LAYER",
  description: "Load and set linetype",
  options: [
    { name: "name", type: "string", description: "Linetype name" },
    { name: "scale", type: "number", description: "Linetype scale" },
    { name: "load", type: "boolean", description: "Load linetype from file" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "LINETYPE command executed" };
  },
};

export const LINEWEIGHT_COMMAND: CommandDefinition = {
  name: "LINEWEIGHT",
  aliases: ["LW"],
  group: "LAYER",
  description: "Set current lineweight",
  options: [
    { name: "lineweight", type: "number", description: "Lineweight value (0-211)" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "LINEWEIGHT command executed" };
  },
};

// VIEW Commands
export const ZOOM_COMMAND: CommandDefinition = {
  name: "ZOOM",
  aliases: ["Z"],
  group: "VIEW",
  description: "Zoom viewport",
  options: [
    { name: "factor", type: "number", description: "Zoom factor" },
    { name: "all", type: "boolean", description: "Zoom to all" },
    { name: "extents", type: "boolean", description: "Zoom to extents" },
    { name: "center", type: "point", description: "Zoom center point" },
    { name: "window", type: "selection", description: "Zoom window corners" },
    { name: "previous", type: "boolean", description: "Zoom to previous" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "ZOOM command executed" };
  },
};

export const PAN_COMMAND: CommandDefinition = {
  name: "PAN",
  aliases: ["P"],
  group: "VIEW",
  description: "Pan viewport",
  options: [
    { name: "displacement", type: "point", description: "Pan displacement" },
    { name: "center", type: "point", description: "Pan to center point" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "PAN command executed" };
  },
};

export const REGEN_COMMAND: CommandDefinition = {
  name: "REGEN",
  aliases: ["RE"],
  group: "VIEW",
  description: "Regenerate drawing and refresh display",
  options: [],
  execute: async (ctx, args) => {
    return { success: true, message: "REGEN command executed" };
  },
};

export const REDRAW_COMMAND: CommandDefinition = {
  name: "REDRAW",
  aliases: ["R"],
  group: "VIEW",
  description: "Refresh display without regeneration",
  options: [],
  execute: async (ctx, args) => {
    return { success: true, message: "REDRAW command executed" };
  },
};

// UTILITY Commands
export const UNDO_COMMAND: CommandDefinition = {
  name: "UNDO",
  aliases: ["U"],
  group: "UTILITY",
  description: "Undo last command",
  options: [
    { name: "count", type: "number", description: "Number of operations to undo" },
    { name: "begin", type: "boolean", description: "Begin undo group" },
    { name: "end", type: "boolean", description: "End undo group" },
    { name: "marker", type: "string", description: "Undo to marker" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "UNDO command executed" };
  },
};

export const REDO_COMMAND: CommandDefinition = {
  name: "REDO",
  aliases: ["CTRL+Y"],
  group: "UTILITY",
  description: "Redo last undone command",
  options: [
    { name: "count", type: "number", description: "Number of operations to redo" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "REDO command executed" };
  },
};

export const SELECT_COMMAND: CommandDefinition = {
  name: "SELECT",
  aliases: ["SI", "SEL"],
  group: "UTILITY",
  description: "Select entities",
  options: [
    { name: "entities", type: "selection", description: "Entities to select" },
    { name: "window", type: "selection", description: "Window selection" },
    { name: "crossing", type: "selection", description: "Crossing selection" },
    { name: "fence", type: "selection", description: "Fence selection" },
    { name: "all", type: "boolean", description: "Select all" },
    { name: "last", type: "boolean", description: "Select last created" },
    { name: "previous", type: "boolean", description: "Select previous selection" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "SELECT command executed" };
  },
};

export const LIST_COMMAND: CommandDefinition = {
  name: "LIST",
  aliases: ["LI", "LS"],
  group: "UTILITY",
  description: "List entity information",
  options: [
    { name: "entities", type: "selection", description: "Entities to list" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "LIST command executed" };
  },
};

export const DIST_COMMAND: CommandDefinition = {
  name: "DIST",
  aliases: ["DI"],
  group: "UTILITY",
  description: "Measure distance between two points",
  options: [
    { name: "firstPoint", type: "point", description: "First point" },
    { name: "secondPoint", type: "point", description: "Second point" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "DIST command executed" };
  },
};

export const AREA_COMMAND: CommandDefinition = {
  name: "AREA",
  aliases: ["AA"],
  group: "UTILITY",
  description: "Calculate area of enclosed region",
  options: [
    { name: "add", type: "boolean", description: "Add to calculation" },
    { name: "subtract", type: "boolean", description: "Subtract from calculation" },
    { name: "object", type: "selection", description: "Calculate from object" },
    { name: "points", type: "selection", description: "Calculate from points" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "AREA command executed" };
  },
};

export const ID_COMMAND: CommandDefinition = {
  name: "ID",
  aliases: ["I"],
  group: "UTILITY",
  description: "Display point coordinates",
  options: [
    { name: "point", type: "point", description: "Point to identify" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "ID command executed" };
  },
};

export const PROPERTIES_COMMAND: CommandDefinition = {
  name: "PROPERTIES",
  aliases: ["PR", "PROPS"],
  group: "UTILITY",
  description: "Show properties panel",
  options: [
    { name: "entities", type: "selection", description: "Entities to show properties for" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "PROPERTIES command executed" };
  },
};

export const HELP_COMMAND: CommandDefinition = {
  name: "HELP",
  aliases: ["?", "H"],
  group: "UTILITY",
  description: "Display help information",
  options: [
    { name: "command", type: "string", description: "Command to get help for" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "HELP command executed" };
  },
};

// Block commands
export const BLOCK_COMMAND: CommandDefinition = {
  name: "BLOCK",
  aliases: ["B"],
  group: "BLOCK",
  description: "Create block definition",
  options: [
    { name: "name", type: "string", required: true, description: "Block name" },
    { name: "basePoint", type: "point", description: "Block base point" },
    { name: "entities", type: "selection", description: "Entities to include in block" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "BLOCK command executed" };
  },
};

// File commands
export const SAVE_COMMAND: CommandDefinition = {
  name: "SAVE",
  aliases: ["S", "QSAVE"],
  group: "FILE",
  description: "Save current drawing",
  options: [
    { name: "filename", type: "filename", description: "Save as filename" },
    { name: "all", type: "boolean", description: "Save all drawings" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "SAVE command executed" };
  },
};

export const OPEN_COMMAND: CommandDefinition = {
  name: "OPEN",
  aliases: ["OP"],
  group: "FILE",
  description: "Open existing drawing",
  options: [
    { name: "filename", type: "filename", description: "File to open" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "OPEN command executed" };
  },
};

export const NEW_COMMAND: CommandDefinition = {
  name: "NEW",
  aliases: ["N"],
  group: "FILE",
  description: "Create new drawing",
  options: [
    { name: "template", type: "filename", description: "Template file to use" },
  ],
  execute: async (ctx, args) => {
    return { success: true, message: "NEW command executed" };
  },
};

// All default commands array
export const DEFAULT_COMMANDS: CommandDefinition[] = [
  // DRAW
  LINE_COMMAND,
  CIRCLE_COMMAND,
  ARC_COMMAND,
  POLYLINE_COMMAND,
  ELLIPSE_COMMAND,
  SPLINE_COMMAND,
  RECTANGLE_COMMAND,
  HATCH_COMMAND,
  DIMENSION_COMMAND,
  TEXT_COMMAND,
  MTEXT_COMMAND,
  INSERT_COMMAND,
  // EDIT
  ERASE_COMMAND,
  MOVE_COMMAND,
  COPY_COMMAND,
  ROTATE_COMMAND,
  SCALE_COMMAND,
  MIRROR_COMMAND,
  OFFSET_COMMAND,
  TRIM_COMMAND,
  EXTEND_COMMAND,
  FILLET_COMMAND,
  CHAMFER_COMMAND,
  BREAK_COMMAND,
  JOIN_COMMAND,
  STRETCH_COMMAND,
  ARRAY_COMMAND,
  // LAYER
  LAYER_COMMAND,
  COLOR_COMMAND,
  LINETYPE_COMMAND,
  LINEWEIGHT_COMMAND,
  // VIEW
  ZOOM_COMMAND,
  PAN_COMMAND,
  REGEN_COMMAND,
  REDRAW_COMMAND,
  // UTILITY
  UNDO_COMMAND,
  REDO_COMMAND,
  SELECT_COMMAND,
  LIST_COMMAND,
  DIST_COMMAND,
  AREA_COMMAND,
  ID_COMMAND,
  PROPERTIES_COMMAND,
  HELP_COMMAND,
  // BLOCK
  BLOCK_COMMAND,
  // FILE
  SAVE_COMMAND,
  OPEN_COMMAND,
  NEW_COMMAND,
];

/**
 * Register all default commands to registry
 */
export function registerDefaultCommands(registry: {
  register(def: CommandDefinition): void;
}): void {
  for (const cmd of DEFAULT_COMMANDS) {
    registry.register(cmd);
  }
}