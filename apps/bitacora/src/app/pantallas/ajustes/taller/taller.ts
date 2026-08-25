import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BitacoraDatos } from '../../../data-access/db/bitacora-db';
import type { Especialidad } from '../../../data-access/db/esquema';
import { ETIQUETA_ESPECIALIDAD_REPORTE } from '../../../data-access/etiquetas-reporte';
import { PerfilStore } from '../../../data-access/perfil.store';
import { TallerStore } from '../../../data-access/taller.store';
import { Boton } from '../../../shared/boton/boton';
import { colones } from '../../../shared/formato';

/**
 * Los datos del Taller, sus Puestos y sus Tarifas.
 *
 * El [ADR 0008] le dio al Perfil Dueño exactamente estas atribuciones y
 * llevaban sin construir desde entonces: hasta hoy el Dueño entraba a la app y
 * lo único que podía tocar era el color.
 *
 * Solo el Dueño edita, igual que en Apariencia ([ADR 0013]). No es un muro de
 * seguridad —el [ADR 0005] descarta los permisos— sino lo mismo que allá: al
 * resto no se le OFRECE, porque no es su trabajo.
 */
@Component({
  selector: 'app-ajustes-taller',
  templateUrl: './taller.html',
  styleUrl: './taller.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, Boton],
})
export class AjustesTaller {
  readonly #datos = inject(BitacoraDatos);
  readonly #perfiles = inject(PerfilStore);
  protected readonly taller = inject(TallerStore);

  protected readonly colones = colones;
  protected readonly nombreEspecialidad = ETIQUETA_ESPECIALIDAD_REPORTE;

  /* El mismo interruptor que Apariencia: al resto no se le OFRECE editar,
     que no es lo mismo que prohibírselo (ADR 0005 y 0013). */
  protected readonly puedeEditar = this.#perfiles.configuraElTaller;

  protected readonly campos = signal({
    nombre: '',
    telefono: '',
    direccion: '',
    cedulaJuridica: '',
  });
  protected readonly guardado = signal(false);
  protected readonly error = signal<string | null>(null);

  /** El puesto que se está editando, o `nuevo` mientras se crea uno. */
  protected readonly editandoPuesto = signal<string | null>(null);
  protected readonly puestoNombre = signal('');
  protected readonly puestoLetra = signal('');

  protected readonly tarifas = signal<Record<string, string>>({});

  /** El umbral del Vehículo sin recoger, mientras se teclea. */
  protected readonly dias = signal('');

  /* Lo que se va a ver en el tablero, dicho con palabras. Un "3" suelto en
     una casilla no dice qué va a pasar con él. */
  protected readonly ecoDelUmbral = computed(() => {
    const n = Number.parseInt(this.dias(), 10) || this.taller.diasParaSinRecoger();
    return n === 1
      ? 'Se marca al día siguiente de avisarle al cliente.'
      : `Se marca a los ${n} días de avisarle al cliente.`;
  });

  constructor() {
    /* Los campos se llenan desde la base la primera vez que llega, y NO en
       cada emisión: `liveQuery` re-emite en cada escritura, y volver a
       escribir el formulario mientras alguien teclea le borraría lo que está
       escribiendo. */
    effect(() => {
      const config = this.taller.configuracion();
      if (!config.datos.nombre) return;

      untracked(() => {
        if (this.campos().nombre) return;
        this.campos.set({ ...config.datos });
        this.tarifas.set(
          Object.fromEntries(
            config.tarifas.map((t) => [t.especialidad, String(t.porHora)]),
          ),
        );
        this.dias.set(String(config.diasParaSinRecoger));
      });
    });
  }

  protected escribir(campo: string, valor: string) {
    this.campos.update((c) => ({ ...c, [campo]: valor }));
    this.guardado.set(false);
  }

  protected async guardarDatos() {
    await this.#operar(async () => {
      await this.#datos.configuracion.guardarDatos(this.campos());
      this.guardado.set(true);
    });
  }

  /* --- Tarifas ------------------------------------------------------------ */

  protected escribirTarifa(especialidad: Especialidad, valor: string) {
    // Solo dígitos: una tarifa no lleva coma, ni punto, ni el símbolo.
    this.tarifas.update((t) => ({
      ...t,
      [especialidad]: valor.replace(/\D/g, ''),
    }));
  }

  protected async guardarTarifa(especialidad: Especialidad) {
    const valor = Number.parseInt(this.tarifas()[especialidad] ?? '', 10);
    if (!Number.isFinite(valor)) return;
    await this.#operar(() =>
      this.#datos.configuracion.fijarTarifa(especialidad, valor),
    );
  }

  /* --- Vehículos sin recoger ---------------------------------------------- */

  protected escribirDias(valor: string) {
    // Solo dígitos: son días enteros, no hay medio día de espera.
    this.dias.set(valor.replace(/\D/gu, ''));
  }

  protected async guardarDias() {
    const valor = Number.parseInt(this.dias(), 10);
    if (!Number.isFinite(valor) || valor < 1) {
      /* Una casilla vacía no puede guardar un umbral de cero días: eso
         marcaría el carro en el mismo instante en que se avisa. Se devuelve
         lo que había. */
      this.dias.set(String(this.taller.diasParaSinRecoger()));
      return;
    }
    await this.#operar(() =>
      this.#datos.configuracion.fijarDiasParaSinRecoger(valor),
    );
  }

  /* --- Puestos ------------------------------------------------------------ */

  protected abrirPuestoNuevo() {
    this.puestoNombre.set('');
    this.puestoLetra.set('');
    this.error.set(null);
    this.editandoPuesto.set('nuevo');
  }

  protected abrirPuesto(id: string, nombre: string, letra: string) {
    this.puestoNombre.set(nombre);
    this.puestoLetra.set(letra);
    this.error.set(null);
    this.editandoPuesto.set(id);
  }

  protected cancelarPuesto() {
    this.editandoPuesto.set(null);
    this.error.set(null);
  }

  protected async guardarPuesto() {
    const id = this.editandoPuesto();
    if (!id) return;

    await this.#operar(async () => {
      if (id === 'nuevo') {
        await this.#datos.configuracion.crearPuesto(
          this.puestoNombre(),
          this.puestoLetra(),
        );
      } else {
        await this.#datos.configuracion.renombrarPuesto(
          id,
          this.puestoNombre(),
          this.puestoLetra(),
        );
      }
      this.editandoPuesto.set(null);
    });
  }

  protected async quitarPuesto(id: string) {
    await this.#operar(() => this.#datos.configuracion.quitarPuesto(id));
  }

  /**
   * El envoltorio de toda escritura.
   *
   * El mensaje que se enseña es el de la excepción TAL CUAL, y no uno genérico:
   * las invariantes de acá —la letra repetida, el último puesto— ya vienen
   * escritas para que alguien las lea.
   */
  async #operar(accion: () => Promise<unknown>) {
    this.error.set(null);
    try {
      await this.#datos.lista;
      await accion();
    } catch (falla) {
      this.error.set(
        falla instanceof Error ? falla.message : 'No se pudo guardar.',
      );
    }
  }
}
