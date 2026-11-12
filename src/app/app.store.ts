import { Injectable } from '@angular/core';
import {
  Resource,
  User,
  UserOption,
  workSkillItem,
  expandedWorkZoneItem,
  expandedWorkScheduleItem,
  expandedInventoryItem
} from './types/ofs-rest-api';
import { ComponentStore } from '@ngrx/component-store';
import { OfsApiPluginService } from './services/ofs-api-plugin.service';
import { OfsRestApiService } from './services/ofs-rest-api.service';
import { Message } from './types/plugin-api';
import {
  EMPTY,
  concatMap,
  map,
  tap,
  switchMap, delay, forkJoin, catchError, Subject, filter,
} from 'rxjs';
import { DataRange } from './types/plugin';
import { DialogService } from './services/dialog.service';
import { ResourceTreeService } from "./services/resource-tree.service";
import { ExcelExportService } from "./services/excel-export.service";
import { TokenService } from './services/aws.service';

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
  selectedCollaboration: Resource[];
  allowInternalOrdersProcess?: boolean;
  resourcesToUpdate?: Resource[];
  availableReportDates?: string[];
  users?: UserOption[];
}

type SelectionType = 'selectedResidential' | 'selectedPyme' | 'selectedInternalOrders' | 'selectedCollaboration';

export interface ResourceTreeDownloadParams {
  businessLine: string;
  includeWorkZones: boolean;
  includeWorkSkills: boolean;
  includeWorkSchedules: boolean;
  includeInventories: boolean;
}

