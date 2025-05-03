import { Injectable } from '@angular/core';
import {
  ApptManualMove,
  GetADailyExtractFileJSONResponse,
  GetAListDailyExtractFilesDateResponse,
  ListDailyExtractValidation, Resource, resourcesToSetWorkskills, workSkillItem, workSkillItems, workSkills,
} from './types/ofs-rest-api';
import { ComponentStore } from '@ngrx/component-store';
import { OfsApiPluginService } from './services/ofs-api-plugin.service';
import { OfsRestApiService } from './services/ofs-rest-api.service';
import { Message } from './types/plugin-api';
import {
  EMPTY,
  concatMap,
  from,
  map,
  tap,
  toArray, switchMap, of,
} from 'rxjs';
import { DataRange } from './types/plugin';
import { parseStringPromise } from 'xml2js';
import { DialogService } from './services/dialog.service';
import {ResourceTreeService} from "./services/resource-tree.service";
import dayjs from 'dayjs';

interface State {
  isLoading: boolean;
  selectedRange: DataRange;
  intervalDates: string[];
  listDailyExtract?: ListDailyExtractValidation[];
  validatedDates: string[];
  resourcesTreeResidencial?: Resource;
  resourcesTreePyme?: Resource[];
  selectedResidential: Resource[];
  selectedPyme: Resource[];
}

const initialState: State = {
  isLoading: false,
  selectedRange: { from: null, to: null, valid: false },
  intervalDates: [],
  validatedDates: [],
  selectedResidential: [],
  selectedPyme: []
};

/*const chunkSize = 50000;*/

@Injectable({
  providedIn: 'root',
})
export class AppStore extends ComponentStore<State> {
  constructor(
    private readonly ofsPluginApi: OfsApiPluginService,
    private readonly ofsRestApi: OfsRestApiService,
    /*private readonly exportService: ExportService,*/
    private readonly dialogService: DialogService,
    private readonly resourceTreeService: ResourceTreeService,
  ) {
    super(initialState);
    this.handleOpenMessage(this.ofsPluginApi.openMessage$);
    this.ofsPluginApi.ready();
  }

  // Selectors
  private readonly isLoading$ = this.select((state) => state.isLoading);
  private readonly isDateRangeSelected = this.select(
    (state) => state.selectedRange
  );

  //View Model
/*public readonly vm$ = this.select(
    this.isLoading$,
    this.isDateRangeSelected,
    (isLoading, isDateRangeSelected, resourcesTree) => ({
      isLoading,
      isDateRangeSelected,
      resourcesTree,
    })
  );*/

  public readonly vm$ = this.select((state) => state)

  // Updaters
  readonly setSelectedRange = this.updater<DataRange>(
    (state, selectedRange) => ({ ...state, selectedRange })
  );
  readonly setIntervalDates = this.updater<string[]>(
    (state, intervalDates) => ({
      ...state,
      intervalDates,
    })
  );
  readonly setValidatedDates = this.updater<string[]>(
    (state, validatedDates) => ({
      ...state,
      validatedDates,
    })
  );
  readonly setIsLoading = this.updater<boolean>((state, isLoading) => ({
    ...state,
    isLoading,
  }));
  readonly setResourcesTreeResidencial = this.updater<Resource>((state, resourcesTreeResidencial) => ({
    ...state,
    resourcesTreeResidencial,
  }));
  readonly setResourcesTreePyme = this.updater<Resource[]>((state, resourcesTreePyme) => ({
    ...state,
    resourcesTreePyme,
  }));
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
  readonly  setSelectedResourcesResidencial = this.updater<Resource[]>((state, selectedResidential) => ({
    ...state,
    selectedResidential
  }));
/*  readonly updateResourceSelection = this.updater((state, resourcesSelectedResidential: Resource | null) => {
    const findAndUpdateNode = (node: Resource | null) => {
      if (!node) return null;

      let newNode = {...node};

      const duplicado = this.get().resourcesSelectedResidential?.find((resource) => resource.resourceId === newNode.resourceId);
      console.log(duplicado);

      return {
        ...state,
        resourcesSelectedResidential
    }
  })*/

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
      /*concatMap(async () => this.getResourcesTreeRaw()),*/
      concatMap(() => this.ofsRestApi.getAllResources()),
      concatMap((resourcesTreeRaw) => resourcesTreeRaw && this.handleResourcesTree(resourcesTreeRaw)),
      tap(() => this.setIsLoading(false))
    )
  );

  private readonly getResourcesTreeRaw = this.effect(($) =>
    $.pipe(
      concatMap(() => this.ofsRestApi.getAllResources()),
      concatMap((resourcesTreeRaw) => resourcesTreeRaw && this.handleResourcesTree(resourcesTreeRaw)),
      tap(() => Promise.resolve())
    )
  );

