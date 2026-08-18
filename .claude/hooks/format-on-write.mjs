/**
 * Hook PostToolUse: formatea con Prettier cada archivo que un agente escribe.
 *
 * Por qué existe: el CI corre `nx format:check` sobre todo lo que cambió
 * respecto a `main`, y `.prettierignore` NO excluye Markdown. Los agentes que
 * generan documentos (investigación, ADRs, CONTEXT.md) commiteaban sin pasar
 * Prettier y dejaban el CI en rojo — pasó cuatro veces seguidas (issue #29).
 * Recordárselo por escrito no funcionó; esto lo hace automático.
 *
 * Contrato del hook: recibe el JSON de la invocación por stdin y NUNCA falla.
 * Un problema al formatear no debe bloquear la escritura del agente, así que
 * todo error se traga y el proceso sale con 0.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

async function main() {
  const payload = JSON.parse(readFileSync(0, 'utf8'));
  const filePath = payload?.tool_input?.file_path;
  if (!filePath) return;

  // Prettier se resuelve desde el node_modules del workspace. Si el hook corre
  // fuera del repo (o antes de instalar dependencias), no hay nada que hacer.
  const prettier = (await import('prettier')).default;

  const configFile = await prettier.resolveConfigFile(filePath);
  if (!configFile) return;

  const info = await prettier.getFileInfo(filePath, {
    ignorePath: join(dirname(configFile), '.prettierignore'),
  });
  // Sin parser conocido (imágenes, binarios) o explícitamente ignorado.
  if (!info.inferredParser || info.ignored) return;

  const original = readFileSync(filePath, 'utf8');
  const options = await prettier.resolveConfig(filePath, {
    editorconfig: true,
  });
  const formatted = await prettier.format(original, {
    ...options,
    filepath: filePath,
  });

  if (formatted !== original) {
    writeFileSync(filePath, formatted, 'utf8');
  }
}

main().catch(() => {
  // Silencio deliberado: ver el contrato del hook arriba.
});
