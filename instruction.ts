import type { Value } from "./value.ts";

export type Instruction =
	| { type: "Exit" }
	| { type: "Jump"; offset: number }
	| { type: "Spawn"; arity: number }
	| { type: "Yield" }
	| { type: "Print" }
	| { type: "JumpIfFalse"; offset: number }
	| { type: "GetLocal"; name: string }
	| { type: "SetLocal"; name: string }
	| { type: "DeclareLocal"; name: string }
	| { type: "BlockEnd" }
	| { type: "BlockStart" }
	| { type: "Return" }
	| { type: "Call"; arity: number }
	| { type: "GreaterThan" }
	| { type: "LessThan" }
	| { type: "Add" }
	| { type: "Pop" }
	| { type: "Push"; value: Value };
