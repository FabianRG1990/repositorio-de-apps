import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SesionStore } from './data-access/stores/sesion.store';
import { KanbanBoard } from './kanban/kanban-board';
import { NuevaOrdenForm } from './recibir/nueva-orden-form';
import { ReportesPanel } from './reportes/reportes-panel';
import { SesionSelector } from './sesion/sesion-selector';

@Component({
  imports: [
    RouterModule,
    SesionSelector,
    KanbanBoard,
    NuevaOrdenForm,
    ReportesPanel,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly sesionStore = inject(SesionStore);
}
