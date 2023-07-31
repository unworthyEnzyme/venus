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
  send(vm: VM, value: Value) {
    const receiver = this.receivers.shift();
    if (receiver) {
      receiver.value_stack.push(value);
      vm.enqueue_fiber_to_front(receiver);
      vm.yield_current_fiber();
      return;
    }

    if (this.buffer.length < this.capacity) {
      this.buffer.push(value);
      return;
    }

    this.sends.push(value);

    vm.yield_current_fiber();
  }
  receive(vm: VM) {
    if (this.buffer.length > 0) {
      return this.buffer.shift()!;
    }
    const send = this.sends.shift();
    if (send) {
      vm.current_fiber!.value_stack.push(send);
    }
    this.receivers.push(vm.current_fiber!);
    vm.yield_current_fiber();
  }
}
