import { Injectable } from '@angular/core';
import { utils, writeFileXLSX } from 'xlsx';
import * as XLSX from 'xlsx';
import { ApptManualMove } from '../types/ofs-rest-api';

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  exportToExcel(data: unknown[][], filename: string = 'activities') {
    const ws = utils.aoa_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Data');
    writeFileXLSX(wb, `${filename}.xlsx`);
  }

  exportAsExcelFile(data: ApptManualMove[], filename: string): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ['data'],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    this.saveAsExcelFile(excelBuffer, filename);
  }

  private saveAsExcelFile(buffer: any, filename: string): void {
    const EXCEL_TYPE =
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const EXCEL_EXTENSION = '.xlsx';
    const DATE = new Date();
    const date = DATE.getDate();
    const month = DATE.getMonth() + 1;
    const year = DATE.getFullYear();
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(data);
    link.download = filename + '_' + date + month + year + EXCEL_EXTENSION;
    link.click();
  }
}
