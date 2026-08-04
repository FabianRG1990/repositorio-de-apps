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
}

const DB_NAME = 'bahia-db';
// v2 agrega `facturas` (ver issue #11) — el `upgrade` de abajo distingue
// instalación fresca de actualización desde v1 por `oldVersion`, para no
// recrear (y volver a sembrar) los object stores que ya existen en una
// base real que un navegador ya haya persistido.
const DB_VERSION = 2;

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
    },
  });
  return dbPromise;
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
