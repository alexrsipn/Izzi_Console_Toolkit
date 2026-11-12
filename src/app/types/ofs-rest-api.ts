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

export interface GetDescendantsReqQueryParams {
  expand?: string;
  fields?: string;
  limit?: number;
  offset?: number;
}

export interface GetDescendantsResponse {
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
  login?: string;
  XR_PERMISO_ACT_INT?: number,
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

export interface GetUsersReqQueryParams {
  limit: number;
  offset: number;
  fields: string;
}

export interface GetUsersResponse {
  totalResults: number;
  limit: number;
  offset: number;
  items: User[];
}

export interface User {
  mainResourceId: string;
  login: string;
  name: string;
  status: string;
}

export interface UserOption {
  login: string;
  name: string;
}

export interface UpdateAResourceResponse {
  XR_COMPANY: string;
  XR_PERMISO_ACT_INT: number;
  dateFormat: string;
  durationStatisticsInitialPeriod?: string;
  durationStatisticsInitialRatio?: string;
  language: string;
  languageISO: string;
  name: string;
  organization: string;
  parentResourceId: string;
  parentResourceInternalId: number;
  resourceId: string;
  resourceInternalId: number;
  resourceType: string;
  status: string;
  timeFormat: string;
  timeZone: string;
  timeZoneDiff: number;
  timeZoneIANA: string;
  inventories?: any;
  links?: any;
  users?: any;
  workSchedules?: any;
  workSkills?: any;
  workZones?: any;
}

export interface workSkillItems {
  items: workSkillItem[];
}

export interface workSkillItem {
  workSkill: string;
  ratio: number;
  startDate: string;
  endDate?: string;
}

export interface expandItem {
  links: links[];
}

export interface links {
  rel: string;
  href: string;
}

export interface expandedItems<T> {
  items: T[];
}

export interface expandedWorkZoneItem {
  workZoneItemId?: number;
  workZoneStatus?: string;
  workZone?: string;
  startDate?: string;
  ratio?: number;
  recurrence?: string;
  recurEvery?: number;
  type?: string;
}

export interface expandedScheduleShift {
  recordType?: string;
  startDate?: string;
  scheduleLabel?: string;
  shiftLabel?: string;
  shiftType?: string;
  workTimeStart?: string;
  workTimeEnd?: string;
  isWorking?: boolean;
  recurrence?: expandedRecurrence;
}

export interface expandedRecurrence {
  recurrenceType?: string;
  recurEvery?: number;
  weekdays?: string[];
}

export interface expandedWorkScheduleItem {
  recordType?: string;
  startDate?: string;
  shiftLabel?: string;
  shiftType?: string;
  workTimeStart?: string;
  workTimeEnd?: string;
  isWorking?: boolean;
  scheduleItemId?: number;
  scheduleLabel?: string;
  recurrence?: expandedRecurrence;
  scheduleShifts?: expandedScheduleShift[];
}

export interface expandedInventoryItem {
  serialNumber?: string;
  status?: string;
  inventoryType?: string;
  inventoryId?: number;
  resourceId?: string;
  resourceInternalId?: number;
  quantity?: number;
}

export interface workSkills {
  workSkill: string,
  ratio: number,
  startDate: string,
  endDate?: string
}
