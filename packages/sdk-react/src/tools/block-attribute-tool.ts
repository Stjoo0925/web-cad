/**
 * block-attribute-tool.ts
 * Block Attribute definition and editing tool
 *
 * Defines attributes for blocks and allows editing attribute values on instances.
 */

import type { Point } from "./line-tool.js";

export interface BlockAttribute {
  id: string;
  tag: string;
  label: string;
  value: string;
  position: Point;
  height: number;
  rotation: number;
  color: string;
  layer: string;
}

export interface BlockAttributeDefinition {
  id: string;
  tag: string;
  label: string;
  defaultValue: string;
  position: Point;
  height: number;
  rotation: number;
  color: string;
  visible: boolean;
}

export interface BlockDefinitionWithAttributes {
  name: string;
  attributes: BlockAttributeDefinition[];
}

export interface BlockAttributeToolState {
  isDefining: boolean;
  isEditing: boolean;
  targetBlockName: string | null;
  targetInstanceId: string | null;
  attributes: BlockAttribute[];
  selectedAttribute: BlockAttribute | null;
}

export interface BlockAttributeToolOptions {
  onComplete?: (result: {
    blockName: string;
    attributes: BlockAttribute[];
  }) => void;
  onPreview?: (attributes: BlockAttribute[]) => void;
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `attr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Creates a BLOCK ATTRIBUTE tool instance.
 */
export function createBlockAttributeTool(
  options: BlockAttributeToolOptions = {},
) {
  const { onComplete, onPreview } = options;

  const state: BlockAttributeToolState = {
    isDefining: false,
    isEditing: false,
    targetBlockName: null,
    targetInstanceId: null,
    attributes: [],
    selectedAttribute: null,
  };

  /**
   * Start defining attributes for a block
   */
  function startDefinition(blockName: string) {
    state.isDefining = true;
    state.isEditing = false;
    state.targetBlockName = blockName;
    state.attributes = [];
    state.selectedAttribute = null;
  }

  /**
   * Start editing attributes on a block instance
   */
  function startEditing(
    blockName: string,
    instanceId: string,
    existingAttributes: BlockAttribute[],
  ) {
    state.isDefining = false;
    state.isEditing = true;
    state.targetBlockName = blockName;
    state.targetInstanceId = instanceId;
    state.attributes = existingAttributes;
    state.selectedAttribute = null;
  }

  /**
   * Add attribute definition
   */
  function addAttribute(def: {
    tag: string;
    label: string;
    defaultValue?: string;
    position?: Point;
    height?: number;
    rotation?: number;
    color?: string;
    visible?: boolean;
  }): BlockAttribute {
    const attribute: BlockAttribute = {
      id: generateId(),
      tag: def.tag,
      label: def.label,
      value: def.defaultValue ?? "",
      position: def.position ?? { x: 0, y: 0 },
      height: def.height ?? 10,
      rotation: def.rotation ?? 0,
      color: def.color ?? "#000000",
      layer: "0",
    };

    state.attributes.push(attribute);

    if (onPreview) {
      onPreview(state.attributes);
    }

    return attribute;
  }

  /**
   * Update attribute value
   */
  function updateAttributeValue(attributeId: string, value: string) {
    const attr = state.attributes.find((a) => a.id === attributeId);
    if (attr) {
      attr.value = value;

      if (onPreview) {
        onPreview(state.attributes);
      }
    }
  }

  /**
   * Remove attribute
   */
  function removeAttribute(attributeId: string) {
    state.attributes = state.attributes.filter((a) => a.id !== attributeId);

    if (onPreview) {
      onPreview(state.attributes);
    }
  }

  /**
   * Select attribute for editing
   */
  function selectAttribute(attributeId: string) {
    state.selectedAttribute =
      state.attributes.find((a) => a.id === attributeId) ?? null;
  }

  /**
   * Complete attribute definition/editing
   */
  function complete(): {
    blockName: string;
    attributes: BlockAttribute[];
  } | null {
    if (!state.targetBlockName) return null;

    const result = {
      blockName: state.targetBlockName,
      attributes: [...state.attributes],
    };

    if (onComplete) {
      onComplete(result);
    }

    cancel();

    return result;
  }

  /**
   * Cancel operation
   */
  function cancel() {
    state.isDefining = false;
    state.isEditing = false;
    state.targetBlockName = null;
    state.targetInstanceId = null;
    state.attributes = [];
    state.selectedAttribute = null;
  }

  function getState(): BlockAttributeToolState {
    return { ...state };
  }

  return {
    startDefinition,
    startEditing,
    addAttribute,
    updateAttributeValue,
    removeAttribute,
    selectAttribute,
    complete,
    cancel,
    getState,
  };
}

/**
 * Render attribute text
 */
export function renderBlockAttribute(
  ctx: CanvasRenderingContext2D,
  attribute: BlockAttribute,
  viewport: { pan: Point; zoom: number; width: number; height: number },
): void {
  const screenPos = worldToScreen(attribute.position, viewport);

  ctx.save();
  ctx.fillStyle = attribute.color;
  ctx.font = `${attribute.height * viewport.zoom}px Arial`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const text = `${attribute.label}: ${attribute.value}`;
  ctx.fillText(text, screenPos.x, screenPos.y);

  ctx.restore();
}

function worldToScreen(
  p: Point,
  viewport: { pan: Point; zoom: number; width: number; height: number },
): Point {
  return {
    x: (p.x - viewport.pan.x) * viewport.zoom + viewport.width / 2,
    y: (p.y - viewport.pan.y) * viewport.zoom + viewport.height / 2,
  };
}
