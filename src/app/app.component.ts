import { Component } from '@angular/core';
import { AppStore } from './app.store';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { ControlDateComponent } from './components/control-date/control-date.component';
import {ResidencialLayoutComponent} from "./components/residencial-layout/residencial-layout.component";
import {PymeLayoutComponent} from "./components/pyme-layout/pyme-layout.component";
import {MatIconModule} from "@angular/material/icon";

@Component({
    selector: 'app-root',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        SpinnerComponent,
        ControlDateComponent,
        ResidencialLayoutComponent,
        PymeLayoutComponent,
    ],
    templateUrl: './app.component.html'
})
export class AppComponent {
  constructor(protected readonly store: AppStore) { }
}
