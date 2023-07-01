import type { Instruction } from "./instruction.ts";

export type Value =
	| { type: "Nil" }
	| { type: "Number"; value: number }
	| { type: "Boolean"; value: boolean }
	| {
			type: "Function";
			body: Instruction[];
			parameters: string[];
	  };
