/**
 * Lo que tiene que existir ANTES de que se cargue el primer archivo de prueba.
 *
 * `fake-indexeddb/auto` se limitaba a estar importado arriba de
 * `esquema.spec.ts`, y eso resultó frágil: el módulo se evalúa UNA sola vez y
 * asigna `globalThis.indexedDB` en el entorno que toque primero. En cuanto
 * entraron archivos de prueba nuevos y cambió el orden de carga, las catorce
 * pruebas del esquema pasaron a fallar en bloque con `IndexedDB API missing`
 * — sin que nadie hubiera tocado ni el esquema ni sus pruebas.
 *
 * Acá corre para todos, siempre, y deja de depender de quién se cargue antes.
 */
import 'fake-indexeddb/auto';
