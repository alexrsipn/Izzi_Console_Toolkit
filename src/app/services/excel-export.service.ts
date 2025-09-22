import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import {defer, Observable, of} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {

  constructor() { }

  public exportAsExcelFile(jsonData: any[], fileName: string): Observable<any> {
    return defer(() => {
      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonData);
      const wb: XLSX.WorkBook = {Sheets: {'Recursos': ws}, SheetNames: ['Recursos']};
      const excelBuffer: any = XLSX.write(wb, { bookType: 'xlsx', type: 'array'});
      this.saveAsExcelFile(excelBuffer, fileName);
      return of(undefined);
    })
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], {type: 'application/octet-stream'});
    const url: string = window.URL.createObjectURL(data);
    const link: HTMLAnchorElement = document.createElement('a');
    link.href = url;
    link.download = `${fileName}_${new Date().getTime()}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
    link.remove();
  }
}
