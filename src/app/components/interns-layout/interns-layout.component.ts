import {ChangeDetectionStrategy, Component} from '@angular/core';
import {AppStore} from "../../app.store";
import {Resource} from '../../types/ofs-rest-api';
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

  /*getFilteredInternalTrees(trees: Resource[] | undefined, term: string): Resource[] {
    if (!trees) return [];
    if (!term || term.trim() === '') return trees;
    const lowerTerm = term.toLowerCase();
    return trees
      .map(tree => this._filterSingleNodeRecursive(tree, lowerTerm))
      .filter((tree): tree is Resource => tree !== null);
  }

  private _filterSingleNodeRecursive(node: Resource, term: string): Resource | null {
    const isMatch = node.resourceId.toLowerCase().includes(term) || node.name.toLowerCase().includes(term);
    let filteredChildren: Resource[] | undefined = undefined;
    if (node.children && node.children.length > 0) {
      filteredChildren = node.children
        .map(child => this._filterSingleNodeRecursive(child, term))
        .filter((child): child is Resource => child !== null);
      if (filteredChildren.length === 0) filteredChildren = undefined;
    }

    if (isMatch || (filteredChildren && filteredChildren.length > 0)) {
      return {
        ...node,
        children: filteredChildren
      };
    }
    return null;
  }*/

  /*resources: Resource | undefined = undefined;

  onSelectionChange(event: MatCheckboxChange, resourceNode: Resource): void {
    const isSelected = event.checked;
    this.store.toggleSelection({
      resource: resourceNode,
      isSelected,
      selectionType: 'selectedInternalOrders'
    });
  };*/
}
