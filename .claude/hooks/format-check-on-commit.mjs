/**
 * Hook PreToolUse: no deja commitear nada que Prettier no reconozca formateado.
 *
 * Por qué existe: `format-on-write.mjs` solo se dispara con `Write` y `Edit`, y
 * un archivo tocado desde el shell —un `sed` masivo, un script— nunca pasa por
 * ahí. Eso dejó el CI en rojo en el PR #68, y el problema quedaba latente: un
 * `sed` que no cambie la longitud de las líneas no da ninguna señal
 * (issue #69).
 *
 * Ataca el único momento en que el formato importa de verdad —el commit— en
 * vez de correr Prettier detrás de cada comando de Bash.
 *
 * ## Dos decisiones que hacen que esto sea seguro
 *
 * 1. **No modifica nada.** Formatear desde un `PreToolUse` sería peor que el
 *    mal: lo que se commitea es el ÍNDICE, así que arreglar el archivo del
 *    working tree dejaría el commit igual de mal formateado y el arreglo
 *    suelto fuera. Y volver a añadirlo al índice metería en el commit cambios
 *    que quizá se estagearon a propósito por partes. Así que avisa y se aparta.
 *
 * 2. **Compara lo que git va a guardar, no lo que hay en disco.** Para lo
 *    staged, `git show :<ruta>` devuelve el contenido con los finales de línea
 *    ya normalizados a LF; para lo que entra por `-a`, se normaliza a mano.
 *    Eso esquiva de raíz el falso positivo de CRLF que hace inservible un
 *    `prettier --check` local en Windows, que es justo el motivo por el que
 *    CLAUDE.md dice que la fuente de verdad es el log del CI.
 *
 * Contrato del hook: ante cualquier problema propio DEJA PASAR. Un hook roto no
 * puede bloquear el trabajo; el `nx format:check` del CI sigue siendo la red.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/* `git -C ruta commit`, `git commit -m …`, `git commit --amend`. Se pide que
   `git` abra el comando o venga detrás de un separador, para no confundirse
   con un `echo "git commit"` dentro de un texto. */
const ES_COMMIT = /(^|[\n;&|]|&&|\|\|)\s*git\b[^\n;&|]*\bcommit\b/;

/* `-a`, `-am`, `--all`. Con eso git añade al commit los tracked modificados. */
const LLEVA_TODO = /\s-(?:-all\b|[a-zA-Z]*a)/;

const git = (args) =>
  execFileSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    // El stderr de git se descarta: sus avisos de finales de línea no son
    // asunto de este hook y solo ensucian la salida.
    stdio: ['ignore', 'pipe', 'ignore'],
  });

const lineas = (salida) => salida.split('\n').filter(Boolean);

async function main() {
  const payload = JSON.parse(readFileSync(0, 'utf8'));
  const comando = payload?.tool_input?.command;
  if (!comando || !ES_COMMIT.test(comando)) return;

  const prettier = (await import('prettier')).default;

  /* ruta -> de dónde hay que leer su contenido para saber qué se commitea. */
  const rutas = new Map();

  for (const ruta of lineas(
    git(['diff', '--cached', '--name-only', '--diff-filter=ACMR']),
  )) {
    rutas.set(ruta, 'indice');
  }

  /* Con `-a` entran además los tracked modificados, y de esos lo que se
     commitea es el DISCO y no el índice. Leerlos del índice era el fallo de la
     primera versión de este hook: devolvía la copia anterior —bien
     formateada— y daba por bueno justo el caso que venía a cazar, que es el
     archivo que un `sed` dejó sucio y nadie añadió a mano. */
  if (LLEVA_TODO.test(comando)) {
    for (const ruta of lineas(
      git(['diff', '--name-only', '--diff-filter=ACMR']),
    )) {
      rutas.set(ruta, 'disco');
    }
  }

  if (rutas.size === 0) return;

  const sinFormatear = [];
  for (const [ruta, origen] of rutas) {
    const info = await prettier.getFileInfo(ruta, {
      ignorePath: '.prettierignore',
    });
    // Sin parser conocido (imágenes, binarios) o explícitamente ignorado.
    if (!info.inferredParser || info.ignored) continue;

    let contenido;
    try {
      contenido =
        origen === 'indice'
          ? git(['show', `:${ruta}`])
          : readFileSync(ruta, 'utf8').replaceAll('\r\n', '\n');
    } catch {
      // Staged como borrado, o un renombrado cuyo origen ya no está.
      continue;
    }

    const opciones = await prettier.resolveConfig(ruta, { editorconfig: true });
    const formateado = await prettier.format(contenido, {
      ...opciones,
      filepath: ruta,
    });
    if (formateado !== contenido) sinFormatear.push(ruta);
  }

  if (sinFormatear.length === 0) return;

  const entrecomilladas = sinFormatear.map((r) => `"${r}"`).join(' ');
  const razon = [
    `Prettier no da por formateados ${sinFormatear.length} archivo(s) de este commit:`,
    ...sinFormatear.map((r) => `  - ${r}`),
    '',
    'El CI corre `nx format:check` y esto lo dejaría en rojo. Formatealos y',
    'volvelos a añadir al índice antes de commitear:',
    '',
    `  yarn prettier --write ${entrecomilladas}`,
    `  git add ${entrecomilladas}`,
    '',
    'Comprobado sobre el contenido que git va a guardar, no sobre el del disco:',
    'esto no es el falso positivo de CRLF de `prettier --check` en Windows.',
  ].join('\n');

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: razon,
      },
    }),
  );
}

main().catch(() => {
  // Silencio deliberado: ver el contrato del hook arriba.
});
