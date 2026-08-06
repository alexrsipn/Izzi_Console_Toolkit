import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GetAvailableDates, GetToken } from '../types/aws-api';

@Injectable({
    providedIn: 'root'
})
export class TokenService {
    credentials: { aws_user: string; aws_pass: string, aws_api_key: string } = {
        aws_user: '',
        aws_pass: '',
        aws_api_key: ''
    };
    awsTokenUrl = '';
    awsBaseUrl = '';
    private token: string | null = null;

    constructor(private readonly http: HttpClient) { }

    setTokenUrl(string: string) {
        this.awsTokenUrl = string;
        return this;
    }

    setBaseUrl(string: string) {
        this.awsBaseUrl = string;
        return this;
    }

    setCredentials(credentials: { aws_user: string; aws_pass: string, aws_api_key: string }) {
        this.credentials = credentials;
        return this;
    }

    setToken(token: string) {
        this.token = token;
        return this;
    }

    fetchToken() {
        const endpoint = `${this.awsTokenUrl}`;
        const headers = new HttpHeaders({
            Authorization: `Basic ${btoa(
                this.credentials.aws_user + ':' + this.credentials.aws_pass
            )}`
        });
        const body = {
            "username": this.credentials.aws_user,
            "password": this.credentials.aws_pass
        };
        return this.http.post<GetToken>(endpoint, body, { headers });
    }

    getAvailableDates() {
        const endpoint = `${this.awsBaseUrl}/available-reports`;
        const headers = new HttpHeaders({
            Authorization: `${this.token}`,
            'x-api-key': this.credentials.aws_api_key,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        });
        return this.http.get<GetAvailableDates>(endpoint, { headers });
    }

    downloadReport(date: string): Observable<string> {
        const endpoint = `${this.awsBaseUrl}/export-chats`;
        const headers = new HttpHeaders({
            Authorization: `${this.token}`,
            'x-api-key': this.credentials.aws_api_key
        });
        const params = new HttpParams({ fromObject: { date } });
        return this.http.get(endpoint, { headers, params, responseType: 'text' });
    }

    downloadCustomReport(date: string, query: { user: string; chatType: string; hour: string }): Observable<string> {
        const endpoint = `${this.awsBaseUrl}/export-chats`;
        const headers = new HttpHeaders({
            Authorization: `${this.token}`,
            'x-api-key': this.credentials.aws_api_key
        });
        const filteredParams = Object.fromEntries(
            Object.entries(query).filter(([_, v]) => v !== '')
        );
        const params = new HttpParams({ fromObject: { date, ...filteredParams } });
        return this.http.get(endpoint, { headers, params, responseType: 'text' });
    }
}