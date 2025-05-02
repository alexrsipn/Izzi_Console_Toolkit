import {Component, inject, Input, signal} from '@angular/core';
import {Resource} from "../../types/ofs-rest-api";
import {CommonModule} from "@angular/common";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatCheckboxChange, MatCheckboxModule} from "@angular/material/checkbox";
import {FormsModule} from "@angular/forms";
import {AppStore} from "../../app.store";

@Component({
  selector: 'app-resource-tree',
  standalone: true,
  imports: [CommonModule, MatTooltipModule, MatCheckboxModule, FormsModule],
  templateUrl: './resource-tree.component.html',
})
export class ResourceTreeComponent {
  @Input() resourceNode!: Resource;

  private readonly store = inject(AppStore);

  toggleSelection(node: Resource, isChecked: boolean) {
    node.selected = isChecked;
    /*this.store.updateResourceSelection(node);*/
    /*this.updateChildrenSelection(node, isChecked);*/
  }

  onSelectionChange(event: MatCheckboxChange): void {
    const isSelected = event.checked;
    this.store.toggleResidentialSelection({resource: this.resourceNode, isSelected});
  }

  private updateChildrenSelection(node: Resource, isChecked: boolean) {
      for (const child of node.children || []) {
        child.selected = isChecked;
        this.updateChildrenSelection(child, isChecked);
      }
    }
}
