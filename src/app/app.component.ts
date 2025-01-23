import { Component } from '@angular/core';
import { AppStore } from './app.store';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { ControlDateComponent } from './components/control-date/control-date.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    SpinnerComponent,
    ControlDateComponent,
  ],
  templateUrl: './app.component.html',
})
export class AppComponent {
  constructor(protected readonly store: AppStore) {}
}
