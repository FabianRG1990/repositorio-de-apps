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
});
