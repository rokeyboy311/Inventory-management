import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// Canonical columns from DOLVAN INVENTERY.xlsx Sheet1
const columns = [
  { header1: 'SR NO', header2: 'SR NO', header3: '1', width: 8 },
  { header1: 'Location of TC', header2: 'Site Location', header3: '2', width: 28 },
  { header1: 'TC Serial Number.', header2: 'TC Serial', header3: '3', width: 18 },
  { header1: 'TC Make', header2: 'Make', header3: '4', width: 16 },
  { header1: 'TC Capacity', header2: 'Capacity', header3: '5', width: 14 },
  { header1: 'Replacement of  bushing goti', header2: 'HT', header3: '6', width: 10 },
  { header1: 'Replacement of  bushing goti', header2: 'LT', header3: '7', width: 10 },
  { header1: 'Providing LT side AL. Patta KVA', header2: '100', header3: '8', width: 14 },
  { header1: 'Check and Tight Earth Connection', header2: 'Nos.', header3: '9', width: 14 },
  { header1: 'Replacement of LT damaged cable', header2: 'Nos.', header3: '10', width: 10 },
  { header1: 'Replacement of LT damaged cable', header2: 'C- 1(70)', header3: '11', width: 12 },
  { header1: 'Replacement of LT damaged cable', header2: 'C- 2(150)', header3: '12', width: 12 },
  { header1: 'Providing of new termination in form of R,Y,B and N core including PVC tape', header2: '70', header3: '13', width: 12 },
  { header1: 'Providing of new termination in form of R,Y,B and N core including PVC tape', header2: '150', header3: '14', width: 12 },
  { header1: 'Providing of termination up to sq mm cable', header2: 'Sets', header3: '15', width: 14 },
  { header1: 'Measurement and voltage ampeare', header2: 'Reading', header3: '16', width: 18 },
  { header1: 'Check oil leakage and fill up', header2: 'Ltr', header3: '17', width: 12 },
  { header1: 'Replacement of detoriarated /providing LT dist. Box with new above to 100 KVA capacity', header2: 'Nos.', header3: '18', width: 16 },
  { header1: 'Checking and replacement of Kit-Ket fuse if required', header2: '100Amp', header3: '19', width: 12 },
  { header1: 'Checking and replacement of Kit-Ket fuse if required', header2: '200Amp', header3: '20', width: 12 },
  { header1: 'Replacement of HRC Fuse Base', header2: '400', header3: '21', width: 12 },
  { header1: 'Replacement of HRC Fuse Link', header2: '400', header3: '22', width: 12 },
  { header1: 'Providing of Fuse elemant (D.O.)', header2: 'Nos.', header3: '23', width: 12 },
  { header1: 'Providing of Sundry items (Nut,Bolt,Washer)', header2: 'Sets', header3: '24', width: 14 },
  { header1: 'General Condition', header2: 'Status', header3: '25', width: 12 },
  { header1: 'LT Side Brass Nuts', header2: '12 mm', header3: '26', width: 12 },
  { header1: 'LT Side Brass Washer', header2: '12 mm', header3: '27', width: 12 },
  { header1: 'Breather', header2: '500 gm', header3: '28', width: 12 },
  { header1: 'HALF STUD', header2: '12 MM', header3: '29', width: 12 }
];

const merges = [];
let c = 0;
while (c < columns.length) {
  const currentH1 = columns[c].header1;
  let endC = c;
  while (endC + 1 < columns.length && columns[endC + 1].header1 === currentH1) {
    endC++;
  }
  if (endC > c) {
    merges.push({ s: { r: 0, c }, e: { r: 0, c: endC } });
  } else {
    merges.push({ s: { r: 0, c }, e: { r: 1, c } });
  }
  c = endC + 1;
}

const headerRow1 = columns.map(col => col.header1);
const headerRow2 = columns.map(col => col.header2);
const headerRow3 = columns.map(col => col.header3);

// Sample baseline row representing typical site maintenance
const sampleRow = [
  1, 'Gidc valu', '142356', 'Vijay', '100',
  '', '', 4, 1, '', '', '', 1, '', '', '230/235/232V 15/18/14A', '', '', 1, '', 1, 1, 1, 1, '3', 2, 2, '', 1
];

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([headerRow1, headerRow2, headerRow3, sampleRow]);
ws['!merges'] = merges;
ws['!cols'] = columns.map(col => ({ wch: col.width }));
ws['!rows'] = [
  { hpt: 30, hpx: 40 },
  { hpt: 24, hpx: 32 },
  { hpt: 18, hpx: 24 },
  { hpt: 21, hpx: 28 }
];

XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

// Write to root and public
XLSX.writeFile(wb, 'DOLVAN INVENTERY.xlsx');
XLSX.writeFile(wb, 'public/DOLVAN INVENTERY.xlsx');

console.log('Created DOLVAN INVENTERY.xlsx in root and public/ !');
