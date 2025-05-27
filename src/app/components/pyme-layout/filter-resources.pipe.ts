import { Pipe, PipeTransform } from '@angular/core';
import {Resource} from "../../types/ofs-rest-api";

@Pipe({
  name: 'filterResources',
  standalone: true
})
export class FilterResourcesPipe implements PipeTransform {
  transform(items: Resource[] | null | undefined, searchText: string): Resource[] {
    if (!items) {
      return [];
    }
    if (!searchText || searchText.trim() === '') {
      return items;

    }
    const lowerSearchText = searchText.toLowerCase();
    return items.filter(item => {
      return item.name && item.name.toLowerCase().includes(lowerSearchText);
    })
  }

}
