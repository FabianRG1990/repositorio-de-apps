import { TestBed } from '@angular/core/testing';
import { resetBahiaDbForTests } from '../data-access/persistence/bahia-db';
import { TalleresStore } from '../data-access/stores/talleres.store';
import { waitFor } from '../data-access/testing/wait-for';
import { ConfiguracionPanel } from './configuracion-panel';

describe('ConfiguracionPanel', () => {
  beforeEach(async () => {
    await resetBahiaDbForTests();
  });

  it('shows both switches checked by default (seeded taller has no configuracion)', async () => {
    const talleresStore = TestBed.inject(TalleresStore);
    await waitFor(() => talleresStore.cargado());

    const fixture = TestBed.createComponent(ConfiguracionPanel);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    compiled.querySelector<HTMLButtonElement>('.configuracion__abrir')?.click();
    fixture.detectChanges();

    const switches = compiled.querySelectorAll<HTMLInputElement>(
      '.configuracion__switch input',
    );
    expect(switches).toHaveLength(2);
    expect(switches[0].checked).toBe(true);
    expect(switches[1].checked).toBe(true);
  });

  it('unchecking "Facturar" persists the change without touching "Ver reportes"', async () => {
    const talleresStore = TestBed.inject(TalleresStore);
    await waitFor(() => talleresStore.cargado());

    const fixture = TestBed.createComponent(ConfiguracionPanel);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    compiled.querySelector<HTMLButtonElement>('.configuracion__abrir')?.click();
    fixture.detectChanges();

    const [facturarInput] = compiled.querySelectorAll<HTMLInputElement>(
      '.configuracion__switch input',
    );
    facturarInput.checked = false;
    facturarInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    await waitFor(() => talleresStore.configuracion().facturarHabilitado === false);

    expect(talleresStore.configuracion()).toEqual({
      facturarHabilitado: false,
      verReportesHabilitado: true,
    });
  });
});
