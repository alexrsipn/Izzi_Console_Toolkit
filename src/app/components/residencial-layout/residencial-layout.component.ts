import {ChangeDetectionStrategy, Component, Input, signal} from '@angular/core';
import {MatCheckboxModule} from "@angular/material/checkbox";
import {FormsModule} from "@angular/forms";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatDatepickerModule} from "@angular/material/datepicker";
import {provideNativeDateAdapter} from "@angular/material/core";
import {MatCardModule} from "@angular/material/card";
import {MatInputModule} from "@angular/material/input";
import {MatIconModule} from "@angular/material/icon";
import {AppStore} from "../../app.store";
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {Resource} from "../../types/ofs-rest-api";
import {ResourceTreeComponent} from "../resource-tree/resource-tree.component";
import {ControlDateComponent} from "../control-date/control-date.component";

/*export interface Node {
  name: string;
  value: string;
  subNode?: Node[];
}*/

@Component({
  selector: 'app-residencial-layout',
  standalone: true,
  imports: [MatCheckboxModule, FormsModule, MatFormFieldModule, MatDatepickerModule, MatCardModule, MatInputModule, MatIconModule, NgIf, AsyncPipe, NgForOf, ResourceTreeComponent, ControlDateComponent],
  templateUrl: './residencial-layout.component.html',
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResidencialLayoutComponent {
  vm$ = this.store.vm$;

  constructor(protected readonly store: AppStore) {}

  value = "";
  resources: Resource | undefined = undefined;

/*  mostrar() {
    this.resources = this.store.getTree();
    console.log(this.resources);
  }*/

/*  readonly node = signal<Node>({
    name: 'Parent',
    value: 'Bucket',
    subNode: [
      {name: 'Recurso1', value: 'Recurso1'},
      {name: 'Recurso2', value: 'Recurso2'},
      {name: 'Recurso3', value: 'Recurso3'},
      {name: 'Recurso4', value: 'Recurso4'},
    ]
  });*/

/*  update(completed: boolean, index?: number) {
    this.node.update(node => {
      if (index === undefined) {
        node.name = "Resource";
      } else {
        node.subNode![index].value = "Modificado";
      }
      return {...node}
    })
  }*/
}
