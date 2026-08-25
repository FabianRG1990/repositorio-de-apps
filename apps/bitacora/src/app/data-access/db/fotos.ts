import { Repositorio } from './repositorio';
import { BitacoraDb, NO_BORRADO, type Foto } from './esquema';

/**
 * Cuánto se reduce una foto antes de guardarla.
 *
 * 1600 px de lado largo es de sobra para lo que estas fotos tienen que probar:
 * "este rayón ya venía". No es una foto de catálogo, es una constancia.
 *
 * Escalar ANTES de comprimir es la reducción más grande de las dos: una foto
 * de 4000 px llevada a 1600 pierde el 84 % de sus píxeles antes de que la
 * compresión haga nada.
 */
const LADO_LARGO = 1600;

/**
 * WebP a 0,72.
 *
 * WebP a 0,6 equivale más o menos a JPEG a 0,75 con un 25–35 % menos de peso;
 * 0,72 deja margen porque acá el detalle que importa —un rayón fino sobre
 * pintura oscura— es justo lo primero que la compresión se come.
 */
const TIPO = 'image/webp';
const CALIDAD = 0.72;

/** Lo que ocupa una Foto ya guardada, para poder decirlo en pantalla. */
export interface FotoGuardada {
  readonly id: string;
  readonly blob: Blob;
  readonly tomadaEn: string;
}

/**
 * Reduce y recomprime una imagen para guardarla.
 *
 * **La orientación se maneja a mano.** El canvas se queda solo con los píxeles
 * y descarta el EXIF: eso es bueno para la privacidad —se va también el GPS,
 * que en una foto de un carro ajeno no tiene por qué viajar— pero incluye la
 * etiqueta de rotación, y sin tratarla las fotos de teléfono salen acostadas.
 * `createImageBitmap` con `imageOrientation: 'from-image'` la aplica al
 * decodificar, así que lo que llega al canvas ya está derecho.
 */
export async function reducir(archivo: Blob): Promise<Blob> {
  const mapa = await createImageBitmap(archivo, {
    imageOrientation: 'from-image',
  });

  try {
    const escala = Math.min(1, LADO_LARGO / Math.max(mapa.width, mapa.height));
    /* Nunca se agranda: una foto pequeña escalada hacia arriba pesa más y no
       enseña nada nuevo. */
    const ancho = Math.round(mapa.width * escala);
    const alto = Math.round(mapa.height * escala);

    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;

    const ctx = lienzo.getContext('2d');
    if (!ctx) throw new Error('El navegador no dio contexto de canvas');
    /* Interpolación buena: con la de por defecto, reducir cuatro veces deja
       bordes dentados justo en las líneas finas, que es lo que hay que ver. */
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(mapa, 0, 0, ancho, alto);

    const reducida = await new Promise<Blob | null>((resolver) =>
      lienzo.toBlob(resolver, TIPO, CALIDAD),
    );
    if (!reducida) throw new Error('No se pudo comprimir la imagen');

    /* Si comprimir salió MÁS grande que el original, se guarda el original.
       Pasa con capturas de pantalla y con fotos ya muy comprimidas, y guardar
       una versión peor y más pesada no tiene defensa. */
    return reducida.size < archivo.size ? reducida : archivo;
  } finally {
    // El mapa de bits ocupa memoria hasta que se cierra explícitamente.
    mapa.close();
  }
}

/**
 * Las Fotos de una Orden.
 *
 * Pertenecen a la Orden y no a la Línea de servicio ([ADR 0006]): muestran
 * cómo entró el carro, no justifican un cobro concreto. Muchas veces, al
 * sacarlas, el trabajo que las justificaría todavía no existe.
 */
export class FotosDeLaOrden {
  constructor(
    private readonly db: BitacoraDb,
    private readonly repo: Repositorio,
    private readonly ahora: () => string = () => new Date().toISOString(),
  ) {}

  /** Reduce y guarda. Devuelve lo que quedó guardado. */
  async guardar(ordenId: string, archivo: Blob): Promise<Foto> {
    const blob = await reducir(archivo);
    return this.repo.crear(this.db.fotos, {
      ordenId,
      blob,
      tomadaEn: this.ahora(),
    });
  }

  /**
   * Guarda varias que ya vienen reducidas, dentro de la transacción de quien
   * llama.
   *
   * Existe aparte de `guardar` porque al recibir un Vehículo las Fotos tienen
   * que escribirse en la MISMA transacción que la Orden, y reducir es trabajo
   * de CPU que no puede correr dentro de una transacción de Dexie: la
   * transacción se cierra sola en cuanto el hilo cede el control.
   */
  async guardarReducidas(
    ordenId: string,
    blobs: readonly Blob[],
  ): Promise<void> {
    for (const blob of blobs) {
      await this.repo.crear(this.db.fotos, {
        ordenId,
        blob,
        tomadaEn: this.ahora(),
      });
    }
  }

  async deUnaOrden(ordenId: string): Promise<readonly FotoGuardada[]> {
    return (await this.db.fotos.where('ordenId').equals(ordenId).toArray())
      .filter((f) => f.borradoEn === NO_BORRADO)
      .sort((a, b) => a.tomadaEn.localeCompare(b.tomadaEn))
      .map((f) => ({ id: f.id, blob: f.blob, tomadaEn: f.tomadaEn }));
  }

  /** Borrado lógico, como todo acá: una ausencia no se puede sincronizar. */
  async quitar(fotoId: string): Promise<void> {
    await this.repo.borrar(this.db.fotos, fotoId);
  }
}

/** Lo que el navegador dice del espacio, ya en algo que se puede enseñar. */
export interface EspacioEnDisco {
  readonly usado: number;
  readonly disponible: number;
  /** De 0 a 1. `null` cuando el navegador no lo dice. */
  readonly proporcion: number | null;
  /** El navegador se comprometió a no borrar los datos por falta de espacio. */
  readonly persistente: boolean;
}

/**
 * Pide que los datos no se borren solos, y mira cuánto espacio queda.
 *
 * Esto NO estaba en el ADR 0006 y salió de investigar antes de construir:
 * **WebKit borra los datos de un origen que no haya tenido interacción en
 * siete días**. Para una app cuyos datos viven solo en el navegador eso no es
 * una molestia, es pérdida de historial — y el historial es el producto.
 *
 * `persist()` lo evita. El navegador puede decir que no, y entonces lo único
 * honesto es saberlo y poder avisarlo, en vez de suponer que los datos están
 * a salvo.
 */
export async function asegurarElEspacio(): Promise<EspacioEnDisco> {
  const almacenamiento = globalThis.navigator?.storage;
  if (!almacenamiento?.estimate) {
    return { usado: 0, disponible: 0, proporcion: null, persistente: false };
  }

  let persistente = false;
  try {
    persistente =
      (await almacenamiento.persisted?.()) ||
      (await almacenamiento.persist?.()) ||
      false;
  } catch {
    /* Firefox puede preguntarle al usuario y Safari puede negarse sin más. No
       poder pedirlo no es un error del que haya que informar: es el estado del
       que hay que enterarse. */
  }

  const { usage = 0, quota = 0 } = await almacenamiento.estimate();
  return {
    usado: usage,
    disponible: quota,
    proporcion: quota > 0 ? usage / quota : null,
    persistente,
  };
}

/** `2411724` → `2,4 MB`. El espacio se lee, no se calcula. */
export function pesoLegible(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} kB`;
  return `${(kb / 1024).toLocaleString('es-CR', {
    maximumFractionDigits: 1,
  })} MB`;
}
