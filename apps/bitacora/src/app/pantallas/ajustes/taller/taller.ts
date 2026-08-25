import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { BitacoraDatos } from '../../../data-access/db/bitacora-db';
import type {
  Especialidad,
  Papel,
  Persona,
} from '../../../data-access/db/esquema';
import { ETIQUETA_ESPECIALIDAD_REPORTE } from '../../../data-access/etiquetas-reporte';
import {
  ETIQUETA_PERFIL,
  PerfilStore,
} from '../../../data-access/perfil.store';
import { TallerStore } from '../../../data-access/taller.store';
import { Boton } from '../../../shared/boton/boton';
import { colones } from '../../../shared/formato';

/**
 * Los datos del Taller, sus Puestos, su gente y sus Tarifas.
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
  imports: [FontAwesomeModule, NgTemplateOutlet, Boton],
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

  /* --- Personal ------------------------------------------------------------
     La Persona que se está editando, o `nuevo` mientras se crea una. Mismo
     patrón que los Puestos: una sola fila abierta a la vez, porque dos
     formularios abiertos dejan al botón de guardar sin dueño. */
  protected readonly editandoPersona = signal<string | null>(null);
  protected readonly personaNombre = signal('');
  protected readonly personaPapel = signal<Papel>('tecnico');
  protected readonly personaEspecialidades = signal<readonly Especialidad[]>(
    [],
  );

  /**
   * La baja que espera confirmación, con lo que hay que saber antes.
   *
   * Se pregunta en la propia pantalla y no con un `confirm` del navegador:
   * el diálogo nativo no puede decir CUÁNTAS Órdenes abiertas responde esa
   * persona, que es justamente el dato que hace falta para decidir.
   */
  protected readonly bajaPendiente = signal<{
    id: string;
    nombre: string;
    abiertas: number;
  } | null>(null);

  protected readonly papeles: readonly Papel[] = ['asesor', 'tecnico', 'dueno'];
  /* Las mismas palabras que la pantalla de entrada, y a propósito: el Papel de
     una Persona y el Perfil con el que se usa la app son cosas distintas, pero
     se llaman igual en español. Dos tablas de etiquetas acabarían diciendo
     "Dueño" en un sitio y "Propietario" en el otro. */
  protected readonly nombrePapel: Record<Papel, string> = ETIQUETA_PERFIL;

  /** El umbral del Vehículo sin recoger, mientras se teclea. */
  protected readonly dias = signal('');

  /* Lo que se va a ver en el tablero, dicho con palabras. Un "3" suelto en
     una casilla no dice qué va a pasar con él. */
  protected readonly ecoDelUmbral = computed(() => {
    const n =
      Number.parseInt(this.dias(), 10) || this.taller.diasParaSinRecoger();
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

  /* --- Personal ----------------------------------------------------------- */

  protected abrirPersonaNueva() {
    this.personaNombre.set('');
    this.personaPapel.set('tecnico');
    this.personaEspecialidades.set([]);
    this.error.set(null);
    this.bajaPendiente.set(null);
    this.editandoPersona.set('nuevo');
  }

  protected abrirPersona(persona: Persona) {
    this.personaNombre.set(persona.nombre);
    this.personaPapel.set(persona.papel);
    this.personaEspecialidades.set([...persona.especialidades]);
    this.error.set(null);
    this.bajaPendiente.set(null);
    this.editandoPersona.set(persona.id);
  }

  protected cancelarPersona() {
    this.editandoPersona.set(null);
    this.error.set(null);
  }

  protected alternarEspecialidad(especialidad: Especialidad) {
    this.personaEspecialidades.update((actuales) =>
      actuales.includes(especialidad)
        ? actuales.filter((e) => e !== especialidad)
        : [...actuales, especialidad],
    );
  }

  protected tiene(especialidad: Especialidad) {
    return this.personaEspecialidades().includes(especialidad);
  }

  protected async guardarPersona() {
    const id = this.editandoPersona();
    if (!id) return;

    const datos = {
      nombre: this.personaNombre(),
      papel: this.personaPapel(),
      especialidades: this.personaEspecialidades(),
    };

    await this.#operar(async () => {
      if (id === 'nuevo') {
        await this.#datos.personal.crear(datos);
      } else {
        await this.#datos.personal.editar(id, datos);
      }
      this.editandoPersona.set(null);
    });
  }

  /**
   * Preguntar antes de dar de baja, diciendo qué deja atrás.
   *
   * El aviso no bloquea: el [ADR 0005] no pone permisos, y esto tampoco es
   * uno. Es que quitar a alguien que responde por tres carros que están en el
   * taller ahora mismo es una decisión distinta a quitar a quien no responde
   * por ninguno, y sin el número las dos se ven igual.
   */
  protected async pedirBaja(persona: Persona) {
    await this.#operar(async () => {
      this.bajaPendiente.set({
        id: persona.id,
        nombre: persona.nombre,
        abiertas: await this.#datos.personal.ordenesAbiertasDe(persona.id),
      });
    });
  }

  protected cancelarBaja() {
    this.bajaPendiente.set(null);
  }

  protected async confirmarBaja() {
    const baja = this.bajaPendiente();
    if (!baja) return;

    await this.#operar(async () => {
      await this.#datos.personal.quitar(baja.id);
      this.bajaPendiente.set(null);
    });
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
