import { deleteDB, DBSchema, IDBPDatabase, openDB } from 'idb';
import { Cliente } from '../models/cliente.model';
import { Factura } from '../models/factura.model';
import { OrdenTrabajo } from '../models/orden-trabajo.model';
import { Taller } from '../models/taller.model';
import { Usuario } from '../models/usuario.model';
import { Vehiculo } from '../models/vehiculo.model';
import {
  SEED_CLIENTES,
  SEED_FACTURAS,
  SEED_ORDENES,
  SEED_TALLER,
  SEED_USUARIOS,
  SEED_VEHICULOS,
} from '../seed/seed-data';

interface BahiaDbSchema extends DBSchema {
  talleres: { key: string; value: Taller };
  usuarios: { key: string; value: Usuario };
  clientes: { key: string; value: Cliente };
  vehiculos: { key: string; value: Vehiculo };
  ordenes: { key: string; value: OrdenTrabajo };
  facturas: { key: string; value: Factura };
  puesto: { key: string; value: { id: string; codigo: string } };
}

const DB_NAME = 'bahia-db';
// v2 agrega `facturas` (ver issue #11) y v3 el `puesto` (ver issue #46) — el
// `upgrade` de abajo distingue instalación fresca de actualización por
// `oldVersion`, para no recrear (y volver a sembrar) los object stores que ya
// existen en una base real que un navegador ya haya persistido.
const DB_VERSION = 3;

// Clave del único registro de `puesto`: cada base pertenece a un navegador, y
// cada navegador es un puesto.
const PUESTO_ACTUAL = 'actual';

// Dos caracteres base36 en mayúscula — 1296 combinaciones. Corto para dictarlo
// por teléfono junto al folio, que es como se usa en la práctica.
function generarCodigoPuesto(): string {
  const parte = () =>
    Math.floor(Math.random() * 36)
      .toString(36)
      .toUpperCase();
  return `${parte()}${parte()}`;
}

let dbPromise: Promise<IDBPDatabase<BahiaDbSchema>> | undefined;

// Base de datos única para las entidades (ver ticket "Persistencia local
// para no perder datos de la demo"). Cada DataService la usa directamente
// como su almacén — esta es la costura hacia un backend real: cuando exista,
// solo cambian los DataServices (a HttpClient), no los stores ni la UI.
//
// Cada object store se siembra una sola vez, dentro de `upgrade`, la
// primera vez que se crea — las siguientes aperturas reciben los datos
// tal como quedaron persistidos.
export function getBahiaDb(): Promise<IDBPDatabase<BahiaDbSchema>> {
  dbPromise ??= openDB<BahiaDbSchema>(DB_NAME, DB_VERSION, {
    async upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const talleres = db.createObjectStore('talleres', { keyPath: 'id' });
        await talleres.put(SEED_TALLER);

        const usuarios = db.createObjectStore('usuarios', { keyPath: 'id' });
        await Promise.all(
          SEED_USUARIOS.map((usuario) => usuarios.put(usuario)),
        );

        const clientes = db.createObjectStore('clientes', { keyPath: 'id' });
        await Promise.all(
          SEED_CLIENTES.map((cliente) => clientes.put(cliente)),
        );

        const vehiculos = db.createObjectStore('vehiculos', {
          keyPath: 'id',
        });
        await Promise.all(
          SEED_VEHICULOS.map((vehiculo) => vehiculos.put(vehiculo)),
        );

        const ordenes = db.createObjectStore('ordenes', { keyPath: 'id' });
        await Promise.all(SEED_ORDENES.map((orden) => ordenes.put(orden)));
      }

      if (oldVersion < 2) {
        const facturas = db.createObjectStore('facturas', { keyPath: 'id' });
        await Promise.all(
          SEED_FACTURAS.map((factura) => facturas.put(factura)),
        );
      }

      // El código de puesto se acuña una sola vez, al crear la base, y no
      // vuelve a cambiar: si cambiara, los folios ya emitidos por este puesto
      // dejarían de pertenecer a su serie.
      if (oldVersion < 3) {
        const puesto = db.createObjectStore('puesto', { keyPath: 'id' });
        await puesto.put({
          id: PUESTO_ACTUAL,
          codigo: generarCodigoPuesto(),
        });
      }
    },
  });
  return dbPromise;
}

// El código del puesto en el que corre esta instalación. Cada navegador tiene
// su propia base, así que cada uno acuña el suyo y nadie tiene que
// coordinarse — que es justo lo que no se puede hacer sin conexión.
export async function getCodigoPuesto(): Promise<string> {
  const db = await getBahiaDb();
  const registro = await db.get('puesto', PUESTO_ACTUAL);
  if (!registro) throw new Error('La base no tiene código de puesto');
  return registro.codigo;
}

// Solo para tests: cierra y borra la base para que cada test arranque de
// una base recién sembrada, en vez de arrastrar mutaciones de tests
// anteriores (el singleton de arriba, por diseño, sobrevive entre tests).
export async function resetBahiaDbForTests(): Promise<void> {
  if (dbPromise) {
    (await dbPromise).close();
    dbPromise = undefined;
  }
  await deleteDB(DB_NAME);
}
