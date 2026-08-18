import { Component, inject, signal } from '@angular/core';
import { TalleresStore } from '../data-access/stores/talleres.store';

@Component({
  selector: 'app-configuracion-panel',
  templateUrl: './configuracion-panel.html',
  styleUrl: './configuracion-panel.scss',
})
export class ConfiguracionPanel {
  protected readonly talleresStore = inject(TalleresStore);

  protected readonly abierto = signal(false);

  protected abrir(): void {
    this.abierto.set(true);
  }

  protected cerrar(): void {
    this.abierto.set(false);
  }

  protected onFacturarChange(event: Event): void {
    this.talleresStore.actualizarConfiguracion({
      facturarHabilitado: (event.target as HTMLInputElement).checked,
    });
  }

  protected onVerReportesChange(event: Event): void {
    this.talleresStore.actualizarConfiguracion({
      verReportesHabilitado: (event.target as HTMLInputElement).checked,
    });
  }
}
