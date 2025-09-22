import { Injectable } from '@angular/core';
import { Resource } from './types/ofs-rest-api';
import { ComponentStore } from '@ngrx/component-store';
import { OfsApiPluginService } from './services/ofs-api-plugin.service';
import { OfsRestApiService } from './services/ofs-rest-api.service';
import { Message } from './types/plugin-api';
import {
  EMPTY,
  concatMap,
  map,
  tap,
  switchMap, delay, forkJoin,
} from 'rxjs';
import { DataRange } from './types/plugin';
import { DialogService } from './services/dialog.service';
import {ResourceTreeService} from "./services/resource-tree.service";
import {ExcelExportService} from "./services/excel-export.service";

interface State {
  isLoading: boolean;
  selectedRange: DataRange;
  intervalDates: string[];
  validatedDates: string[];
  resourcesTreeRaw?: Resource[];
  resourcesTreeResidencial?: Resource;
  resourcesTreePyme?: Resource[];
  resourcesTreeInternalOrders?: Resource[];
  selectedResidential: Resource[];
  selectedPyme: Resource[];
  selectedInternalOrders: Resource[];
  allowInternalOrdersProcess?: boolean;
  resourcesToUpdate?: Resource[];
}

type SelectionType = 'selectedResidential' | 'selectedPyme' | 'selectedInternalOrders';

const initialState: State = {
  isLoading: false,
  selectedRange: { from: null, to: null, valid: false },
  intervalDates: [],
  validatedDates: [],
  selectedResidential: [],
  selectedPyme: [],
  selectedInternalOrders: [],
};

@Injectable({
  providedIn: 'root',
})
export class AppStore extends ComponentStore<State> {
  constructor(
    private readonly ofsPluginApi: OfsApiPluginService,
    private readonly ofsRestApi: OfsRestApiService,
    private readonly dialogService: DialogService,
    private readonly resourceTreeService: ResourceTreeService,
    private readonly excelExportService: ExcelExportService
  ) {
    super(initialState);
    this.handleOpenMessage(this.ofsPluginApi.openMessage$);
    this.ofsPluginApi.ready();
  }

  //View Model
  public readonly vm$ = this.select((state) => state)

  // Updaters
  readonly setSelectedRange = this.updater<DataRange>(
    (state, selectedRange) => ({ ...state, selectedRange })
  );
  readonly setIsLoading = this.updater<boolean>((state, isLoading) => ({
    ...state,
    isLoading,
  }));
  readonly setResourcesTreeRaw = this.updater<Resource[]>((state, resourcesTreeRaw) => ({
    ...state,
    resourcesTreeRaw
  }));
  readonly setResourcesTreeResidencial = this.updater<Resource>((state, resourcesTreeResidencial) => ({
    ...state,
    resourcesTreeResidencial,
  }));
  readonly setResourcesTreeInternalOrders = this.updater<Resource[]>((state, resourcesTreeInternalOrders) => ({
    ...state,
    resourcesTreeInternalOrders,
  }));
  readonly toggleSelection = this.updater((state, {resource, isSelected, selectionType}: {resource: Resource, isSelected: boolean, selectionType: SelectionType}) => {
    const currentSelection = state[selectionType];
    let updatedSelection: Resource[];

    if (isSelected) {
      const exists = currentSelection.some(r => r.resourceId === resource.resourceId);
      if (!exists) {
        updatedSelection = [...currentSelection, resource];
      } else {
        updatedSelection = currentSelection;
      }
    } else {
      updatedSelection = currentSelection.filter(r => r.resourceId !== resource.resourceId);
    }

    return {
      ...state,
      [selectionType]: updatedSelection
    }
  })
  readonly setAllowInternalOrderProcess = this.updater<boolean>((state, allowInternalOrdersProcess) => ({
    ...state,
    allowInternalOrdersProcess,
  }));
  readonly setResourcesToUpdate = this.updater<Resource[]>((state, resourcesToUpdate) => ({
    ...state,
    resourcesToUpdate
  }));

  // Effects
  private readonly handleOpenMessage = this.effect<Message>(($) =>
    $.pipe(
      tap(() => this.setIsLoading(true)),
      map(({ securedData }) => {
        const { ofscRestClientId, ofscRestSecretId, urlOFSC } = securedData;
        if (!ofscRestClientId || !ofscRestClientId || !urlOFSC) {
          throw new Error(
            'Los campos url, user y pass son requeridos para el correcto funcionamiento del plugin'
          );
        }
        this.ofsRestApi
          .setUrl(urlOFSC)
          .setCredentials({ user: ofscRestClientId, pass: ofscRestSecretId });
      }),
      concatMap(() => this.ofsRestApi.getAllResources()),
      tap((resourcesTreeRaw) => this.setResourcesTreeRaw(resourcesTreeRaw)),
      concatMap((resourcesTreeRaw) => resourcesTreeRaw && this.handleResourcesTree(resourcesTreeRaw)),
      tap(() => this.setIsLoading(false)),
    )
  );

