import { TestBed } from '@angular/core/testing';
import { resetBahiaDbForTests } from '../data-access/persistence/bahia-db';
import { OrdenesStore } from '../data-access/stores/ordenes.store';
import { TalleresStore } from '../data-access/stores/talleres.store';
import { VehiculosStore } from '../data-access/stores/vehiculos.store';
import { ClientesStore } from '../data-access/stores/clientes.store';
import { waitFor } from '../data-access/testing/wait-for';
import { NuevaOrdenForm } from './nueva-orden-form';

// Fake mínimo de SpeechRecognition para los tests — jsdom no la implementa.
// Sigue la forma real (ver apps/bahia/src/types/speech-recognition.d.ts) lo
// suficiente para ejercitar el flujo de dictado sin un navegador real.
class FakeSpeechRecognition extends EventTarget implements SpeechRecognition {
  static ultimaInstancia: FakeSpeechRecognition | undefined;

  lang = '';
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null = null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null = null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null = null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
    | null = null;

  constructor() {
    super();
    FakeSpeechRecognition.ultimaInstancia = this;
  }

  start(): void {
    this.onstart?.call(this, new Event('start'));
  }

  stop(): void {
    this.onend?.call(this, new Event('end'));
  }

  abort(): void {
    this.onend?.call(this, new Event('end'));
  }

  emitirResultado(transcript: string, isFinal: boolean): void {
    const alternativa = { transcript, confidence: 1 };
    const resultado = Object.assign([alternativa], { isFinal });
    const evento = {
      results: Object.assign([resultado], {}),
    } as unknown as SpeechRecognitionEvent;
    this.onresult?.call(this, evento);
  }
}

async function esperarCargaCompleta() {
  const ordenesStore = TestBed.inject(OrdenesStore);
  const clientesStore = TestBed.inject(ClientesStore);
  const vehiculosStore = TestBed.inject(VehiculosStore);
  const talleresStore = TestBed.inject(TalleresStore);
  await waitFor(
    () =>
      ordenesStore.cargado() &&
      clientesStore.cargado() &&
      vehiculosStore.cargado() &&
      talleresStore.cargado(),
  );
  return { ordenesStore, vehiculosStore };
}

describe('NuevaOrdenForm', () => {
  beforeEach(async () => {
    await resetBahiaDbForTests();
    delete (window as { SpeechRecognition?: unknown }).SpeechRecognition;
  });

  it('does not render the mic button when the browser has no SpeechRecognition', async () => {
    await esperarCargaCompleta();
    const fixture = TestBed.createComponent(NuevaOrdenForm);
    fixture.detectChanges();
    await fixture.whenStable();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.nueva-orden__abrir')
      ?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.campo-motivo__mic')).toBeNull();
  });

  it('renders the mic button and fills the motivo from a final dictation result', async () => {
    (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition =
      FakeSpeechRecognition;

    await esperarCargaCompleta();
    const fixture = TestBed.createComponent(NuevaOrdenForm);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    compiled.querySelector<HTMLButtonElement>('.nueva-orden__abrir')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const boton = compiled.querySelector<HTMLButtonElement>(
      '.campo-motivo__mic',
    );
    expect(boton).toBeTruthy();
    boton?.click();
    fixture.detectChanges();

    FakeSpeechRecognition.ultimaInstancia?.emitirResultado(
      'ruido al frenar',
      true,
    );
    fixture.detectChanges();
    await fixture.whenStable();

    const textarea = compiled.querySelector<HTMLTextAreaElement>(
      '.campo-motivo__texto',
    );
    expect(textarea?.value).toBe('ruido al frenar');
  });

  it('creates an orden with origenMotivo "voz" when submitted after dictation', async () => {
    (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition =
      FakeSpeechRecognition;

    const { ordenesStore, vehiculosStore } = await esperarCargaCompleta();
    const fixture = TestBed.createComponent(NuevaOrdenForm);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    compiled.querySelector<HTMLButtonElement>('.nueva-orden__abrir')?.click();
    fixture.detectChanges();

    const [vehiculo] = vehiculosStore.entities();
    const select = compiled.querySelector<HTMLSelectElement>(
      '.campo-form__control',
    ) as HTMLSelectElement;
    select.value = vehiculo.id;
    select.dispatchEvent(new Event('change'));

    const kilometrajeInput = compiled.querySelectorAll<HTMLInputElement>(
      '.campo-form__control',
    )[1];
    kilometrajeInput.value = '50000';
    kilometrajeInput.dispatchEvent(new Event('input'));

    compiled
      .querySelector<HTMLButtonElement>('.campo-motivo__mic')
      ?.click();
    FakeSpeechRecognition.ultimaInstancia?.emitirResultado(
      'cambio de aceite',
      true,
    );
    fixture.detectChanges();
    await fixture.whenStable();

    const antes = ordenesStore.entities().length;
    const boton = compiled.querySelector<HTMLButtonElement>(
      '.nueva-orden__enviar',
    );
    expect(boton?.disabled).toBe(false);
    boton?.click();

    await waitFor(() => ordenesStore.entities().length > antes);

    const creada = ordenesStore
      .entities()
      .find((o) => o.motivoIngreso === 'cambio de aceite');
    expect(creada?.origenMotivo).toBe('voz');
    expect(creada?.vehiculoId).toBe(vehiculo.id);
    expect(creada?.kilometraje).toBe(50000);
    expect(creada?.estado).toBe('Ingresado');
  });

  it('keeps origenMotivo as "texto" when the user types manually', async () => {
    (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition =
      FakeSpeechRecognition;

    const { ordenesStore, vehiculosStore } = await esperarCargaCompleta();
    const fixture = TestBed.createComponent(NuevaOrdenForm);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    compiled.querySelector<HTMLButtonElement>('.nueva-orden__abrir')?.click();
    fixture.detectChanges();

    const [vehiculo] = vehiculosStore.entities();
    const select = compiled.querySelector<HTMLSelectElement>(
      '.campo-form__control',
    ) as HTMLSelectElement;
    select.value = vehiculo.id;
    select.dispatchEvent(new Event('change'));

    const kilometrajeInput = compiled.querySelectorAll<HTMLInputElement>(
      '.campo-form__control',
    )[1];
    kilometrajeInput.value = '1000';
    kilometrajeInput.dispatchEvent(new Event('input'));

    const textarea = compiled.querySelector<HTMLTextAreaElement>(
      '.campo-motivo__texto',
    ) as HTMLTextAreaElement;
    textarea.value = 'revisión escrita a mano';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const antes = ordenesStore.entities().length;
    compiled
      .querySelector<HTMLButtonElement>('.nueva-orden__enviar')
      ?.click();
    await waitFor(() => ordenesStore.entities().length > antes);

    const creada = ordenesStore
      .entities()
      .find((o) => o.motivoIngreso === 'revisión escrita a mano');
    expect(creada?.origenMotivo).toBe('texto');
  });
});
