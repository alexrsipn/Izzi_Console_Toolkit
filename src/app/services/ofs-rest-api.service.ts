import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  GetDailyExtractFilesDateReqParams,
  GetAListDailyExtractFilesDateResponse,
  GetResourcesResponse,
  GetResourcesReqQueryParams,
  Resource,
  SetWorkSkillReqBodyParams, SetWorkSkillResponse, resourcesToSetWorkskills,
} from '../types/ofs-rest-api';
import {forkJoin, map, mergeMap, Observable, of, tap} from "rxjs";

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
    const data = [
      {
        "workSkill": "PYME",
        "ratio": 100,
        "startDate": "2025-04-25",
        "endDate": "2025-04-25"
      },
      {
        "workSkill": "INST",
        "ratio": 100,
        "startDate": "2025-04-26"
      },
      {
        "workSkill": "TC",
        "ratio": 100,
        "startDate": "2025-04-26"
      },
      {
        "workSkill": "WIFI",
        "ratio": 100,
        "startDate": "2025-04-26"
      }
    ];
    return this.http.post<SetWorkSkillResponse>(endpoint, resource.workSkills, {headers});
  }

  getAListOfDailyExtractFiles(selectedRange: string[]) {
    selectedRange.map((date) => {
      this.getAListOfDailyExtractFilesForADate({ dailyExtractDate: date });
    });
  }

  getAListOfDailyExtractFilesForADate(
    pathParams: GetDailyExtractFilesDateReqParams
  ) {
    const endpoint = `${this.baseUrl}/rest/ofscCore/v1/folders/dailyExtract/folders/${pathParams.dailyExtractDate}/files`;
    const headers = new HttpHeaders({
      Authorization: `Basic ${btoa(
        this.credentials.user + ':' + this.credentials.pass
      )}`,
    });
    const params = new HttpParams().set('language', 'es-ES');
    return this.http.get<GetAListDailyExtractFilesDateResponse>(endpoint, {
      headers,
      params,
    });
  }

  getADailyExtractFile(pathParams: string) {
    const endpoint = `${this.baseUrl}/rest/ofscCore/v1/folders/dailyExtract/folders/${pathParams}/files/appt_manual_move`;
    const headers = new HttpHeaders({
      Authorization: `Basic ${btoa(
        this.credentials.user + ':' + this.credentials.pass
      )}`,
      Accept: 'application/xml',
    });
    const params = new HttpParams().set('language', 'es-ES');
    return this.http.get<string>(endpoint, {
      headers,
      params,
      responseType: 'text' as 'json',
    });
  }
}
