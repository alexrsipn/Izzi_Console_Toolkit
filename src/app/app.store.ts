import { Injectable } from '@angular/core';
import {
  ApptManualMove,
  GetADailyExtractFileJSONResponse,
  GetAListDailyExtractFilesDateResponse,
  ListDailyExtractValidation,
  Resource,
} from './types/ofs-rest-api';
import { ComponentStore } from '@ngrx/component-store';
import { OfsApiPluginService } from './services/ofs-api-plugin.service';
import { OfsRestApiService } from './services/ofs-rest-api.service';
import { Message } from './types/plugin-api';
import {
  EMPTY,
  catchError,
  concatMap,
  delay,
  delayWhen,
  finalize,
  forkJoin,
  from,
  map,
  mergeMap,
  switchMap,
  tap,
  toArray,
} from 'rxjs';
import { ControlDesk, DataRange } from './types/plugin';
import { parseStringPromise } from 'xml2js';
import { ExportService } from './services/export.service';
import { DateRange } from '@angular/material/datepicker';

interface State {
  isLoading: boolean;
  resources: Resource[];
  resourceFields: string[];
  controlDesks: ControlDesk[];
  selectedRange: DataRange;
  intervalDates: string[];
  ApptManualMoves: GetADailyExtractFileJSONResponse[];
  // ApptManualMovesComplete?: GetADailyExtractFileJSONResponse[];
  ManualMoves: any[];
  listDailyExtract?: ListDailyExtractValidation[];
  validatedDates: string[];
}

const initialState: State = {
  isLoading: false,
  resources: [],
  resourceFields: [
    'resourceId',
    'resourceInternalId',
    'name',
    'parentResourceInternalId',
    'parentResourceId',
  ],
  controlDesks: [],
  selectedRange: { from: null, to: null, valid: false },
  intervalDates: [],
  ApptManualMoves: [
    {
      appt_manual_moves: {
        appt_manual_move: [],
      },
    },
  ],
  ManualMoves: [],
  validatedDates: [],
  // ApptManualMovesComplete: [],
};

@Injectable({
  providedIn: 'root',
})
export class AppStore extends ComponentStore<State> {
  constructor(
    private readonly ofsPluginApi: OfsApiPluginService,
    private readonly ofsRestApi: OfsRestApiService,
    private readonly exportService: ExportService
  ) {
    super(initialState);
    this.handleOpenMessage(this.ofsPluginApi.openMessage$);
    this.ofsPluginApi.ready();
  }

  // Selectors
  private readonly controlDesk$ = this.select((state) => state.controlDesks);
  private readonly isLoading$ = this.select((state) => state.isLoading);
  private readonly isDateRangeSelected = this.select(
    (state) => state.selectedRange
  );

  //View Model
  public readonly vm$ = this.select(
    this.controlDesk$,
    this.isLoading$,
    this.isDateRangeSelected,
    (controlDesk, isLoading, isDateRangeSelected) => ({
      controlDesk,
      isLoading,
      isDateRangeSelected,
    })
  );

  // Updaters
  readonly setSelectedDesk = this.updater<ControlDesk | null>(
    (state, selectedDesk) => ({
      ...state,
      selectedDesk,
    })
  );
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
  readonly setManualMovesRaw = this.updater<GetADailyExtractFileJSONResponse[]>(
    (state, ApptManualMoves) => ({
      ...state,
      ApptManualMoves,
    })
  );
  readonly setManualMovements = this.updater<string[]>(
    (state, ManualMoves) => ({
      ...state,
      ManualMoves,
    })
  );
  readonly setControlDesks = this.updater<ControlDesk[]>(
    (state, controlDesks) => ({ ...state, controlDesks })
  );
  readonly addResources = this.updater<Resource[]>((state, resources) => ({
    ...state,
    resources: [...state.resources, ...resources],
  }));
  readonly setIsLoading = this.updater<boolean>((state, isLoading) => ({
    ...state,
    isLoading,
  }));

