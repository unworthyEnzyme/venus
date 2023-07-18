import type { Instruction } from "./instruction.ts";
import type { Value } from "./value.ts";
import type { VM } from "./vm.ts";

export class Fiber {
  stack: StackFrame[] = [];
  valueStack: Value[] = [];
  constructor(instructions: Instruction[]) {
    this.stack.push({ ip: 0, instructions, locals: [new Map()] });
  }
}

type StackFrame = {
  ip: number;
  instructions: Instruction[];
  locals: Map<string, Value>[];
};

export class Channel {
  private senders: Fiber[] = [];
  private receivers: Fiber[] = [];
  private slot: Value | null = null;
  send(vm: VM, sender: Fiber, value: Value): boolean {
    const receiver = this.receivers.shift();
    if (!receiver) {
      this.senders.push(sender);
      return true;
    }
    this.slot = value;
    vm.pushFiberToFront(receiver);
    receiver.valueStack.push(value);
    return false;
  }
  receive(receiver: Fiber): Value | null {
    if (!this.slot) {
      this.receivers.push(receiver);
      return null;
    }
    return this.slot;
  }
}