const initialState: State = {
  isLoading: false,
  selectedRange: { from: null, to: null, valid: false },
  intervalDates: [],
  validatedDates: [],
  selectedResidential: [],
  selectedPyme: [],
  selectedInternalOrders: [],
  selectedCollaboration: []
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
    private readonly excelExportService: ExcelExportService,
    private readonly awsService: TokenService
  ) {
    super(initialState);
    this.handleOpenMessage(this.ofsPluginApi.openMessage$);
    this.ofsPluginApi.ready();
  }

  private readonly downloadCompleted = new Subject<void>();
  readonly downloadCompleted$ = this.downloadCompleted.asObservable();

  //View Model
  private readonly resourceTreeInternalOrdersGrouped$ = this.select(
    this.select(state => state.resourcesTreeInternalOrders),
    this.select(state => state.resourcesTreeRaw),
    (internalOrdersForest, allResources) => {
      if (!internalOrdersForest || internalOrdersForest.length === 0 || !allResources) {
        return null;
      }
      return this.resourceTreeService.groupForestByParentId(internalOrdersForest, allResources, 'Nodo virtual Izzi')
    }
  );

  public readonly vm$ = this.select(this.state$, this.resourceTreeInternalOrdersGrouped$, (state, resourceTreeInternalOrdersGrouped) => ({
    ...state,
    resourcesTreeInternalOrders: resourceTreeInternalOrdersGrouped
  }));

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
  readonly toggleSelection = this.updater((state, { resource, isSelected, selectionType }: { resource: Resource, isSelected: boolean, selectionType: SelectionType }) => {
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
  readonly setAvailableReportDates = this.updater<string[]>((state, availableReportDates) => ({
    ...state,
    availableReportDates
  }));
  readonly setUsers = this.updater<UserOption[]>((state, users) => ({
    ...state,
    users
  }));

  // Effects
  private readonly handleOpenMessage = this.effect<Message>(($) =>
    $.pipe(
      tap(() => this.setIsLoading(true)),
      map(({ securedData }) => {
        const { ofscRestClientId, ofscRestSecretId, urlOFSC, urlToken, aws_user, aws_pwd, aws_url, awsApiKey } = securedData;
        if (!ofscRestClientId || !ofscRestClientId || !urlOFSC || !urlToken || !aws_user || !aws_pwd || !aws_url || !awsApiKey) {
          throw new Error(
            'Los campos url, user y pass son requeridos para el correcto funcionamiento del plugin'
          );
        }
        this.ofsRestApi
          .setUrl(urlOFSC)
          .setCredentials({ user: ofscRestClientId, pass: ofscRestSecretId });
        this.awsService.setTokenUrl(urlToken).setBaseUrl(aws_url).setCredentials({ aws_user: aws_user, aws_pass: aws_pwd, aws_api_key: awsApiKey });
      }),
      concatMap(() => this.awsService.fetchToken()),
      tap(response => {
        if (response.status !== 200) {
          throw new Error(`Error al obtener el token: ${response.detail}`);
        }
        this.awsService.setToken(response.token);
      }),
      concatMap(() => this.awsService.getAvailableDates()),
      tap(response => {
        if (!response || !Array.isArray(response.dates)) {
          throw new Error('Error al obtener las fechas disponibles para el reporte.');
        }
        this.setAvailableReportDates(response.dates);
      }),
      tap(() => console.log('Fechas disponibles para el reporte:', this.get().availableReportDates)),
      concatMap(() => this.ofsRestApi.getAllResources()),
      tap((resourcesTreeRaw) => this.setResourcesTreeRaw(resourcesTreeRaw)),
      concatMap((resourcesTreeRaw) => resourcesTreeRaw && this.handleResourcesTree(resourcesTreeRaw)),
      concatMap(() => this.ofsRestApi.getAllUsers()),
      tap((users: User[]) => this.setUsers(
        users.filter(u => u.login).map(u => ({ login: u.login, name: u.name }))
      )),
      tap(() => this.setIsLoading(false)),
    )
  );

  private readonly handleResourcesInternalOrders = this.effect(($) => $.pipe(
    tap(() => this.setIsLoading(true)),
    switchMap(() => {
      const { allowInternalOrdersProcess, resourcesToUpdate } = this.get();
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
      const { resourcesTreeRaw } = this.get();
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

  public readonly handleExportCollaborationData = this.effect<Resource[]>((resources$) => resources$.pipe(
    tap(() => this.setIsLoading(true)),
    switchMap((resources) => {
      if (!resources || resources.length === 0) {
        this.dialogService.error('No hay recursos seleccionados para exportar.');
        this.setIsLoading(false);
        return EMPTY;
      }

      const dataToExport = resources.map(resource => ({
        'ID Recurso': resource.resourceId,
        'ID Recurso padre': resource.parentResourceId,
        'Nombre': resource.name,
        'Tipo': resource.resourceType,
        'Organización': resource.organization,
        'Estado': resource.status,
        'Permiso Actividades internas': resource.XR_PERMISO_ACT_INT,
      }));

      return this.excelExportService.exportAsExcelFile(dataToExport, 'Reporte_Colaboracion');
    }),
    tap(() => this.setIsLoading(false))
  ))

  public sendCloseMessage = this.effect<Partial<Message>>((data$) =>
    data$.pipe(tap((data) => this.ofsPluginApi.close(data)))
  );

  public readonly handleQuickDownload = this.effect<string>((date$) =>
    date$.pipe(
      tap(() => this.setIsLoading(true)),
      switchMap((date) => this.awsService.downloadReport(date).pipe(
        map((csv) => ({ csv, date }))
      )),
      tap(({ csv }) => {
        if (!this.hasCsvData(csv)) {
          this.dialogService.info('No se encontró información con los parámetros seleccionados. Intentar nuevamente', 'Sin información');
          this.setIsLoading(false);
          this.downloadCompleted.next();
        }
      }),
      filter(({ csv }) => this.hasCsvData(csv)),
      tap(({ csv, date }) => {
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const [yyyy, mm, dd] = date.split('-');
        link.download = `${dd}-${mm}-${yyyy}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        link.remove();
      }),
      tap(() => this.dialogService.success(
        'El reporte se ha generado exitosamente y está listo para descargar',
        'Reporte generado'
      )),
      tap(() => this.setIsLoading(false)),
      tap(() => this.downloadCompleted.next()),
      catchError(() => {
        this.dialogService.error('Error al descargar el reporte.');
        this.setIsLoading(false);
        return EMPTY;
      })
    )
  );

  public readonly handleCustomDownload = this.effect<{ user: string; chatType: string; hour: string }>((params$) =>
    params$.pipe(
      tap(() => this.setIsLoading(true)),
      map((params) => {
        const now = new Date();
        const date = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
        return { date, params };
      }),
      switchMap(({ date, params }) => this.awsService.downloadCustomReport(date, params).pipe(
        map((csv) => ({ csv, date }))
      )),
      tap(({ csv }) => {
        if (!this.hasCsvData(csv)) {
          this.dialogService.info('No se encontró información para los parámetros seleccionados.', 'Sin información');
          this.setIsLoading(false);
          this.downloadCompleted.next();
        }
      }),
      filter(({ csv }) => this.hasCsvData(csv)),
      tap(({ csv, date }) => {
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const [yyyy, mm, dd] = date.split('-');
        link.download = `${dd}-${mm}-${yyyy}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        link.remove();
      }),
      tap(() => this.dialogService.success(
        'El reporte se ha generado exitosamente y está listo para descargar',
        'Reporte generado'
      )),
      tap(() => this.setIsLoading(false)),
      tap(() => this.downloadCompleted.next()),
      catchError(() => {
        this.dialogService.error('Error al descargar el reporte.');
        this.setIsLoading(false);
        return EMPTY;
      })
    )
  );

  public readonly handleDownloadResourceTree = this.effect<ResourceTreeDownloadParams>((params$) =>
    params$.pipe(
      tap(() => this.setIsLoading(true)),
      map(({ businessLine, includeWorkZones, includeWorkSkills, includeWorkSchedules, includeInventories }) => {
        const resourceId = businessLine === 'CODI' ? 'GR_CODI_CUAD_EMER_PE' : 'IZZI_GPO';
        const expand = [
          includeWorkZones ? 'workZones' : '',
          includeWorkSkills ? 'workSkills' : '',
          includeWorkSchedules ? 'workSchedules' : '',
          includeInventories ? 'inventories' : ''
        ].filter(Boolean).join(',');
        return { resourceId, expand, businessLine, includeWorkZones, includeWorkSkills, includeWorkSchedules, includeInventories };
      }),
      switchMap(({ resourceId, expand, businessLine, includeWorkZones, includeWorkSkills, includeWorkSchedules, includeInventories }) =>
        this.ofsRestApi.getAllDescendants(resourceId, {
          expand,
          fields: 'resourceId,name,resourceType,parentResourceId,status,organization'
        }).pipe(
          map((resources) => ({ resources, businessLine, includeWorkZones, includeWorkSkills, includeWorkSchedules, includeInventories }))
        )
      ),
      switchMap(({ resources, businessLine, includeWorkZones, includeWorkSkills, includeWorkSchedules, includeInventories }) => {
        if (!resources || resources.length === 0) {
          this.dialogService.info('No se encontró información para los parámetros seleccionados.', 'Sin información');
          this.setIsLoading(false);
          this.downloadCompleted.next();
          return EMPTY;
        }
        const forest = this.resourceTreeService.buildForest(resources);
        const flattened = this.flattenForestPreOrder(forest);
        const dataToExport = flattened.map(({ resource, level }) => ({
          'Nivel': level,
          'ID Recurso': resource.resourceId,
          'ID Recurso padre': resource.parentResourceId,
          'Nombre': resource.name,
          'Tipo': resource.resourceType,
          'Organización': resource.organization,
          'Estado': resource.status,
          ...(includeWorkZones ? { 'Zonas de trabajo': this.formatExpandedField(resource.workZones, 'workZones') } : {}),
          ...(includeWorkSkills ? { 'Habilidades': this.formatExpandedField(resource.workSkills, 'workSkills') } : {}),
          ...(includeWorkSchedules ? { 'Calendario': this.formatExpandedField(resource.workSchedules, 'workSchedules') } : {}),
          ...(includeInventories ? { 'Inventarios': this.formatExpandedField(resource.inventories, 'inventories') } : {})
        }));
        return this.excelExportService.exportAsExcelFile(dataToExport, `Arbol_Recursos_${businessLine}`);
      }),
      tap(() => this.dialogService.success(
        'El árbol de recursos se ha exportado exitosamente.',
        'Exportación exitosa'
      )),
      tap(() => this.setIsLoading(false)),
      tap(() => this.downloadCompleted.next()),
      catchError(() => {
        this.dialogService.error('Error al descargar el árbol de recursos.');
        this.setIsLoading(false);
        return EMPTY;
      })
    )
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
    const { selectedResidential, selectedInternalOrders } = this.get();
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
      selectedCollaboration: [],
      resourcesTreeRaw: [],
      resourcesTreeResidencial: undefined,
      resourcesTreePyme: [],
      resourcesTreeInternalOrders: [],
      allowInternalOrdersProcess: undefined,
      resourcesToUpdate: []
    });
  }

  private hasCsvData(csv: string): boolean {
    const lines = csv.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    return lines.length > 1;
  }

  private formatExpandedField(value: unknown, type: 'workZones' | 'workSkills' | 'workSchedules' | 'inventories'): string {
    if (!value) {
      return '';
    }
    const expanded = value as { items?: unknown[]; links?: unknown[] };
    if (expanded.items?.length) {
      let cell = '';
      switch (type) {
        case 'workZones':
          cell = (expanded.items as expandedWorkZoneItem[])
            .map(item => item.workZone)
            .filter((zone): zone is string => !!zone)
            .join(', ');
          break;
        case 'workSkills':
          cell = (expanded.items as workSkillItem[])
            .map(item => item.workSkill)
            .filter(Boolean)
            .join(', ');
          break;
        case 'workSchedules': {
          const labels: string[] = [];
          (expanded.items as expandedWorkScheduleItem[]).forEach(item => {
            if (item.shiftLabel && !labels.includes(item.shiftLabel)) {
              labels.push(item.shiftLabel);
            }
            if (item.scheduleLabel && !labels.includes(item.scheduleLabel)) {
              labels.push(item.scheduleLabel);
            }
            (item.scheduleShifts || []).forEach(shift => {
              if (shift.shiftLabel && !labels.includes(shift.shiftLabel)) {
                labels.push(shift.shiftLabel);
              }
            });
          });
          cell = labels.join(', ');
          break;
        }
        case 'inventories':
          cell = (expanded.items as expandedInventoryItem[])
            .map(item => `${item.inventoryType}${item.serialNumber ? ` (${item.serialNumber})` : ''}`)
            .join(', ');
          break;
      }
      return cell.length > 32000 ? `${cell.slice(0, 32000)}...` : cell;
    }
    if (expanded.links?.length) {
      const emptyMessages: Record<string, string> = {
        workZones: 'Sin restricción de zonas',
        workSkills: 'Sin habilidades asignadas',
        workSchedules: 'Sin calendario asignado',
        inventories: 'Sin inventario asignado'
      };
      return emptyMessages[type] || '';
    }
    return '';
  }

  private flattenForestPreOrder(forest: Resource[], level = 0): {resource: Resource, level: number}[] {
    const result: {resource: Resource, level: number}[] = [];
    for (const node of forest) {
      result.push({resource: node, level});
      if (node.children?.length) {
        result.push(...this.flattenForestPreOrder(node.children, level + 1));
      }
    }
    return result;
  }
}
