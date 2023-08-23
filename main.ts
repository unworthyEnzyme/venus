import { VM } from "./vm.ts";

if (import.meta.main) {
  try {
    const source = Deno.readTextFileSync(Deno.args[0]);
    new VM().run(source);
  } catch (error) {
    console.error(error.message);
  }
}
