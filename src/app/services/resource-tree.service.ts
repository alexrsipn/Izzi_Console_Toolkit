import { Injectable } from '@angular/core';
import {Resource} from "../types/ofs-rest-api";

/*export interface ResourceNode {
  resourceId: string;
  parentResourceId?: string;
  resourceType: string;
  organization: string;
  status: string;
  name: string;
  children?: ResourceNode[];
}*/

@Injectable({
  providedIn: 'root'
})
export class ResourceTreeService {
  constructor() {}

  buildTree(resources: Resource[]): Resource | null {
    const map = new Map<string, Resource>();
    let root: Resource | null = null;

    resources.forEach(resource => {
      map.set(resource.resourceId, { ...resource, children: [] });
    });

    resources.forEach(resource => {
      if (resource.parentResourceId) {
        const parent = map.get(resource.parentResourceId);
        if (parent) {
          parent.children!.push(map.get(resource.resourceId)!);
        }
      } else {
        root = map.get(resource.resourceId) || null;
      }
    });

    return root;
  }
}
