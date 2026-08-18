import { TestBed } from '@angular/core/testing';
import { resetBahiaDbForTests } from '../persistence/bahia-db';
import { waitFor } from '../testing/wait-for';
import { TalleresStore } from './talleres.store';

describe('TalleresStore', () => {
  beforeEach(async () => {
    await resetBahiaDbForTests();
  });

  it('loads the seeded taller on init', async () => {
    const store = TestBed.inject(TalleresStore);
    await waitFor(() => store.cargado());

    expect(store.entities()).toHaveLength(1);
    expect(store.entities()[0].nombre).toBe('Taller Bahía Centro');
  });

  it('defaults configuracion to both features enabled when the seeded taller has none', async () => {
    const store = TestBed.inject(TalleresStore);
    await waitFor(() => store.cargado());

    expect(store.configuracion()).toEqual({
      facturarHabilitado: true,
      verReportesHabilitado: true,
    });
  });

  it('actualizarConfiguracion persists a partial change without touching the other flag', async () => {
    const store = TestBed.inject(TalleresStore);
    await waitFor(() => store.cargado());

    store.actualizarConfiguracion({ facturarHabilitado: false });
    await waitFor(() => store.configuracion().facturarHabilitado === false);

    expect(store.configuracion()).toEqual({
      facturarHabilitado: false,
      verReportesHabilitado: true,
    });
  });
});
