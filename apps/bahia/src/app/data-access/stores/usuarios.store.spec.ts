import { TestBed } from '@angular/core/testing';
import { resetBahiaDbForTests } from '../persistence/bahia-db';
import { waitFor } from '../testing/wait-for';
import { UsuariosStore } from './usuarios.store';

describe('UsuariosStore', () => {
  beforeEach(async () => {
    await resetBahiaDbForTests();
  });

  it('loads the seeded usuarios on init', async () => {
    const store = TestBed.inject(UsuariosStore);
    await waitFor(() => store.entities().length > 0);

    expect(store.entities()).toHaveLength(3);
  });
});
