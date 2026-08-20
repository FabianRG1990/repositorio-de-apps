import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DiagnosticoPila } from './diagnostico-pila/diagnostico-pila';

@Component({
  imports: [RouterModule, DiagnosticoPila],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
