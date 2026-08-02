// Los stores cargan/mutan vía rxMethod contra IndexedDB (asíncrono de
// verdad, a diferencia del `of(...)` en memoria de antes) — sus métodos no
// devuelven nada para hacer `await`. Este helper solo es para tests: sondea
// hasta que la condición se cumpla o se agoten los intentos.
export async function waitFor(
  predicate: () => boolean,
  { intentos = 50, esperaMs = 5 }: { intentos?: number; esperaMs?: number } = {},
): Promise<void> {
  for (let i = 0; i < intentos && !predicate(); i++) {
    await new Promise((resolve) => setTimeout(resolve, esperaMs));
  }
}