/*  private readonly exportManualMoveReasons = this.effect(($) =>
    $.pipe(
      tap(() => this.setIsLoading(true)),
      concatMap(() => this.listDailyExtract()),
      tap((response) => this.handleListDailyExtractFiles(response)),
      concatMap(() => this.dailyExtractFile()),
      switchMap((response) => this.handleDailyExtractFile(response)),
      concatMap((json) => this.handleJsonBody(json)),
      tap((json) => this.exportByChunks(json)),
      tap(() => this.setIsLoading(false))
    )
  );*/

  private readonly residentialToPyme = this.effect(($) => $.pipe(
    tap(() => this.setIsLoading(true)),
    /*concatMap(() => this.ofsRestApi.setWorkSkills('TEC3', [])),*/
    map(() => this.handleWorkSkillsToPyme(this.get().selectedResidential)),
    concatMap((resource) => this.ofsRestApi.setWorkSkills(resource[0])),
    tap(() => this.clearBuffer()),
    /*tap(() => this.getResourcesTreeRaw()),*/
    tap(() => this.dialogService.success('Recursos movidos exitosamente a PYME')),
    concatMap(() => this.ofsRestApi.getAllResources()),
    concatMap((resourcesTreeRaw) => resourcesTreeRaw && this.handleResourcesTree(resourcesTreeRaw)),
    tap(() => this.setIsLoading(false)),
  ));

  private readonly pymeToResidential = this.effect(($) => $.pipe(
    tap(() => this.setIsLoading(true)),
    map(() => this.handleWorkSkillsToResidential(this.get().selectedPyme)),
    switchMap(resources => {
      const hasInvalidResource = resources.some(resource => resource.workSkills.length === 0);
      console.log(resources);
      console.log(hasInvalidResource);
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
    tap(() => this.clearBuffer()),
    tap(() => this.dialogService.success('Recursos movidos exitosamente a RESIDENCIAL')),
    concatMap(() => this.ofsRestApi.getAllResources()),
    concatMap((resourcesTreeRaw) => resourcesTreeRaw && this.handleResourcesTree(resourcesTreeRaw)),
    tap(() => this.setIsLoading(false)),
  ));

  public sendCloseMessage = this.effect<Partial<Message>>((data$) =>
    data$.pipe(tap((data) => this.ofsPluginApi.close(data)))
  );

  // Actions
  private handleResourcesTree(resourcesTreeRaw: Resource[]) {
    const cleanResourcesTreeRaw = resourcesTreeRaw.filter((resource) =>
      resource.status === 'active' && resource.organization === 'default');
    const pymeTree = cleanResourcesTreeRaw.filter((resource) =>
      resource.workSkills?.items &&
      resource.workSkills?.items?.some(skill => skill.workSkill === 'PYME' && dayjs(skill.endDate)>=dayjs()));
    const idsPyme = new Set(pymeTree.map(r => r.resourceId));
    const residencial = cleanResourcesTreeRaw.filter(resource => !idsPyme.has(resource.resourceId));
    const residencialTree = this.resourceTreeService.buildTree(residencial);
    residencialTree && this.setResourcesTreeResidencial(residencialTree!);
    pymeTree && this.setResourcesTreePyme(pymeTree!);
    return Promise.resolve(residencialTree);
  };

  public confirmMovement(pyme: boolean) {
    const recursos = Math.floor(Math.random()*100);
    pyme ?
      this.dialogService.confirm('¿Seguro que deseas mover ' + this.get().selectedResidential.length + ' recursos a PYME?').subscribe(result => result! && this.residentialToPyme())
      :
      this.dialogService.confirm('¿Seguro que deseas devolver ' + this.get().selectedPyme.length + ' recursos a RESIDENCIAL?').subscribe(result => result! && this.pymeToResidential());
  }
/*  private exportByChunks(manualMoves: any[]) {
    from(manualMoves).pipe(
      bufferCount(chunkSize),
      concatMap((chunk) => {
        const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(chunk);
        return Promise.resolve(worksheet);
      }),
      reduce((acc: XLSX.WorkBook, worksheet: XLSX.WorkSheet) => {
        if (!acc.Sheets) {
          acc = { Sheets: { movimientos: worksheet }, SheetNames: ['movimientos'] };
        } else {
          XLSX.utils.book_append_sheet(acc, worksheet, `movimientos_${Object.keys(acc.Sheets).length}`);
        }
        return acc;
      }, {} as XLSX.WorkBook),
      concatMap((workbook) => {
        const excelBuffer: any = XLSX.write(workbook, {
          bookType: 'xlsx',
          type: 'array',
        });
        return Promise.resolve(excelBuffer);
      })
    ).subscribe({
      next: (excelBuffer) => {
        this.exportService.saveAsExcelFile(excelBuffer, `MovMans_${this.get().selectedRange.from} a ${this.get().selectedRange.to}`);
      },
      error: (err) => {
        this.dialogService.error(err);
      },
      complete: () => {
        console.log('Complete, total: ' + manualMoves.length);
        this.dialogService.success('Archivo generado con éxito');
        this.clearBuffer();
      },
    });
  }*/

  private listDailyExtract() {
    const { intervalDates } = this.get();
    return from(intervalDates).pipe(
      concatMap((date) =>
        this.ofsRestApi.getAListOfDailyExtractFilesForADate({
          dailyExtractDate: date,
        })
      ),
      toArray()
    );
  };

  private dailyExtractFile() {
    const { validatedDates } = this.get();
    return from(validatedDates).pipe(
      concatMap((date) => this.ofsRestApi.getADailyExtractFile(date)),
      toArray()
    );
  }

  private handleDailyExtractFile(files: string[]) {
    return from(files).pipe(
      concatMap((file) => from(this.xmlToJson(file))),
      toArray()
    );
  }

  private handleJsonBody(json: GetADailyExtractFileJSONResponse[]) {
    return from(json).pipe(
      concatMap((json) => this.handleJson(json)),
      toArray()
    );
  }

  private async xmlToJson(xml: string) {
    try {
      const json = await parseStringPromise(xml, {
        explicitArray: false,
        mergeAttrs: true,
      });
      return json;
    } catch (error) {
      console.error('Error parsing XML: ', error);
      this.dialogService.error('Error parsing XML: ' + String(error));
      throw error;
    }
  }

/*  public descargarRazones() {
    this.setIsLoading(true);
    const range = this.createRange();
    if (range.length > 16 && range.length < 0) {
      this.dialogService.error('El rango de fechas no puede ser mayor a 15 días');
      this.clearBuffer();
      this.setIsLoading(false);
      return;
    } else {
      this.exportManualMoveReasons();
    }
  }*/

  private handleListDailyExtractFiles(
    dailyExtractFilesList: GetAListDailyExtractFilesDateResponse[]
  ) {
    const regex = /\d{4}-\d{2}-\d{2}/;
    const arregloFechas: string[] = [];
    dailyExtractFilesList.map((fileByDate) => {
      if (fileByDate.files.items.length > 0) {
        fileByDate.files.items.map((item) => {
          if (item.name === 'appt_manual_move') {
            const fecha = item.links[0].href.match(regex);
            arregloFechas.push(fecha![0]);
          }
        });
      }
    });
    this.setValidatedDates(arregloFechas);
  }

  private createRange(): string[] {
    const { selectedRange } = this.get();
    let fechas = [];
    let fechaActual = new Date(selectedRange.from!);
    let fechaFinal = new Date(selectedRange.to!);
    while (fechaActual <= fechaFinal) {
      fechas.push(fechaActual.toISOString().split('T')[0]);
      fechaActual.setDate(fechaActual.getDate() + 1);
    }
    this.setIntervalDates(fechas);
    return fechas;
  }

  private handleJson(ApptManualMoves: GetADailyExtractFileJSONResponse) {
    const json: any[] = [];
    if (Array.isArray(ApptManualMoves.appt_manual_moves.appt_manual_move)) {
      ApptManualMoves.appt_manual_moves.appt_manual_move.map(({ Field }) => {
        const newItem: { [key: string]: string | undefined } = {};
        Field.forEach((field) => {
          if (
            field.name === 'Condición de movimiento' ||
            field.name === 'Discrepancia de aptitud laboral' ||
            field.name === 'Discrepancia de zona de trabajo' ||
            field.name === 'Enrutado automático a fecha' ||
            field.name === 'Etiqueta de motivo de movimiento' ||
            field.name === 'Hora de acción de movimiento' ||
            field.name === 'ID de actividad' ||
            field.name === 'Mover a fecha' ||
            field.name === 'Mover de fecha' ||
            field.name === 'Nombre de motivo de movimiento' ||
            field.name === 'Nombre de usuario'
          ) {
            newItem[field.name] = field._;
          }
        });
        json.push(newItem);
        return newItem;
      });
    } else if (typeof ApptManualMoves.appt_manual_moves.appt_manual_move === 'object' && ApptManualMoves.appt_manual_moves.appt_manual_move !== null) {
      const arrayFromObject: ApptManualMove[] = [];
      arrayFromObject.push(ApptManualMoves.appt_manual_moves.appt_manual_move);
      arrayFromObject.map(({ Field }) => {
        const newItem: { [key: string]: string | undefined } = {};
        Field.forEach((field) => {
          if (
            field.name === 'Condición de movimiento' ||
            field.name === 'Discrepancia de aptitud laboral' ||
            field.name === 'Discrepancia de zona de trabajo' ||
            field.name === 'Enrutado automático a fecha' ||
            field.name === 'Etiqueta de motivo de movimiento' ||
            field.name === 'Hora de acción de movimiento' ||
            field.name === 'ID de actividad' ||
            field.name === 'Mover a fecha' ||
            field.name === 'Mover de fecha' ||
            field.name === 'Nombre de motivo de movimiento' ||
            field.name === 'Nombre de usuario'
          ) {
            newItem[field.name] = field._;
          }
        });
        json.push(newItem);
        return newItem;
      });
    }
    return json;
  }

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

      /*const latestSkillsMap = new Map<string, workSkillItem>();*/
      const skillsMap = new Map<string, workSkillItem>();

      resource.workSkills.items.forEach(skill => !skill.endDate && skillsMap.set(skill.workSkill, skill));
/*      resource.workSkills.items.forEach(skill => {
        const existingSkill = latestSkillsMap.get(skill.workSkill);
        if (!existingSkill || dayjs(skill.startDate).isAfter(dayjs(existingSkill.startDate))) {
          latestSkillsMap.set(skill.workSkill, skill)
        }
      });*/

/*      const filteredSkills: workSkills[] = Array.from(latestSkillsMap.values()).map(item => ({
        workSkill: item.workSkill,
        ratio: item.ratio,
        startDate: item.startDate,
        endDate: item.endDate
      }));*/

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
      /*.filter(resourceData => resourceData.workSkills.length > 0);*/
  }

  private clearBuffer() {
    this.patchState({selectedResidential: []});
    this.patchState({selectedPyme: []});
    this.patchState({resourcesTreeResidencial: undefined});
    this.patchState(({resourcesTreePyme: undefined}));
    this.setSelectedRange({from: null, to: null, valid: false});
  }

  private handleError(err: Error) {
    console.log('Error', err);
    alert('Hubo un error\n' + err.message || 'Error desconocido');
    return EMPTY;
  }
}
