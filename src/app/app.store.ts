import { Injectable } from '@angular/core';
import {
  GetACalendarResponseFormatted,
  Resource,
  resourcesToSetWorkskills,
  workSkillItem,
  workSkills,
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
  switchMap, of, delay, forkJoin,
} from 'rxjs';
import { DataRange } from './types/plugin';
import { DialogService } from './services/dialog.service';
import {ResourceTreeService} from "./services/resource-tree.service";
import {ExcelExportService} from "./services/excel-export.service";
import dayjs from 'dayjs';

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

  // Selectors
  private readonly isLoading$ = this.select((state) => state.isLoading);

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
  readonly setResourcesTreePyme = this.updater<Resource[]>((state, resourcesTreePyme) => ({
    ...state,
    resourcesTreePyme,
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
  readonly toggleResidentialSelection = this.updater((state, {resource, isSelected}: {resource: Resource, isSelected: boolean}) => {
    let updatedSelectedResources: Resource[];

    if (isSelected) {
      const exists = state.selectedResidential.some(r => r.resourceId === resource.resourceId);
      if (!exists) {
        updatedSelectedResources = [...state.selectedResidential, resource];
      } else {
        updatedSelectedResources = state.selectedResidential;
      }
    } else {
      updatedSelectedResources = state.selectedResidential.filter(r => r.resourceId !== resource.resourceId)
    }

    return {
      ...state,
      selectedResidential: updatedSelectedResources
    }
  });
  readonly togglePymeSelection = this.updater((state, {resource, isSelected}: {resource: Resource, isSelected: boolean}) => {
    let updatedSelectedResources: Resource[];

    if (isSelected) {
      const exists = state.selectedPyme.some(r => r.resourceId === resource.resourceId);
      if (!exists) {
        updatedSelectedResources = [...state.selectedPyme, resource];
      } else {
        updatedSelectedResources = state.selectedPyme;
      }
    } else {
      updatedSelectedResources = state.selectedPyme.filter(r => r.resourceId !== resource.resourceId)
    }

    return {
      ...state,
      selectedPyme: updatedSelectedResources
    }
  });
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
      map(({ securedData, user }) => {
        const { ofscRestClientId, ofscRestSecretId, urlOFSC } = securedData;
        const { ulogin } = user;
        if (!ofscRestClientId || !ofscRestClientId || !urlOFSC) {
          throw new Error(
            'Los campos url, user y pass son requeridos para el correcto funcionamiento del plugin'
          );
        }
        this.ofsRestApi
          .setUrl(urlOFSC)
          .setCredentials({ user: ofscRestClientId, pass: ofscRestSecretId });
        /*const validLogin = this.login(ulogin, usersOfsc);*/
/*        if (validLogin) {
          this.ofsRestApi
            .setUrl(urlOFSC)
            .setCredentials({ user: ofscRestClientId, pass: ofscRestSecretId });
        } else {
          this.dialogService.invalid("Usuario sin permisos para acceder al plugin");
          EMPTY;
        }*/
      }),
      /*concatMap(async () => this.getResourcesTreeRaw()),*/
      concatMap(() => this.ofsRestApi.getAllResources()),
      tap((resourcesTreeRaw) => this.setResourcesTreeRaw(resourcesTreeRaw)),
      concatMap((resourcesTreeRaw) => resourcesTreeRaw && this.handleResourcesTree(resourcesTreeRaw)),
      tap(() => this.setIsLoading(false)),
    )
  );

  private readonly getResourcesTreeRaw = this.effect(($) =>
    $.pipe(
      tap(() => this.setIsLoading(true)),
      concatMap(() => this.ofsRestApi.getAllResources()),
      tap((resourcesTreeRaw) => this.setResourcesTreeRaw(resourcesTreeRaw)),
      concatMap((resourcesTreeRaw) => resourcesTreeRaw && this.handleResourcesTree(resourcesTreeRaw)),
      tap(() => Promise.resolve()),
      tap(() => this.setIsLoading(false))
    )
  );

  private readonly residentialToPyme = this.effect(($) => $.pipe(
    tap(() => this.setIsLoading(true)),
    map(() => this.handleWorkSkillsToPyme(this.get().selectedResidential)),
    concatMap((resource) => this.ofsRestApi.setWorkSkills(resource[0])),
    switchMap(() => this.calendarResource(true)),
    tap(() => this.dialogService.success(`Recursos movidos exitosamente a PYME : ${this.get().selectedResidential.length}`)),
    tap(() => this.clearBuffer()),
    /*tap(() => this.getResourcesTreeRaw()),*/
    concatMap(() => this.ofsRestApi.getAllResources()),
    concatMap((resourcesTreeRaw) => resourcesTreeRaw && this.handleResourcesTree(resourcesTreeRaw)),
    tap(() => this.setIsLoading(false)),
  ));

  private readonly pymeToResidential = this.effect(($) => $.pipe(
    tap(() => this.setIsLoading(true)),
    map(() => this.handleWorkSkillsToResidential(this.get().selectedPyme)),
    switchMap(resources => {
      const hasInvalidResource = resources.some(resource => resource.workSkills.length === 0);
      if (hasInvalidResource) {
        this.dialogService.error(`Error: Un recurso seleccionado no cuenta con habilidades para restaurar.`);
        this.setIsLoading(false);
        this.clearBuffer();
        this.getResourcesTreeRaw();
        return EMPTY;
      }
      else {
        return of(resources);
      }
    }),
    concatMap((resource) => this.ofsRestApi.setWorkSkills(resource[0])),
    switchMap(() => this.calendarResource(false)),
    tap(() => this.dialogService.success(`Recursos movidos exitosamente a Residencial : ${this.get().selectedPyme.length}`)),
    tap(() => this.clearBuffer()),
    concatMap(() => this.ofsRestApi.getAllResources()),
    concatMap((resourcesTreeRaw) => resourcesTreeRaw && this.handleResourcesTree(resourcesTreeRaw)),
    tap(() => this.setIsLoading(false)),
  ));

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
  private login(ulogin: string, usersOfsc: string): boolean {
    const validUsers = usersOfsc.trim().split(";");
    const valid = validUsers.find(user => user === ulogin);
    return !!valid;
  };

  private handleResourcesTree(resourcesTreeRaw: Resource[]) {
    const cleanedResourcesTreeRaw = resourcesTreeRaw.filter((resource) =>
      resource.status === 'active' && resource.organization === 'default');
    const internalOrders = cleanedResourcesTreeRaw.filter((resource) => resource.XR_PERMISO_ACT_INT === 1);
    const idsInternalOrders = new Set(internalOrders.map(r => r.resourceId));
    /*const internalOrdersTree = this.resourceTreeService.buildTree(internalOrders);*/
    /*const pymeTree = cleanedResourcesTreeRaw.filter((resource) =>
      resource.workSkills?.items &&
      resource.workSkills?.items?.some(skill => skill.workSkill === 'PYME' && dayjs(skill.endDate)>=dayjs()));*/
    /*const idsPyme = new Set(pymeTree.map(r => r.resourceId));*/
    /*const residencial = cleanedResourcesTreeRaw.filter(resource => !idsPyme.has(resource.resourceId));*/
    const residencial = cleanedResourcesTreeRaw.filter(resource => !idsInternalOrders.has(resource.resourceId));
    /*const residencialTree = this.resourceTreeService.buildTree(residencial);*/
    const residencialTree = this.resourceTreeService.buildTree(residencial);
    const internalOrdersTree = this.resourceTreeService.buildForest(internalOrders);
    residencialTree && this.setResourcesTreeResidencial(residencialTree);
    /*pymeTree && this.setResourcesTreePyme(pymeTree);*/
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

  private handleWorkSkillsToPyme(selectedResources: Resource[]): resourcesToSetWorkskills[] {
    const {selectedRange} = this.get();
    const oneDayAfter = dayjs(selectedRange.to).add(1, 'day').format("YYYY-MM-DD");
    return selectedResources.map(resource => {
      if (!resource.workSkills?.items || resource.workSkills.items.length === 0) {
        return {
          resourceId: resource.resourceId,
          workSkills: []
        }
      }

      const skillsMap = new Map<string, workSkillItem>();

      resource.workSkills.items.forEach(skill => !skill.endDate && skillsMap.set(skill.workSkill, skill));

      const workSkills: workSkills[] = Array.from(skillsMap.values()).map(item => ({
        workSkill: item.workSkill,
        ratio: item.ratio,
        startDate: oneDayAfter
      }));

      workSkills.push({
        workSkill: 'PYME',
        ratio: 100,
        startDate: selectedRange.from!,
        endDate: selectedRange.to!
      });

      const resourceData: resourcesToSetWorkskills = {
        resourceId: resource.resourceId,
        workSkills: workSkills
      };
      return resourceData;
    }).filter(resourceData => resourceData.workSkills.length > 0);
  }

  private handleWorkSkillsToResidential(selectedResources: Resource[]): resourcesToSetWorkskills[] {
    const today = dayjs();

    return selectedResources.map(resource => {
      if (!resource.workSkills?.items || resource.workSkills.items.length === 0) {
        return {
          resourceId: resource.resourceId,
          workSkills: []
        }
    }

      const skillsMap = new Map<string, workSkillItem>();
      resource.workSkills.items.forEach(skill => skill.workSkill !== 'PYME' && skillsMap.set(skill.workSkill, skill));

      const workSkills: workSkills[] = Array.from(skillsMap.values()).map(item => ({
        workSkill: item.workSkill,
        ratio: item.ratio,
        startDate: today.format('YYYY-MM-DD')
      }));

      const resourceData: resourcesToSetWorkskills = {
        resourceId: resource.resourceId,
        workSkills: workSkills
      };

      return resourceData;
    });
  }

  private handleTechniciansInternalOrders(selectedResources: Resource[]): Resource[] {
    const resourcesToUpdate = selectedResources.filter(resource => resource.resourceType === "TEC");
    this.setResourcesToUpdate(resourcesToUpdate);
    return resourcesToUpdate;
  }

  private calendarResource(toPyme: boolean) {
    const { selectedRange } = this.get();
    const today = dayjs();
    if (toPyme) {
      const {selectedResidential} = this.get();
      selectedResidential.map(resource => {
        this.ofsRestApi.getACalendar(resource.resourceId, {dateFrom: selectedRange.from!, dateTo: selectedRange.to!}).subscribe(calendarResource => {
          if (calendarResource) {
            const calendarResourceArray: GetACalendarResponseFormatted[] = Object.entries(calendarResource).flatMap(([date, categorie]) => {
              return Object.values(categorie).map(details => {
                return {
                  date: date,
                  ...(details as object)
                }
              })
            });
            calendarResourceArray.map(({date, recordType}) => {
              if (recordType === "non-working") {
                this.ofsRestApi.
                  setAWorkSchedule(resource.resourceId, {
                    startDate: date,
                    endDate: date,
                    comments: "Operaciones PyME API",
                    isWorking: true,
                    shiftLabel: "09:00-16:00",
                    recordType: "extra_shift",
                    recurrence: {
                      recurrenceType: "daily",
                      recurEvery: 1
                    }
                })
                  .subscribe(response => {
                    if (response) {
                      return Promise.resolve();
                    } else {
                      throw new Error(
                        'Hubo un error al establecer el horario de trabajo del recurso'
                      );
                    }
                })
              }
            });
          }
        })
      });
    } else {
      const {selectedPyme} = this.get();
      const daysInFuture = today.add(5, 'days').format("YYYY-MM-DD");
      selectedPyme.map(resource => {
        this.ofsRestApi.getACalendar(resource.resourceId, {dateFrom: today.format("YYYY-MM-DD"), dateTo: daysInFuture}).subscribe(calendarResource => {
          if (calendarResource) {
            const calendarResourceArray: GetACalendarResponseFormatted[] = Object.entries(calendarResource).flatMap(([date, categorie]) => {
              return Object.values(categorie).map(details => {
                return {
                  date: date,
                  ...(details as object)
                }
              })
            });
            calendarResourceArray.map(({date, recordType, shiftLabel, comments}) => {
              if (comments?.includes("Operaciones PyME") && shiftLabel === "09:00-16:00") {
                this.ofsRestApi.setAWorkSchedule(resource.resourceId, {
                  startDate: date,
                  endDate: date,
                  comments: "Retorno Residencial API",
                  isWorking: false,
                  recordType: "non-working",
                  shiftType: "regular",
                  nonWorkingReason: "DÍA_LIBRE",
                  recurrence: {
                    recurrenceType: "daily",
                    recurEvery: 1
                  }
                }).subscribe(response => {
                  if (response) {
                    return Promise.resolve();
                  } else {
                    throw new Error('Hubo un error al establecer el horario de trabajo del recurso de Residencial a PyME')
                    }
                  }
                )
              }
            });
          }
        })
      });
    }
    return of(true);
  }

  private clearBuffer() {
    /*this.setSelectedRange({from: null, to: null, valid: false});*/
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

  private handleError(err: Error) {
    console.log('Error', err);
    alert('Hubo un error\n' + err.message || 'Error desconocido');
    return EMPTY;
  }
}
