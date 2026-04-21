/**
 * commands/index.ts
 * 편집 명령 모듈
 */

export { createMoveCommand, applyMoveOffset } from "./move-command.js";
export type {
  MoveCommand,
  MoveCommandState,
  MoveCommandResult,
  MoveCommandOptions,
} from "./move-command.js";

export { createRotateCommand, applyRotateTransform } from "./rotate-command.js";
export type {
  RotateCommand,
  RotateCommandState,
  RotateCommandResult,
  RotateCommandOptions,
} from "./rotate-command.js";

export { createScaleCommand, applyScaleTransform } from "./scale-command.js";
export type {
  ScaleCommand,
  ScaleCommandState,
  ScaleCommandResult,
  ScaleCommandOptions,
} from "./scale-command.js";

export { createCopyCommand, applyCopyOffset } from "./copy-command.js";
export type {
  CopyCommand,
  CopyCommandState,
  CopyCommandResult,
  CopyCommandOptions,
} from "./copy-command.js";

export { createTrimCommand } from "./trim-command.js";
export type {
  TrimCommand,
  TrimCommandState,
  TrimCommandResult,
  TrimCommandOptions,
} from "./trim-command.js";

export { createExtendCommand } from "./extend-command.js";
export type {
  ExtendCommand,
  ExtendCommandState,
  ExtendCommandResult,
  ExtendCommandOptions,
} from "./extend-command.js";

export { createOffsetCommand, applyOffsetTransform } from "./offset-command.js";
export type {
  OffsetCommand,
  OffsetCommandState,
  OffsetCommandResult,
  OffsetCommandOptions,
} from "./offset-command.js";

// Command system exports
export {
  CommandRegistry,
  getCommandRegistry,
} from "./command-registry.js";
export type {
  CommandOption,
  CommandDefinition,
  CommandContext,
  CommandResult,
  ParsedArgs,
} from "./command-registry.js";

export {
  tokenize,
  parseCommandInput,
  parseOptions,
  isOptionToken,
  parseValue,
  parsePointString,
  formatValue,
  validateArgs,
} from "./command-parser.js";
export type { ParseResult, TokenizerOptions } from "./command-parser.js";

export {
  DEFAULT_COMMANDS,
  registerDefaultCommands,
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
  ERASE_COMMAND,
  LAYER_COMMAND,
  COLOR_COMMAND,
  LINETYPE_COMMAND,
  LINEWEIGHT_COMMAND,
  ZOOM_COMMAND,
  PAN_COMMAND,
  REGEN_COMMAND,
  REDRAW_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  SELECT_COMMAND,
  LIST_COMMAND,
  DIST_COMMAND,
  AREA_COMMAND,
  ID_COMMAND,
  PROPERTIES_COMMAND,
  HELP_COMMAND,
  BLOCK_COMMAND,
  SAVE_COMMAND,
  OPEN_COMMAND,
  NEW_COMMAND,
} from "./default-commands.js";
