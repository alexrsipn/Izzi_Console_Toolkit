import { Injectable } from '@angular/core';
import {Resource} from "../types/ofs-rest-api";

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

  buildForest(resources: Resource[]): Resource[] {
    const map = new Map<string, Resource>();
    const roots: Resource[] = [];

    resources.forEach(resource => {
      map.set(resource.resourceId, { ...resource, children: [] });
    });

    resources.forEach(resource => {
      const node = map.get(resource.resourceId)!;
      if (resource.parentResourceId) {
        const parent = map.get(resource.parentResourceId);
        if (parent) {
          parent.children!.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }
}