  private readonly handleResourcesInternalOrders = this.effect(($) => $.pipe(
    tap(() => this.setIsLoading(true)),
    switchMap(() => {
      const {allowInternalOrdersProcess, resourcesToUpdate} = this.get();
      if (!resourcesToUpdate || resourcesToUpdate.length === 0) {
        return EMPTY;
      }
      const updateObservables = resourcesToUpdate.map(resource => this.ofsRestApi.updateAResourceInternalOrders(resource.resourceId, allowInternalOrdersProcess!));
      return forkJoin(updateObservables);
    }),
    tap(() => this.dialogService.success(`Recursos actualizados exitosamente: ${this.get().resourcesToUpdate!.length}`)),
    tap(() => this.clearBuffer()),
    delay(500),
    concatMap(() => this.ofsRestApi.getAllResources()),
    tap((resourcesTreeRaw) => this.setResourcesTreeRaw(resourcesTreeRaw)),
    concatMap((resourcesTreeRaw) => resourcesTreeRaw && this.handleResourcesTree(resourcesTreeRaw)),
    tap(() => this.setIsLoading(false))
  ));

  public readonly handleExportData = this.effect<void>(($) => $.pipe(
    tap(() => this.setIsLoading(true)),
    switchMap(() => {
      const {resourcesTreeRaw} = this.get();
      if (!resourcesTreeRaw || resourcesTreeRaw.length === 0) {
        this.dialogService.error('No hay datos para exportar.');
        this.setIsLoading(false);
        return EMPTY;
      }

      const dataToExport = resourcesTreeRaw.filter((resource) => resource.organization === "default" && resource.status === "active" && resource.resourceType === "TEC").map(resource => ({
        'ID Recurso': resource.resourceId,
        'ID Recurso padre': resource.parentResourceId,
        'Nombre': resource.name,
        'Tipo': resource.resourceType,
        'Organizacion': resource.organization,
        'Estado': resource.status,
        'Permiso Actividades internas': resource.XR_PERMISO_ACT_INT,
      }));

      return this.excelExportService.exportAsExcelFile(dataToExport, 'Reporte_Recursos_Internos');
    }),
    tap(() => this.setIsLoading(false))
  ))

  public sendCloseMessage = this.effect<Partial<Message>>((data$) =>
    data$.pipe(tap((data) => this.ofsPluginApi.close(data)))
  );

  // Actions
  private handleResourcesTree(resourcesTreeRaw: Resource[]) {
    const cleanedResourcesTreeRaw = resourcesTreeRaw.filter((resource) =>
      resource.status === 'active' && resource.organization === 'default');
    const internalOrders = cleanedResourcesTreeRaw.filter((resource) => resource.XR_PERMISO_ACT_INT === 1);
    const idsInternalOrders = new Set(internalOrders.map(r => r.resourceId));
    const residencial = cleanedResourcesTreeRaw.filter(resource => !idsInternalOrders.has(resource.resourceId));
    const residencialTree = this.resourceTreeService.buildTree(residencial);
    const internalOrdersTree = this.resourceTreeService.buildForest(internalOrders);
    residencialTree && this.setResourcesTreeResidencial(residencialTree);
    internalOrdersTree && this.setResourcesTreeInternalOrders(internalOrdersTree);
    return Promise.resolve(internalOrdersTree);
  };

  public confirmInternalOrdersCreation(fromResourceTree: boolean) {
    const {selectedResidential, selectedInternalOrders} = this.get();
    const resources = fromResourceTree ? this.handleTechniciansInternalOrders(selectedResidential) : this.handleTechniciansInternalOrders(selectedInternalOrders);
    const resourcesCount = resources.length;
    this.setAllowInternalOrderProcess(fromResourceTree);
    fromResourceTree ?
      this.dialogService.confirm('Denegar actividades internas', `¿Seguro que deseas denegar a ${resourcesCount} ${resourcesCount > 1 ? 'recursos' : 'recurso'} agregar actividades internas?`).subscribe(result => result! && this.handleResourcesInternalOrders())
      :
      this.dialogService.confirm('Permitir actividades internas', `¿Seguro que deseas permitir a ${resourcesCount} ${resourcesCount > 1 ? 'recursos' : 'recurso'} agregar actividades internas?`).subscribe(result => result! && this.handleResourcesInternalOrders())
  };

  private handleTechniciansInternalOrders(selectedResources: Resource[]): Resource[] {
    const resourcesToUpdate = selectedResources.filter(resource => resource.resourceType === "TEC");
    this.setResourcesToUpdate(resourcesToUpdate);
    return resourcesToUpdate;
  }

  private clearBuffer() {
    this.patchState({
      selectedResidential: [],
      selectedPyme: [],
      selectedInternalOrders: [],
      resourcesTreeRaw: [],
      resourcesTreeResidencial: undefined,
      resourcesTreePyme: [],
      resourcesTreeInternalOrders: [],
      allowInternalOrdersProcess: undefined,
      resourcesToUpdate: []
    });
  }
}
