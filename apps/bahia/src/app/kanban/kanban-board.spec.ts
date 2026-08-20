import { TestBed } from '@angular/core/testing';
import { ESTADOS_ORDEN } from '../data-access/models/orden-trabajo.model';
import { resetBahiaDbForTests } from '../data-access/persistence/bahia-db';
import { ClientesStore } from '../data-access/stores/clientes.store';
import { FacturasStore } from '../data-access/stores/facturas.store';
import { OrdenesStore } from '../data-access/stores/ordenes.store';
import { SesionStore } from '../data-access/stores/sesion.store';
import { TalleresStore } from '../data-access/stores/talleres.store';
import { UsuariosStore } from '../data-access/stores/usuarios.store';
import { VehiculosStore } from '../data-access/stores/vehiculos.store';
import { waitFor } from '../data-access/testing/wait-for';
import { KanbanBoard } from './kanban-board';

async function esperarCargaCompleta(): Promise<{
  ordenesStore: InstanceType<typeof OrdenesStore>;
  clientesStore: InstanceType<typeof ClientesStore>;
  vehiculosStore: InstanceType<typeof VehiculosStore>;
  facturasStore: InstanceType<typeof FacturasStore>;
}> {
  const ordenesStore = TestBed.inject(OrdenesStore);
  const clientesStore = TestBed.inject(ClientesStore);
  const vehiculosStore = TestBed.inject(VehiculosStore);
  const facturasStore = TestBed.inject(FacturasStore);
  await waitFor(
    () =>
      ordenesStore.cargado() &&
      clientesStore.cargado() &&
      vehiculosStore.cargado() &&
      facturasStore.cargado(),
  );
  return { ordenesStore, clientesStore, vehiculosStore, facturasStore };
}

