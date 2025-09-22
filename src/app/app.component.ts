import { Component } from '@angular/core';
import { AppStore } from './app.store';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { SpinnerComponent } from './components/spinner/spinner.component';
import {MatIconModule} from "@angular/material/icon";
import {MatTabsModule} from "@angular/material/tabs";
import {InternsLayoutComponent} from "./components/interns-layout/interns-layout.component";

@Component({
    selector: 'app-root',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        SpinnerComponent,
        InternsLayoutComponent,
        MatTabsModule
    ],
    templateUrl: './app.component.html'
})
export class AppComponent {
  constructor(protected readonly store: AppStore) { }
}
