import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  GetDailyExtractFilesDateReqParams,
  GetAListDailyExtractFilesDateResponse,
} from '../types/ofs-rest-api';

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
