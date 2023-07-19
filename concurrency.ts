import type { Instruction } from "./instruction.ts";
import type { Value } from "./value.ts";
import type { VM } from "./vm.ts";

export class Fiber {
  stack: StackFrame[] = [];
  value_stack: Value[] = [];
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
  private receivers: Fiber[] = [];
  private sends: Value[] = [];
  private buffer: Value[] = [];
  constructor(private capacity: number) {}
  send(vm: VM, value: Value): boolean {
    const receiver = this.receivers.shift();
    if (receiver) {
      receiver.value_stack.push(value);
      vm.enqueue_fiber_to_front(receiver);
      return true;
    }

    if (this.buffer.length < this.capacity) {
      this.buffer.push(value);
      return false;
    }

    this.sends.push(value);

    return true;
  }
  receive(receiver: Fiber): Value | null {
    if (this.buffer.length > 0) {
      return this.buffer.shift()!;
    }
    const send = this.sends.shift();
    if (send) {
      return send;
    }
    this.receivers.push(receiver);
    return null;
  }
}