  private readonly handleOpenMessage = this.effect<Message>(($) =>
    $.pipe(
      tap(() => this.setIsLoading(true)),
      map(({ securedData }) => {
        // switchMap(({ securedData }) => {
        // console.log(securedData);
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
      tap(() => this.setIsLoading(false))
    )
  );

  private readonly exportManualMoveReasons = this.effect(($) =>
    $.pipe(
      tap(() => this.setIsLoading(true)),
      concatMap(() => this.listDailyExtract()),
      tap((response) => this.handleListDailyExtractFiles(response)),
      switchMap(() => this.dailyExtractFile()),
      tap((files) => this.setManualMovements(files)),
      switchMap((files) => this.handleDailyExtractFile(files)),
      tap(() => this.handleJson()),
      tap(() =>
        this.exportService.exportAsExcelFile(
          this.get().ManualMoves,
          'MovMans_' +
            this.get().selectedRange.from! +
            ' a ' +
            this.get().selectedRange.to!
        )
      ),
      tap(() => this.setIsLoading(false))
    )
  );

  private listDailyExtract() {
    const { intervalDates } = this.get();
    return from(intervalDates).pipe(
      mergeMap((date) =>
        this.ofsRestApi.getAListOfDailyExtractFilesForADate({
          dailyExtractDate: date,
        })
      ),
      toArray()
    );
  }

  private dailyExtractFile() {
    const { validatedDates } = this.get();
    return from(validatedDates).pipe(
      mergeMap((date) => this.ofsRestApi.getADailyExtractFile(date)),
      toArray()
    );
  }

  private handleDailyExtractFile(files: string[]) {
    return from(files).pipe(
      delayWhen((file) => this.xmlToJson(file)),
      toArray()
    );
  }

  private async xmlToJson(xml: string): Promise<any> {
    try {
      const json = await parseStringPromise(xml, {
        explicitArray: false,
        mergeAttrs: true,
      });
      // this.get().ApptManualMovesComplete!.push(json);
      this.get().ApptManualMoves.push(json);
      return json;
    } catch (error) {
      console.error('Error parsing XML: ', error);
      // this.handleError({message: error, name: error})
      throw error;
    }
  }

  public descargarRazones() {
    this.createRange();
    this.exportManualMoveReasons();
  }

  private handleListDailyExtractFiles(
    data: GetAListDailyExtractFilesDateResponse[]
  ) {
    const regex = /\d{4}-\d{2}-\d{2}/;
    const arregloFechas: string[] = [];
    data.map((dataByDate) => {
      dataByDate.files.items.map((item) => {
        if (item.name === 'appt_manual_move') {
          const fecha = item.links[0].href.match(regex);
          arregloFechas.push(fecha![0]);
        }
      });
    });
    arregloFechas.sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });
    this.setValidatedDates(arregloFechas);
  }

  public sendCloseMessage = this.effect<Partial<Message>>((data$) =>
    data$.pipe(tap((data) => this.ofsPluginApi.close(data)))
  );

  private createRange() {
    const { selectedRange } = this.get();
    let fechas = [];
    let fechaActual = new Date(selectedRange.from!);
    let fechaFinal = new Date(selectedRange.to!);
    while (fechaActual <= fechaFinal) {
      fechas.push(fechaActual.toISOString().split('T')[0]);
      fechaActual.setDate(fechaActual.getDate() + 1);
    }
    this.setIntervalDates(fechas);
  }

  private handleJson() {
    // const { ApptManualMovesComplete } = this.get();
    const { ApptManualMoves } = this.get();
    const json: any[] = [];
    ApptManualMoves.map(({ appt_manual_moves }) => {
      if (Array.isArray(appt_manual_moves.appt_manual_move)) {
        appt_manual_moves.appt_manual_move.forEach(({ Field }) => {
          const newItem: { [key: string]: string | undefined } = {};
          Field.forEach((field) => {
            if (
              field.name === 'ID de acción de movimiento' ||
              field.name === 'ID de motivo de movimiento' ||
              field.name === 'ID de usuario' ||
              field.name === 'Mover a ID de proveedor' ||
              field.name === 'Mover de ID de proveedor'
            ) {
              return;
            }
            newItem[field.name] = field._;
          });
          json.push(newItem);
          return newItem;
        });
      } else if (
        typeof appt_manual_moves.appt_manual_move === 'object' &&
        appt_manual_moves.appt_manual_move !== null
      ) {
        const arrayFromObject: ApptManualMove[] = [];
        arrayFromObject.push(appt_manual_moves.appt_manual_move);
        arrayFromObject.map(({ Field }) => {
          const newItem: { [key: string]: string | undefined } = {};
          Field.forEach((field) => {
            newItem[field.name] = field._;
          });
          json.push(newItem);
          return newItem;
        });
      }
    });
    this.setManualMovements(json);
  }

  private handleError(err: Error) {
    console.log('Error', err);
    alert('Hubo un error\n' + err.message || 'Error desconocido');
    return EMPTY;
  }
}
