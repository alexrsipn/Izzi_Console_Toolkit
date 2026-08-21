import {ChangeDetectionStrategy, Component} from '@angular/core';
import {AppStore} from "../../app.store";
import {AsyncPipe, NgIf} from "@angular/common";
import {ResourceTreeComponent} from "../resource-tree/resource-tree.component";
import {FormsModule} from "@angular/forms";
import {provideNativeDateAdapter} from "@angular/material/core";

@Component({
  selector: 'app-interns-layout',
  imports: [
    AsyncPipe,
    NgIf,
    ResourceTreeComponent,
    FormsModule,
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
