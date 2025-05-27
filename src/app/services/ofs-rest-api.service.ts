import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  GetResourcesResponse,
  GetResourcesReqQueryParams,
  Resource,
  SetWorkSkillResponse,
  resourcesToSetWorkskills,
  GetACalendarReqQueryParams,
  GetACalendarResponse, SetAWorkScheduleBodyParams, SetAWorkScheduleResponse,
} from '../types/ofs-rest-api';
import {forkJoin, map, mergeMap, Observable, of} from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class OfsRestApiService {
  credentials: { user: string; pass: string } = {
    user: '',
    pass: '',
  };
  baseUrl = '';

  constructor(private readonly http: HttpClient) {}

  setUrl(string: string) {
    this.baseUrl = string;
    return this;
  }

  setCredentials(credentials: { user: string; pass: string }) {
    this.credentials = credentials;
    return this;
  }

  getResources(queryParams: GetResourcesReqQueryParams) {
    const endpoint = `${this.baseUrl}/rest/ofscCore/v1/resources`;
    const headers = new HttpHeaders({
      Authorization: `Basic ${btoa(
        this.credentials.user + ':' + this.credentials.pass
      )}`
    });
    const params = new HttpParams({
      fromObject: {
        ...queryParams,
      }
    })
    return this.http.get<GetResourcesResponse>(endpoint, {
      headers,
      params
    })
  };

  getAllResources() {
    const limit = 100;
    const fields = 'resourceId,organization,status,parentResourceId,resourceType,name';
    const expand = 'workSkills';
    return this.getResources({limit: limit, fields: fields, offset: 0, expand: expand}).pipe(
      mergeMap((res: GetResourcesResponse) => {
        const calls : Observable<GetResourcesResponse>[] = [];
        for (let offset = limit + res.offset; offset < res.totalResults; offset += limit) {
          calls.push(this.getResources({limit: limit, fields: fields, offset: offset, expand: expand}));
        }
        return forkJoin([of(res), ...calls]);
      }),
      map((responses) => responses.reduce<Resource[]>((acc, elem) => [...acc, ...elem.items], []))
    );
  };

  setWorkSkills(resource: resourcesToSetWorkskills) {
    const endpoint = `${this.baseUrl}/rest/ofscCore/v1/resources/${resource.resourceId}/workSkills`;
    const headers = new HttpHeaders({
      Authorization: `Basic ${btoa(
        this.credentials.user + ':' + this.credentials.pass
      )}`
    });
    return this.http.post<SetWorkSkillResponse>(endpoint, resource.workSkills, {headers});
  }

  getACalendar(resourceId: string, queryParams: GetACalendarReqQueryParams) {
    const endpoint = `${this.baseUrl}/rest/ofscCore/v1/resources/${resourceId}/workSchedules/calendarView`;
    const headers = new HttpHeaders({
      Authorization: `Basic ${btoa(
        this.credentials.user + ':' + this.credentials.pass
      )}`
    });
    const params = new HttpParams({
      fromObject: {
        ...queryParams,
      }
    });
    return this.http.get<GetACalendarResponse>(endpoint, {
      headers,
      params
    })
  }

  setAWorkSchedule(resourceId: string, queryParams: SetAWorkScheduleBodyParams) {
    const endpoint = `${this.baseUrl}/rest/ofscCore/v1/resources/${resourceId}/workSchedules`;
    const headers = new HttpHeaders({
      Authorization: `Basic ${btoa(
        this.credentials.user + ':' + this.credentials.pass
      )}`
    });
    return this.http.post<SetAWorkScheduleResponse>(endpoint, queryParams, {headers});
  }
}
