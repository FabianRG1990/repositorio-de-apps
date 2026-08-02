import { Component, inject } from '@angular/core';
import { PERMISO_LABEL } from '../data-access/models/usuario.model';
import { SesionStore } from '../data-access/stores/sesion.store';
import { UsuariosStore } from '../data-access/stores/usuarios.store';

@Component({
  selector: 'app-sesion-selector',
  templateUrl: './sesion-selector.html',
  styleUrl: './sesion-selector.scss',
})
export class SesionSelector {
  protected readonly sesionStore = inject(SesionStore);
  protected readonly usuariosStore = inject(UsuariosStore);
  protected readonly permisoLabel = PERMISO_LABEL;
}
