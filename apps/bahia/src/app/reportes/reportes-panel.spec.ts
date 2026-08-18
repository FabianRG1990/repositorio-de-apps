import { TestBed } from '@angular/core/testing';
import { ClientesStore } from '../data-access/stores/clientes.store';
import { FacturasStore } from '../data-access/stores/facturas.store';
import { OrdenesStore } from '../data-access/stores/ordenes.store';
import { resetBahiaDbForTests } from '../data-access/persistence/bahia-db';
import { VehiculosStore } from '../data-access/stores/vehiculos.store';
import { waitFor } from '../data-access/testing/wait-for';
import { ReportesPanel } from './reportes-panel';

async function esperarCargaCompleta(): Promise<void> {
  const ordenesStore = TestBed.inject(OrdenesStore);
  const facturasStore = TestBed.inject(FacturasStore);
  const vehiculosStore = TestBed.inject(VehiculosStore);
  const clientesStore = TestBed.inject(ClientesStore);
  await waitFor(
    () =>
      ordenesStore.cargado() &&
      facturasStore.cargado() &&
      vehiculosStore.cargado() &&
      clientesStore.cargado(),
  );
}

describe('ReportesPanel', () => {
  beforeEach(async () => {
    await resetBahiaDbForTests();
  });

  it('disables "Ver reportes" until the dependent stores finish loading', async () => {
    const fixture = TestBed.createComponent(ReportesPanel);
    fixture.detectChanges();

    const boton = (
      fixture.nativeElement as HTMLElement
    ).querySelector<HTMLButtonElement>('.reportes__abrir');
    expect(boton?.disabled).toBe(true);

    await esperarCargaCompleta();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(boton?.disabled).toBe(false);
  });

  it('shows the 5 estados, the total facturado and the recurring vehiculo with no date filter', async () => {
    await esperarCargaCompleta();
    const fixture = TestBed.createComponent(ReportesPanel);
    fixture.detectChanges();
    await fixture.whenStable();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.reportes__abrir')
      ?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const estados = compiled.querySelectorAll('.reportes__estado');
    expect(estados).toHaveLength(5);
    // el seed trae exactamente 1 orden en cada uno de los 5 estados
    estados.forEach((estado) => {
      expect(
        estado.querySelector('.reportes__estado-conteo')?.textContent,
      ).toBe('1');
    });

    // la única factura sembrada suma 770 (450 + 120 + 200)
    expect(compiled.querySelector('.reportes__total')?.textContent).toContain(
      '770',
    );

    // vehiculo-1 (María Fernández) tiene 2 órdenes — el máximo
    const vehiculos = compiled.querySelectorAll('.reportes__vehiculo');
    expect(vehiculos).toHaveLength(1);
    expect(vehiculos[0].textContent).toContain('PBH-3321');
    expect(vehiculos[0].textContent).toContain('2');
  });

  it('filters all 3 metrics by fecha range', async () => {
    await esperarCargaCompleta();
    const fixture = TestBed.createComponent(ReportesPanel);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    compiled.querySelector<HTMLButtonElement>('.reportes__abrir')?.click();
    fixture.detectChanges();

    // orden-1/factura-1 son de mayo 2026 — un rango que arranca en julio
    // los deja fuera de las 3 métricas
    const [inputDesde] = compiled.querySelectorAll<HTMLInputElement>(
      '.reportes__filtro-campo input',
    );
    inputDesde.value = '2026-07-01';
    inputDesde.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    const estados = compiled.querySelectorAll('.reportes__estado');
    const entregado = Array.from(estados).find((el) =>
      el.textContent?.includes('Entregado'),
    );
    expect(
      entregado?.querySelector('.reportes__estado-conteo')?.textContent,
    ).toBe('0');
    expect(compiled.querySelector('.reportes__total')?.textContent).toContain(
      '0',
    );
    // solo queda orden-2 (Diagnostico, agosto) para vehiculo-1 → ya no es
    // "más visitado" que los demás, todos con 1
    const vehiculos = compiled.querySelectorAll('.reportes__vehiculo');
    expect(vehiculos.length).toBeGreaterThan(1);

    // limpiar fechas vuelve a mostrar el total sin filtrar
    compiled
      .querySelector<HTMLButtonElement>('.reportes__filtro-limpiar')
      ?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(compiled.querySelector('.reportes__total')?.textContent).toContain(
      '770',
    );
  });
});
