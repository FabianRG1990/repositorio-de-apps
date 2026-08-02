import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SesionSelector } from './sesion/sesion-selector';

@Component({
  imports: [RouterModule, SesionSelector],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
