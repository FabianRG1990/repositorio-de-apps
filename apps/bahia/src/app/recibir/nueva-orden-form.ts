import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { siguienteNumeroOrden } from '../data-access/models/orden-trabajo.model';
import { ClientesStore } from '../data-access/stores/clientes.store';
import { OrdenesStore } from '../data-access/stores/ordenes.store';
import { TalleresStore } from '../data-access/stores/talleres.store';
import { VehiculosStore } from '../data-access/stores/vehiculos.store';

// Mensajes breves por código de error del reconocimiento — ver
// SpeechRecognitionErrorCode en lib.dom.d.ts para la lista completa; solo
// se traducen los que un usuario del taller podría encontrarse en vivo.
const MENSAJE_ERROR_VOZ: Partial<Record<string, string>> = {
  'not-allowed': 'Permiso de micrófono denegado.',
  'no-speech': 'No se detectó voz. Intenta de nuevo.',
  'audio-capture': 'No se encontró un micrófono.',
  network: 'Sin conexión — la voz a texto necesita internet.',
};

@Component({
  selector: 'app-nueva-orden-form',
  templateUrl: './nueva-orden-form.html',
  styleUrl: './nueva-orden-form.scss',
})
export class NuevaOrdenForm {
  private readonly ordenesStore = inject(OrdenesStore);
  private readonly clientesStore = inject(ClientesStore);
  private readonly vehiculosStore = inject(VehiculosStore);
  private readonly talleresStore = inject(TalleresStore);

  // Sin fallback externo (ver ticket "Alcance de voz a texto para el MVP")
  // — el botón de micrófono directamente no se muestra si el navegador no
  // soporta SpeechRecognition. Se evalúa una sola vez: el soporte del
  // navegador no cambia mientras la app está abierta.
  protected readonly soportaVoz = !!(
    window.SpeechRecognition ?? window.webkitSpeechRecognition
  );

  protected readonly abierto = signal(false);
  protected readonly vehiculoId = signal('');
  protected readonly kilometraje = signal<number | null>(null);
  protected readonly motivoIngreso = signal('');
  protected readonly origenMotivo = signal<'voz' | 'texto'>('texto');
  protected readonly escuchando = signal(false);
  protected readonly errorVoz = signal<string | null>(null);

  private reconocimiento: SpeechRecognition | null = null;

  protected readonly vehiculoOpciones = computed(() => {
    const clientesPorId = this.clientesStore.entityMap();
    return this.vehiculosStore.entities().map((vehiculo) => ({
      id: vehiculo.id,
      label: `${vehiculo.placa} — ${vehiculo.marca} ${vehiculo.modelo} (${
        clientesPorId[vehiculo.clienteId]?.nombre ?? 'cliente desconocido'
      })`,
    }));
  });

  protected readonly puedeEnviar = computed(
    () =>
      this.vehiculoId() !== '' &&
      (this.kilometraje() ?? 0) > 0 &&
      this.motivoIngreso().trim() !== '',
  );

  // Los 4 stores cargan de IndexedDB de forma independiente (misma razón
  // por la que KanbanBoard tiene su propio `cargando`) — sin esto, abrir y
  // enviar el formulario apenas carga la página podía dejar `taller`
  // undefined en `enviar()`, o generar un `numero` repetido porque
  // `ordenesStore.entities()` todavía estaba vacío.
  protected readonly cargando = computed(
    () =>
      !this.ordenesStore.cargado() ||
      !this.clientesStore.cargado() ||
      !this.vehiculosStore.cargado() ||
      !this.talleresStore.cargado(),
  );

  constructor() {
    // Si el componente se destruye (p. ej. al cambiar de usuario) mientras
    // el micrófono sigue escuchando, nada más lo detendría — quedaría
    // grabando huérfano en el navegador.
    inject(DestroyRef).onDestroy(() => this.detenerDictado());
  }

  protected abrir(): void {
    if (this.cargando()) return;
    this.abierto.set(true);
  }

  protected cancelar(): void {
    this.detenerDictado();
    this.resetear();
    this.abierto.set(false);
  }

  protected onKilometrajeInput(event: Event): void {
    const valor = (event.target as HTMLInputElement).valueAsNumber;
    this.kilometraje.set(Number.isNaN(valor) ? null : valor);
  }

  protected onMotivoInput(event: Event): void {
    this.motivoIngreso.set((event.target as HTMLTextAreaElement).value);
    this.origenMotivo.set('texto');
  }

  protected alternarDictado(): void {
    if (this.escuchando()) {
      this.detenerDictado();
      return;
    }

    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) return;

    const reconocimiento = new Ctor();
    reconocimiento.lang = 'es-MX';
    reconocimiento.interimResults = true;
    // El modo continuo está roto en Android (ver ticket "Cobertura de Web
    // Speech API en navegadores/dispositivos objetivo") — una frase por
    // intento, no continuo.
    reconocimiento.continuous = false;

    reconocimiento.onstart = () => {
      this.escuchando.set(true);
      this.errorVoz.set(null);
    };
    reconocimiento.onresult = (evento) => {
      const resultado = evento.results[evento.results.length - 1];
      this.motivoIngreso.set(resultado[0].transcript);
      if (resultado.isFinal) {
        this.origenMotivo.set('voz');
      }
    };
    reconocimiento.onerror = (evento) => {
      this.errorVoz.set(
        MENSAJE_ERROR_VOZ[evento.error] ??
          'No se pudo escuchar. Intenta de nuevo.',
      );
      this.escuchando.set(false);
    };
    reconocimiento.onend = () => {
      this.escuchando.set(false);
    };

    this.reconocimiento = reconocimiento;
    reconocimiento.start();
  }

  protected enviar(): void {
    if (!this.puedeEnviar()) return;

    const vehiculo = this.vehiculosStore.entityMap()[this.vehiculoId()];
    const taller = this.talleresStore.entities()[0];
    if (!vehiculo || !taller) return;

    this.ordenesStore.crear({
      numero: siguienteNumeroOrden(this.ordenesStore.entities()),
      tallerId: taller.id,
      clienteId: vehiculo.clienteId,
      vehiculoId: vehiculo.id,
      estado: 'Ingresado',
      kilometraje: this.kilometraje() ?? 0,
      motivoIngreso: this.motivoIngreso().trim(),
      origenMotivo: this.origenMotivo(),
      fechaIngreso: new Date().toISOString(),
    });

    this.detenerDictado();
    this.resetear();
    this.abierto.set(false);
  }

  private detenerDictado(): void {
    this.reconocimiento?.stop();
    this.reconocimiento = null;
  }

  private resetear(): void {
    this.vehiculoId.set('');
    this.kilometraje.set(null);
    this.motivoIngreso.set('');
    this.origenMotivo.set('texto');
    this.errorVoz.set(null);
  }
}
