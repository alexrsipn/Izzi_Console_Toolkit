import {Component, Input, signal} from '@angular/core';
import {Resource} from "../../types/ofs-rest-api";
import {CommonModule} from "@angular/common";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {FormsModule} from "@angular/forms";

@Component({
  selector: 'app-resource-tree',
  standalone: true,
  imports: [CommonModule, MatTooltipModule, MatCheckboxModule, FormsModule],
  templateUrl: './resource-tree.component.html',
})
export class ResourceTreeComponent {
  @Input() resourceNode!: Resource;

  toggleSelection(node: Resource, isChecked: boolean) {
    node.selected = isChecked;
    this.updateChildrenSelection(node, isChecked);
  }

  private updateChildrenSelection(node: Resource, isChecked: boolean) {
    for (const child of node.children || []) {
      child.selected = isChecked;
      this.updateChildrenSelection(child, isChecked);
    }
  }
}
