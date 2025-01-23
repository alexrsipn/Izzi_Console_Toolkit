export interface GetDailyExtractFilesDateReqParams {
  dailyExtractDate: string;
}

export interface GetAListDailyExtractFilesDateResponse {
  name: string;
  files: FilesListDailyExtract;
  lnks: LinkItemListDE[];
}

interface LinkItemListDE {
  rel: string;
  href: string;
}

interface FileItemListDE {
  name: string;
  bytes: string;
  mediaType: string;
  links: LinkItemListDE[];
}

interface FilesListDailyExtract {
  items: FileItemListDE[];
  links: LinkItemListDE[];
}

export interface GetDailyExtractFile {
  name: string;
  links: string[];
}

export interface GetADailyExtractFileJSONResponse {
  appt_manual_moves: ApptManualMoves;
}

export interface ApptManualMoves {
  appt_manual_move: ApptManualMove[];
}

export interface ApptManualMove {
  Field: Field[];
}

export interface Field {
  _: string | undefined;
  name: string;
}

export interface ManualMovements {
  appt_manual_move: ManualMove[];
}

export interface ManualMove {
  'Condición de movimiento': string;
  'Discrepancia de aptitud laboral': number;
  'Discrepancia de zona de trabajo': number;
  'Enrutado automático a fecha': string | undefined;
  'Etiqueta de motivo de movimiento': string;
  'Hora de acción de movimiento': string;
  'ID de acción de movimiento': number;
  'ID de actividad': number;
  'ID de motivo de movimiento': number;
  'ID de usuario': number;
  'Mover a ID de proveedor': number;
  'Mover a fecha': string;
  'Mover de ID de proveedor': number;
  'Mover de fecha': string;
  'Nombre de motivo de movimiento': string;
  'Nombre de usuario': string;
}

export interface ListDailyExtractValidation {
  date: string;
  valid: boolean;
}

export interface DailyExtractValidation {
  date: string;
  valid: boolean;
}

export interface GetResourcesResponse {
  totalResults: number;
  limit: number;
  offset: number;
  items: Resource[];
}

export interface GetActivitiesResponse {
  expression: string;
  hasMore?: boolean;
  items: Activity[];
  limit?: number;
  offset?: number;
}

export interface GetActivitiesReqQueryParams {
  resources: string[];
  dateFrom?: string;
  dateTo?: string;
  fields?: string[];
  includeChildren?: 'none' | 'immediate' | 'all';
  includeNonScheduled?: 'true' | 'false';
  limit?: number;
  offset?: number;
  q?: string;
}

export interface GetResourcesReqQueryParams {
  fields?: string[];
  limit?: number;
  offset?: number;
}

export interface Resource {
  resourceId: string;
  resourceInternalId: number;
  name: string;
  parentResourceInternalId?: number;
  parentResourceId?: string;
}

export interface Activity {
  resourceId: string;
  organization: string;
  resourceInternalId: number;
  status: string;
  resourceType: string;
  name: string;
  language: string;
  languageISO: string;
  timeZoneDiff: number;
  timeZone: string;
  timeZoneIANA: string;
  dateFormat: string;
  timeFormat: string;
  durationStatisticsInitialRatio?: number;
  email?: string;
  phone?: string;
  parentResourceInternalId?: number;
  parentResourceId?: string;
  XR_PartnerID?: string;
  XR_MasterID?: string;
  XR_RPID?: string;
  XR_ActivadoraRep?: string;
  email_disp?: string;
  email_supervisor?: string;
  durationStatisticsInitialPeriod?: number;
  XR_TipoTecnico?: string;
  A_MotivoPrecodigoSuspension?: string;
}

export interface GetPropertyEnumerationListResponse {
  hasMore: boolean;
  totalResults: number;
  limit: number;
  offset: number;
  items: EnumerationItem[];
}

export interface EnumerationItem {
  label: string;
  active: boolean;
  name: string;
}
