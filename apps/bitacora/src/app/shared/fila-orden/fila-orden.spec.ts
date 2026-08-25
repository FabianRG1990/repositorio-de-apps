import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConfiguracionTallerStore } from '../../data-access/configuracion-taller.store';
import type { Orden } from '../../data-access/ordenes.store';
import { EtiquetaEspecialidad } from '../etiqueta-especialidad/etiqueta-especialidad';
import { InsigniaEstado } from '../insignia-estado/insignia-estado';
import { FilaOrden } from './fila-orden';

const ORDEN: Orden = {
  id: 'orden-de-prueba',
  folio: 'A1-2418',
  placa: '863 549',
  vehiculo: 'Toyota Hilux 2019',
  cliente: 'Marielos Quesada',
  telefono: '8888-1111',
  estado: 'Esperando repuesto',
  estadoClave: 'esperando-repuesto',
  tono: 'riesgo',
  tiempoParado: 52,
  detalle: 'Bomba de agua pedida a San José',
  reportes: [],
  fotos: [],
  aviso: null,
  diasAvisado: null,
  sinRecoger: false,
  proximaVisita: null,
  entrada: {
    odometro: null,
    combustible: null,
    danosPrevios: '',
    objetosDentro: '',
  },
  lineas: [],
  especialidades: ['mecanica'],
};

@Component({
  template: `<ul>
    <li app-fila-orden [orden]="orden()" (detallePedido)="pedidos.push(1)"></li>
  </ul>`,
  imports: [FilaOrden],
})
class Anfitriona {
  readonly orden = signal<Orden>(ORDEN);
  readonly pedidos: number[] = [];
}

describe('la fila de una Orden', () => {
  beforeEach(() => localStorage.clear());

  async function montar(orden: Orden = ORDEN) {
    const fixture = TestBed.createComponent(Anfitriona);
    fixture.componentInstance.orden.set(orden);
    await fixture.whenStable();
    return fixture;
  }

  /* El `<li>` de verdad, no un `<app-fila-orden>` dentro de un `<ul>`: eso no
     es HTML válido y rompe la relación lista↔elemento que el lector de
     pantalla anuncia. */
  it('es un li, no un elemento propio metido dentro del ul', async () => {
    const fixture = await montar();
    const fila = fixture.nativeElement.querySelector('ul > li.fila');

    expect(fila).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-fila-orden')).toBeNull();
  });

  /* Un `<button>` dentro de otro `<button>` es HTML inválido, y era lo que
     salía de meter Ver orden dentro de la fila clicable. */
  it('los dos botones son hermanos, no uno dentro del otro', async () => {
    const fixture = await montar();
    const botones = [
      ...fixture.nativeElement.querySelectorAll('li.fila button'),
    ] as HTMLElement[];

    expect(botones.length).toBe(2);
    expect(botones.some((b) => b.querySelector('button'))).toBe(false);
  });

  it('Ver orden avisa por su propia salida, no por la de seleccionar', async () => {
    const fixture = await montar();
    const accion = fixture.nativeElement.querySelector(
      '.fila__accion',
    ) as HTMLElement;

    accion.click();
    await fixture.whenStable();

    expect(fixture.componentInstance.pedidos.length).toBe(1);
  });

  /* La placa es lo que identifica el carro: cuando el título no cabe, lo que
     cede es el modelo. Con una sola cadena se cortaba en "TSJ 1…". */
  it('la placa va aparte del modelo para que no sea ella la que se corta', async () => {
    const fixture = await montar();
    const modelo = fixture.nativeElement.querySelector('.fila__modelo');
    const placa = fixture.nativeElement.querySelector('.fila__placa');

    expect(modelo.textContent.trim()).toBe('Toyota Hilux 2019');
    expect(placa.textContent.trim()).toBe('863 549');
    expect(placa.classList.contains('identificador')).toBe(true);
  });

  /* Con dos o más especialidades el texto sacaría la columna de su ancho y las
     filas dejarían de alinear, así que se queda la marca de color. El nombre
     NO se borra: se oculta visualmente y sigue en el árbol de accesibilidad,
     porque si el color fuera el único portador, la etiqueta dejaría de cumplir
     #18 §6.2 regla 2. */
  it('con varias especialidades esconde el nombre a la vista pero no al lector', async () => {
    const fixture = await montar({
      ...ORDEN,
      especialidades: ['mecanica', 'pintura'],
    });
    const textos = [
      ...fixture.nativeElement.querySelectorAll('.esp__texto'),
    ] as HTMLElement[];

    expect(textos.map((t) => t.textContent?.trim())).toEqual([
      'Mecánica',
      'Pintura',
    ]);
    expect(textos.every((t) => t.classList.contains('solo-lectores'))).toBe(
      true,
    );
  });

  it('con una sola especialidad el nombre se lee', async () => {
    const fixture = await montar();
    const texto = fixture.nativeElement.querySelector('.esp__texto');

    expect(texto.textContent.trim()).toBe('Mecánica');
    expect(texto.classList.contains('solo-lectores')).toBe(false);
  });

  /* La perilla vive en un solo sitio. Si fuera un `@Input`, bastaría con que
     una pantalla olvidara reenviarlo para tener dos densidades en una lista. */
  it('toma la densidad del store del Taller y no de quien la use', async () => {
    const fixture = await montar();
    const fila = fixture.nativeElement.querySelector('li.fila');
    expect(fila.classList.contains('fila--compacta')).toBe(false);

    TestBed.inject(ConfiguracionTallerStore).cambiarDensidad('compacta');
    await fixture.whenStable();

    expect(fila.classList.contains('fila--compacta')).toBe(true);
  });
});

describe('la insignia de estado', () => {
  /* El componente pone el tono en el DOM; que cada tono dibuje una figura
     distinta lo comprueba el e2e, porque jsdom no aplica la hoja del
     componente ni resuelve `::before`. */
  it('pone el tono donde el CSS pueda colgarle su figura', async () => {
    const fixture = TestBed.createComponent(InsigniaEstado);
    fixture.componentRef.setInput('texto', 'Listo para entrega');
    fixture.componentRef.setInput('tono', 'ok');
    await fixture.whenStable();

    const insignia = fixture.nativeElement.querySelector('.insignia');
    expect(insignia.dataset.tono).toBe('ok');
    expect(insignia.textContent.trim()).toBe('Listo para entrega');
  });
});

describe('la etiqueta de especialidad', () => {
  /* El primer reparto dejaba mecánica y pintura a 25°: en pantalla eran el
     mismo turquesa (ΔE OKLab 0,039). Estos tres van a 60° o más. */
  it('los tres matices están a 60° o más entre sí', async () => {
    const matices: number[] = [];

    for (const especialidad of [
      'mecanica',
      'electricidad',
      'pintura',
    ] as const) {
      const fixture = TestBed.createComponent(EtiquetaEspecialidad);
      fixture.componentRef.setInput('especialidad', especialidad);
      await fixture.whenStable();

      const esp = fixture.nativeElement.querySelector('.esp') as HTMLElement;
      matices.push(Number(esp.style.getPropertyValue('--esp-h')));
    }

    const ordenados = [...matices].sort((a, b) => a - b);
    for (let i = 1; i < ordenados.length; i++) {
      expect(ordenados[i] - ordenados[i - 1]).toBeGreaterThanOrEqual(60);
    }
  });
});
