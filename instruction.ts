import type { Value } from "./value.ts";

export type Instruction =
  | { type: "LessThanEqual" }
  | { type: "GreaterThanEqual" }
  | { type: "AccessProperty"; name: string }
  | { type: "DefineProperty"; name: string }
  | { type: "ChannelReceive" }
  | { type: "ChannelSend" }
  | { type: "Exit" }
  | { type: "Jump"; offset: number }
  | { type: "Spawn"; arity: number }
  | { type: "Yield" }
  | { type: "Print" }
  | { type: "JumpIfFalse"; offset: number }
  | { type: "GetLocal"; name: string }
  | { type: "SetLocal"; name: string }
  | { type: "DeclareLocal"; name: string }
  | { type: "GetGlobal"; name: string }
  | { type: "SetGlobal"; name: string }
  | { type: "DeclareGlobal"; name: string }
  | { type: "BlockEnd" }
  | { type: "BlockStart" }
  | { type: "Return" }
  | { type: "Call"; arity: number }
  | { type: "GreaterThan" }
  | { type: "LessThan" }
  | { type: "Plus" }
  | { type: "Pop" }
  | { type: "Push"; value: Value };
