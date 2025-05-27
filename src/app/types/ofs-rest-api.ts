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
  endDate?: string;
}

export interface expandItem {
  links: links[];
}

export interface links {
  rel: string;
  href: string;
}

export interface SetWorkSkillReqBodyParams {
  endDate?: string,
  ratio: number,
  startDate?: string,
  workSkill: string
}

export interface SetWorkSkillResponse {
  items: SetWorkSkillReqBodyParams[],
  links: links[],
  totalResults: number
}

export interface resourcesToSetWorkskills {
  resourceId: string,
  workSkills: workSkills[]
}

export interface workSkills {
  workSkill: string,
  ratio: number,
  startDate: string,
  endDate?: string
}

export interface GetACalendarReqQueryParams {
  dateFrom: string;
  dateTo: string;
}

export interface GetACalendarResponse {
  date: GetACalendarResponseRegular;
}

export interface GetACalendarResponseFormatted {
  date: string;
  recordType?: string;
  nonWorkingReason?: string;
  workTimeStart?: string;
  workTimeEnd?: string;
  shiftLabel?: string;
  comments?: string;
}

export interface GetACalendarResponseRegular {
  regular: GetACalendarResponseRegularBody;
}

export interface GetACalendarResponseRegularBody {
  recordType: string;
  workTimeStart: string;
  workTimeEnd: string;
  shiftLabel: string;
}

export interface SetAWorkScheduleBodyParams {
  endDate: string;
  recordType: string;
  startDate: string;
  comments: string;
  isWorking: boolean;
  shiftLabel?: string;
  shiftType?: string;
  nonWorkingReason?: string;
  recurrence?: SetAWorkScheduleBodyRecurrence;
}

export interface SetAWorkScheduleBodyRecurrence {
  recurrenceType: string;
  recurEvery: number;
}

export interface SetAWorkScheduleResponse {
  items: SetAWorkScheduleResponseItems[]
}

export interface SetAWorkScheduleResponseItems {
  detail: string;
  status: string;
  title: string;
  type: string;
}
