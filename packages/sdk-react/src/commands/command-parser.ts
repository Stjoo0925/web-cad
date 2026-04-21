/**
 * command-parser.ts
 * Command Parser - Parses command input strings and options
 *
 * Handles:
 * - Tokenizing command input
 * - Parsing options/switches (e.g., /width, -color, _layer)
 * - Parsing point coordinates (e.g., 10,20 or 10,20,30)
 * - Type conversion for different option types
 */

import type { CommandOption, ParsedArgs } from "./command-registry.js";

export interface ParseResult {
  commandName: string;
  args: string[];
  options: ParsedArgs;
  rawInput: string;
}

export interface TokenizerOptions {
  preserveQuotes?: boolean;
  trimWhitespace?: boolean;
}

/**
 * Tokenize command input string
 */
export function tokenize(input: string, options?: TokenizerOptions): string[] {
  const trimmed = options?.trimWhitespace !== false ? input.trim() : input;

  const tokens: string[] = [];
  let current = "";
  let inQuote = false;
  let quoteChar = "";

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];

    if ((char === '"' || char === "'") && !inQuote) {
      inQuote = true;
      quoteChar = char;
      if (options?.preserveQuotes) {
        current += char;
      }
    } else if (char === quoteChar && inQuote) {
      inQuote = false;
      quoteChar = "";
      if (options?.preserveQuotes) {
        current += char;
      }
    } else if (char === " " && !inQuote) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Parse command input string
 */
export function parseCommandInput(input: string): ParseResult {
  const tokens = tokenize(input);

  if (tokens.length === 0) {
    return { commandName: "", args: [], options: {}, rawInput: input };
  }

  const commandName = tokens[0];
  const args = tokens.slice(1);

  return {
    commandName,
    args,
    options: {},
    rawInput: input,
  };
}

/**
 * Parse options from argument tokens
 */
export function parseOptions(
  args: string[],
  commandOptions: CommandOption[],
): ParsedArgs {
  const result: ParsedArgs = {};
  let i = 0;

  while (i < args.length) {
    const arg = args[i];

    if (isOptionToken(arg)) {
      const { name: optionName, value } = parseOptionToken(arg, commandOptions);

      if (optionName) {
        const option = findOption(optionName, commandOptions);

        if (option) {
          if (option.type === "boolean") {
            result[option.name] = true;
          } else if (value !== undefined) {
            result[option.name] = parseValue(value, option.type);
            i++; // Skip the value token
          } else if (i + 1 < args.length) {
            result[option.name] = parseValue(args[i + 1], option.type);
            i++; // Skip the value token
          }
        }
      }
    } else {
      // Positional argument
      const positionalIndex = getNextPositionalIndex(result, commandOptions);
      const option = commandOptions[positionalIndex];

      if (option) {
        result[option.name] = parseValue(arg, option.type);
      }
    }

    i++;
  }

  // Fill in defaults
  for (const option of commandOptions) {
    if (result[option.name] === undefined && option.defaultValue !== undefined) {
      result[option.name] = option.defaultValue;
    }
  }

  return result;
}

/**
 * Check if token is an option/switch
 */
export function isOptionToken(token: string): boolean {
  return (
    token.startsWith("-") || token.startsWith("/") || token.startsWith("_")
  );
}

/**
 * Parse option token into name and value
 */
function parseOptionToken(
  token: string,
  _commandOptions: CommandOption[],
): { name: string; value?: string } {
  // Remove prefix characters
  const cleaned = token.replace(/^[-/_]+/, "");

  // Check for = syntax (e.g., /width=2 or -color=red)
  const equalIndex = cleaned.indexOf("=");
  if (equalIndex !== -1) {
    return {
      name: cleaned.substring(0, equalIndex).toLowerCase(),
      value: cleaned.substring(equalIndex + 1),
    };
  }

  // Check for : syntax (e.g., /width:2 or -color:red)
  const colonIndex = cleaned.indexOf(":");
  if (colonIndex !== -1) {
    return {
      name: cleaned.substring(0, colonIndex).toLowerCase(),
      value: cleaned.substring(colonIndex + 1),
    };
  }

  // No value, just a boolean flag
  return { name: cleaned.toLowerCase(), value: undefined };
}

/**
 * Find option by name or short name
 */
function findOption(
  name: string,
  options: CommandOption[],
): CommandOption | undefined {
  const lower = name.toLowerCase();
  return options.find(
    (o) => o.name.toLowerCase() === lower || o.shortName?.toLowerCase() === lower,
  );
}

/**
 * Get next positional argument index
 */
function getNextPositionalIndex(
  parsed: ParsedArgs,
  commandOptions: CommandOption[],
): number {
  let index = 0;
  for (const option of commandOptions) {
    if (parsed[option.name] !== undefined) {
      index++;
    }
  }
  return index;
}

/**
 * Parse value string to appropriate type
 */
export function parseValue(value: string, type: CommandOption["type"]): unknown {
  switch (type) {
    case "number":
      return parseFloat(value);

    case "boolean":
      return (
        value === "1" ||
        value.toLowerCase() === "on" ||
        value.toLowerCase() === "yes" ||
        value.toLowerCase() === "true"
      );

    case "point": {
      const coords = value.split(",").map(parseFloat);
      if (coords.length >= 2) {
        return {
          x: coords[0],
          y: coords[1],
          z: coords[2] ?? 0,
        };
      }
      return null;
    }

    case "entity":
    case "selection":
    case "string":
    case "linetype":
    case "layer":
    case "filename":
    default:
      return value;
  }
}

/**
 * Parse point string to Point object
 */
export function parsePointString(pointStr: string): { x: number; y: number; z?: number } | null {
  const trimmed = pointStr.trim();

  // Handle @dx,dy format (relative)
  const isRelative = trimmed.startsWith("@");

  // Handle x,y or x,y,z format
  const coords = trimmed.replace(/^@/, "").split(",").map(parseFloat);

  if (coords.length >= 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
    return {
      x: coords[0],
      y: coords[1],
      z: coords[2] !== undefined && !isNaN(coords[2]) ? coords[2] : 0,
    };
  }

  return null;
}

/**
 * Format value for display
 */
export function formatValue(value: unknown, type: CommandOption["type"]): string {
  if (value === null || value === undefined) {
    return "";
  }

  switch (type) {
    case "point":
      if (typeof value === "object" && "x" in value && "y" in value) {
        const p = value as { x: number; y: number; z?: number };
        if (p.z !== undefined && p.z !== 0) {
          return `${p.x},${p.y},${p.z}`;
        }
        return `${p.x},${p.y}`;
      }
      break;

    case "number":
      if (typeof value === "number") {
        return value.toFixed(2);
      }
      break;

    case "boolean":
      return value ? "ON" : "OFF";
  }

  return String(value);
}

/**
 * Validate parsed arguments against command options
 */
export function validateArgs(
  parsed: ParsedArgs,
  commandOptions: CommandOption[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const option of commandOptions) {
    if (option.required && parsed[option.name] === undefined) {
      errors.push(`Required option '${option.name}' is missing`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}