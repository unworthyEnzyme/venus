import { VM } from "./vm.ts";

if (import.meta.main) {
  const source = Deno.readTextFileSync(Deno.args[0]);
  new VM().run(source);
}
