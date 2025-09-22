import {ChangeDetectionStrategy, Component} from '@angular/core';
import {AppStore} from "../../app.store";
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {ResourceTreeComponent} from "../resource-tree/resource-tree.component";
import {MatCard, MatCardContent, MatCardHeader} from "@angular/material/card";
import {MatInput, MatLabel} from "@angular/material/input";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatFormField} from "@angular/material/form-field";
import {MatIcon} from "@angular/material/icon";
import {provideNativeDateAdapter} from "@angular/material/core";
import {MatButtonModule} from "@angular/material/button";

@Component({
  selector: 'app-interns-layout',
  imports: [
    AsyncPipe,
    NgIf,
    ResourceTreeComponent,
    MatCard,
    MatCardContent,
    MatFormField,
    MatIcon,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatCardHeader,
    NgForOf
  ],
  templateUrl: './interns-layout.component.html',
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class InternsLayoutComponent {
  vm$ = this.store.vm$;
  valueResidential = "";
  valueInternal = "";

  constructor(protected readonly store: AppStore) {}
}