describe('KanbanBoard', () => {
  beforeEach(async () => {
    await resetBahiaDbForTests();
  });

  it('renders the 5 kanban columns with the seeded ordenes, cliente and vehiculo resolved', async () => {
    await esperarCargaCompleta();

    const fixture = TestBed.createComponent(KanbanBoard);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const columnas = compiled.querySelectorAll('.kanban__columna');
    expect(columnas).toHaveLength(ESTADOS_ORDEN.length);

    // el seed de OrdenesDataService trae una orden en cada estado; el
    // cliente/vehículo deben llegar ya resueltos, no en blanco
    expect(compiled.textContent).toContain('María Fernández');
    expect(compiled.textContent).toContain('PBH-3321');
  });

  it('shows the recurring vehiculo with 1 visita previa', async () => {
    await esperarCargaCompleta();

    const fixture = TestBed.createComponent(KanbanBoard);
    fixture.detectChanges();
    await fixture.whenStable();

    // orden-2 (Diagnostico, vehiculo-1) tiene una visita previa: orden-1
    // (Entregado, mismo vehiculo)
    const compiled = fixture.nativeElement as HTMLElement;
    const fichas = Array.from(
      compiled.querySelectorAll<HTMLElement>('app-ticket-card'),
    );
    const fichaConVisita = fichas.find((el) =>
      el.textContent?.includes('OT-A1-0148'),
    );
    expect(fichaConVisita?.textContent).toMatch(/Visitas previas\s*1/);
  });

  it('avanzar moves the orden to the next column for a usuario with permiso diagnosticar', async () => {
    const { ordenesStore } = await esperarCargaCompleta();
    const usuariosStore = TestBed.inject(UsuariosStore);
    await waitFor(() => usuariosStore.cargado());
    const mecanico = usuariosStore
      .entities()
      .find((u) => u.puesto === 'Mecánico');
    if (!mecanico) throw new Error('seed debería incluir un Mecánico');
    TestBed.inject(SesionStore).iniciarSesion(mecanico);

    const fixture = TestBed.createComponent(KanbanBoard);
    fixture.detectChanges();
    await fixture.whenStable();

    // orden-3 (OT-A1-0151) arranca en Ingresado
    const ordenId = ordenesStore
      .entities()
      .find((o) => o.numero === 'OT-A1-0151')?.id;
    expect(ordenId).toBeTruthy();

    const compiled = fixture.nativeElement as HTMLElement;
    const fichas = Array.from(
      compiled.querySelectorAll<HTMLElement>('app-ticket-card'),
    );
    const ficha = fichas.find((el) => el.textContent?.includes('OT-A1-0151'));
    const boton = ficha?.querySelector<HTMLButtonElement>('.ficha__avanzar');
    expect(boton).toBeTruthy();
    boton?.click();

    await waitFor(
      () =>
        ordenesStore.entityMap()[ordenId as string]?.estado === 'Diagnostico',
    );
    fixture.detectChanges();
    await fixture.whenStable();

    expect(ordenesStore.entityMap()[ordenId as string].estado).toBe(
      'Diagnostico',
    );
  });

  it('hides the avanzar button on every ficha when nobody is logged in', async () => {
    await esperarCargaCompleta();
    const fixture = TestBed.createComponent(KanbanBoard);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.ficha__avanzar')).toHaveLength(0);
  });

  it('hides the diagnostico editor when nobody is logged in', async () => {
    await esperarCargaCompleta();
    const fixture = TestBed.createComponent(KanbanBoard);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const ficha = Array.from(
      compiled.querySelectorAll<HTMLElement>('app-ticket-card'),
    ).find((el) => el.textContent?.includes('OT-A1-0148')); // seed: estado Diagnostico
    expect(ficha?.querySelector('.ficha__diagnostico-texto')).toBeNull();
  });

  it('lets a usuario with permiso diagnosticar save a diagnóstico from the board', async () => {
    const { ordenesStore } = await esperarCargaCompleta();
    const usuariosStore = TestBed.inject(UsuariosStore);
    await waitFor(() => usuariosStore.cargado());
    const mecanico = usuariosStore
      .entities()
      .find((u) => u.puesto === 'Mecánico');
    if (!mecanico) throw new Error('seed debería incluir un Mecánico');
    TestBed.inject(SesionStore).iniciarSesion(mecanico);

    const fixture = TestBed.createComponent(KanbanBoard);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const ficha = Array.from(
      compiled.querySelectorAll<HTMLElement>('app-ticket-card'),
    ).find((el) => el.textContent?.includes('OT-A1-0148'));
    const textarea = ficha?.querySelector<HTMLTextAreaElement>(
      '.ficha__diagnostico-texto',
    );
    if (!textarea) throw new Error('se esperaba el textarea de diagnóstico');

    textarea.value = 'Pastillas de freno delanteras al límite';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    ficha
      ?.querySelector<HTMLButtonElement>('.ficha__diagnostico-guardar')
      ?.click();

    const ordenId = ordenesStore
      .entities()
      .find((o) => o.numero === 'OT-A1-0148')?.id as string;
    await waitFor(
      () => ordenesStore.entityMap()[ordenId]?.diagnostico !== undefined,
    );

    expect(ordenesStore.entityMap()[ordenId].diagnostico).toBe(
      'Pastillas de freno delanteras al límite',
    );
  });

  it('shows the seeded factura as read-only regardless of permiso', async () => {
    await esperarCargaCompleta();
    const fixture = TestBed.createComponent(KanbanBoard);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    // orden-1 (OT-A1-0140) ya está Entregado y trae una factura sembrada
    const ficha = Array.from(
      compiled.querySelectorAll<HTMLElement>('app-ticket-card'),
    ).find((el) => el.textContent?.includes('OT-A1-0140'));
    expect(ficha?.querySelector('.ficha__concepto-agregar')).toBeNull();
    expect(ficha?.textContent).toContain('FA-A1-0001');
  });

  it('lets a usuario with permiso facturar invoice an orden recién Entregado', async () => {
    const { ordenesStore, facturasStore } = await esperarCargaCompleta();
    const usuariosStore = TestBed.inject(UsuariosStore);
    await waitFor(() => usuariosStore.cargado());
    const administradora = usuariosStore
      .entities()
      .find((u) => u.puesto === 'Administración');
    if (!administradora) throw new Error('seed debería incluir Administración');
    TestBed.inject(SesionStore).iniciarSesion(administradora);

    const fixture = TestBed.createComponent(KanbanBoard);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    // orden-5 (OT-A1-0153) arranca en Listo — la avanzamos a Entregado primero
    const buscarFicha = () =>
      Array.from(
        compiled.querySelectorAll<HTMLElement>('app-ticket-card'),
      ).find((el) => el.textContent?.includes('OT-A1-0153'));

    buscarFicha()?.querySelector<HTMLButtonElement>('.ficha__avanzar')?.click();

    const ordenId = ordenesStore
      .entities()
      .find((o) => o.numero === 'OT-A1-0153')?.id as string;
    await waitFor(
      () => ordenesStore.entityMap()[ordenId]?.estado === 'Entregado',
    );
    fixture.detectChanges();
    await fixture.whenStable();

    const ficha = buscarFicha();
    const inputs = ficha?.querySelectorAll<HTMLInputElement>(
      '.ficha__concepto-input',
    );
    const inputDescripcion = inputs?.[0];
    const inputMonto = inputs?.[1];
    if (!inputDescripcion || !inputMonto) {
      throw new Error('se esperaba el formulario de factura');
    }

    inputDescripcion.value = 'Revisión de frenos';
    inputDescripcion.dispatchEvent(new Event('input'));
    inputMonto.value = '300';
    inputMonto.dispatchEvent(new Event('input'));
    ficha
      ?.querySelector<HTMLButtonElement>('.ficha__concepto-agregar')
      ?.click();
    fixture.detectChanges();

    ficha?.querySelector<HTMLButtonElement>('.ficha__factura-guardar')?.click();

    await waitFor(() =>
      facturasStore.entities().some((f) => f.ordenId === ordenId),
    );

    const creada = facturasStore.entities().find((f) => f.ordenId === ordenId);
    expect(creada?.conceptos).toEqual([
      { descripcion: 'Revisión de frenos', monto: 300 },
    ]);
  });

  it('hides the factura editor when "Facturar" is disabled in configuracion, but keeps an existing factura visible', async () => {
    await esperarCargaCompleta();
    const talleresStore = TestBed.inject(TalleresStore);
    await waitFor(() => talleresStore.cargado());
    const usuariosStore = TestBed.inject(UsuariosStore);
    await waitFor(() => usuariosStore.cargado());
    const administradora = usuariosStore
      .entities()
      .find((u) => u.puesto === 'Administración');
    if (!administradora) throw new Error('seed debería incluir Administración');
    TestBed.inject(SesionStore).iniciarSesion(administradora);

    talleresStore.actualizarConfiguracion({ facturarHabilitado: false });
    await waitFor(
      () => talleresStore.configuracion().facturarHabilitado === false,
    );

    const fixture = TestBed.createComponent(KanbanBoard);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    // orden-1 (OT-A1-0140) ya tiene una factura sembrada — debe seguir visible
    const fichaConFactura = Array.from(
      compiled.querySelectorAll<HTMLElement>('app-ticket-card'),
    ).find((el) => el.textContent?.includes('OT-A1-0140'));
    expect(fichaConFactura?.textContent).toContain('FA-A1-0001');

    // orden-5 (OT-A1-0153) está en Listo — la avanzamos a Entregado, no debe
    // ofrecer el formulario de factura nueva con la función desactivada
    const buscarFicha = () =>
      Array.from(
        compiled.querySelectorAll<HTMLElement>('app-ticket-card'),
      ).find((el) => el.textContent?.includes('OT-A1-0153'));
    buscarFicha()?.querySelector<HTMLButtonElement>('.ficha__avanzar')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(buscarFicha()?.querySelector('.ficha__concepto-agregar')).toBeNull();
  });
});
