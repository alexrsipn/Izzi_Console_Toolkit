import {Component, signal} from '@angular/core';
import {MatCheckboxModule} from "@angular/material/checkbox";
import {FormsModule} from "@angular/forms";
import {MatCardModule} from "@angular/material/card";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatIcon} from "@angular/material/icon";
import {MatInput} from "@angular/material/input";
import {MatTooltipModule} from "@angular/material/tooltip";
import {AppStore} from "../../app.store";
import {AsyncPipe, NgIf} from "@angular/common";

export interface Node {
  name: string;
  endDate: string;
  workZones: string;
}

@Component({
  selector: 'app-pyme-layout',
  standalone: true,
  imports: [
    MatCheckboxModule, FormsModule, MatCardModule, MatSlideToggleModule, MatFormField, MatIcon, MatInput, MatLabel, MatTooltipModule, AsyncPipe, NgIf
  ],
  templateUrl: './pyme-layout.component.html',
})
export class PymeLayoutComponent {
  vm$ = this.store.vm$;

  constructor(protected readonly store: AppStore) {}

  value = "";

  resources:Node[] = [];

  readonly node = signal<Node>({
    name: 'Recurso',
    endDate: '28/03/2024',
    workZones: "MERIDA"
  });

  ngOnInit(): void {
    for (let i = 0; i < 10; i++) {
      this.resources.push({
        name: `Recurso ${i}`,
        endDate: '28/03/2024',
        workZones: `Zona ${i}`
      })
    }
  }

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
