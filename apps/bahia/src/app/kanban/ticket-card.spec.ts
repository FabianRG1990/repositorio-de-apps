import { TestBed } from '@angular/core/testing';
import { Cliente } from '../data-access/models/cliente.model';
import { OrdenTrabajo } from '../data-access/models/orden-trabajo.model';
import { Vehiculo } from '../data-access/models/vehiculo.model';
import { TicketCard } from './ticket-card';

const cliente: Cliente = {
  id: 'cliente-1',
  nombre: 'María Fernández',
  telefono: '555-0142',
};

const vehiculo: Vehiculo = {
  id: 'vehiculo-1',
  clienteId: 'cliente-1',
  placa: 'PBH-3321',
  marca: 'Toyota',
  modelo: 'Corolla',
  anio: 2018,
};

const ordenBase: OrdenTrabajo = {
  id: 'orden-2',
  numero: 'OT-0148',
  tallerId: 'taller-1',
  clienteId: 'cliente-1',
  vehiculoId: 'vehiculo-1',
  estado: 'Diagnostico',
  kilometraje: 84500,
  motivoIngreso: 'Ruido metálico al frenar',
  origenMotivo: 'voz',
  fechaIngreso: '2026-08-01T08:14:00',
};

describe('TicketCard', () => {
  it('renders cliente, vehiculo and orden data', async () => {
    const fixture = TestBed.createComponent(TicketCard);
    fixture.componentRef.setInput('orden', ordenBase);
    fixture.componentRef.setInput('cliente', cliente);
    fixture.componentRef.setInput('vehiculo', vehiculo);
    fixture.componentRef.setInput('visitasPrevias', 1);
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('María Fernández');
    expect(compiled.textContent).toContain('OT-0148');
    expect(compiled.textContent).toContain('PBH-3321');
    expect(compiled.textContent).toContain('84,500 km');
    expect(compiled.querySelector('[title="Dictado por voz"]')).toBeTruthy();
  });

  it('shows an avanzar button for a non-final estado and emits on click', async () => {
    const fixture = TestBed.createComponent(TicketCard);
    fixture.componentRef.setInput('orden', ordenBase);
    fixture.detectChanges();
    await fixture.whenStable();

    let emitido = false;
    fixture.componentInstance.avanzar.subscribe(() => (emitido = true));

    const boton = fixture.nativeElement.querySelector(
      '.ficha__avanzar',
    ) as HTMLButtonElement;
    expect(boton.textContent).toContain('Avanzar a En reparación');
    boton.click();

    expect(emitido).toBe(true);
  });

  it('shows a completion message instead of a button when estado is Entregado', async () => {
    const fixture = TestBed.createComponent(TicketCard);
    fixture.componentRef.setInput('orden', { ...ordenBase, estado: 'Entregado' });
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.ficha__avanzar')).toBeNull();
    expect(compiled.querySelector('.ficha__completada')?.textContent).toContain(
      'Entregado',
    );
  });
});
