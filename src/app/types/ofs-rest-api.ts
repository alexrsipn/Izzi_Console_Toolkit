export interface GetResourcesReqQueryParams {
  expand: string;
  fields: string;
  limit: number;
  offset: number;
}

export interface GetResourcesResponse {
  totalResults: number;
  limit: number;
  offset: number;
  items: Resource[];
}

export interface Resource {
  resourceId: string;
  organization: string;
  status: string;
  parentResourceId?: string;
  resourceType: string;
  name: string;
  inventories?: expandItem;
  users?: expandItem;
  workZones?: expandItem;
  workSkills?: workSkillItems;
  workSchedules?: expandItem;
  links?: expandItem;
  avatar?: expandItem;
  children?: Resource[];
  selected?: boolean;
}

export interface workSkillItems {
  items: workSkillItem[];
}

export interface workSkillItem {
  workSkill: string;
  ratio: number;
  startDate: string;
  endDate: string;
}

export interface expandItem {
  links: links[];
}

export interface links {
  rel: string;
  href: string;
}

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
