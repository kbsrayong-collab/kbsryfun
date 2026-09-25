/**
 * =========================================================================
 * ระบบทะเบียนคุมสัญญายืมเงินราชการ (Backend Google Apps Script + Google Sheets)
 * แบบ 8500 ตามระเบียบกระทรวงการคลังว่าด้วยการเบิกจ่ายเงินยืมราชการ
 * =========================================================================
 * โครงสร้างไฟล์ในโปรเจกต์ Google Apps Script:
 * 1. Code.gs (ไฟล์นี้) - ทำหน้าที่เป็น Backend เชื่อมต่อ Google Sheets และ REST API
 * 2. Index.html - หน้าเว็บ Frontend สำหรับผู้ใช้งานเชื่อมต่อผ่าน google.script.run
 *
 * วิธีติดตั้ง:
 * 1. สร้าง Google Sheets ขึ้นมา 1 ไฟล์ (เช่น "ทะเบียนคุมเงินยืมราชการ")
 * 2. ไปที่เมนู "ส่วนขยาย" (Extensions) > "Apps Script"
 * 3. วางโค้ดนี้ใน Code.gs
 * 4. คลิกเครื่องหมาย + ข้างเมนู "ไฟล์" (Files) > เลือก "HTML" > ตั้งชื่อว่า "Index"
 * 5. คัดลอกโค้ดจาก Index.html มาวางในไฟล์ Index
 * 6. คลิก "การทำให้ใช้งานได้" (Deploy) > "การทำให้ใช้งานได้รายการใหม่" (New Deployment)
 *    - ประเภท: "เว็บแอป" (Web App)
 *    - ดำเนินการในฐานะ: "ฉัน" (Me)
 *    - ผู้มีสิทธิ์เข้าถึง: "ทุกคน" (Anyone)
 * 7. คัดลอก URL ของเว็บแอปไปใช้งาน
 */

const SHEET_NAME = 'ทะเบียนคุมเงินยืม';

/**
 * จัดการคำขอ GET:
 * 1. หากเปิดผ่าน Browser ทั่วไป -> แสดงหน้าเว็บ Index.html
 * 2. หากเรียกผ่าน API (เช่น ?action=getContracts หรือ ?action=ping) -> ตอบกลับเป็น JSON
 */
function doGet(e) {
  try {
    const action = e && e.parameter && e.parameter.action;

    // API Mode (JSON)
    if (action === 'ping') {
      return createJsonResponse({
        status: 'ok',
        message: 'เชื่อมต่อ Google Apps Script และ Google Sheets สำเร็จเรียบร้อย!',
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'getContracts') {
      const contracts = getContractsFromSheet();
      return createJsonResponse({
        status: 'success',
        data: contracts,
        count: contracts.length
      });
    }

    // Web App Mode (Render Index.html)
    try {
      return HtmlService.createTemplateFromFile('Index')
        .evaluate()
        .setTitle('ระบบทะเบียนคุมสัญญายืมเงินราชการ (แบบ 8500)')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    } catch (htmlErr) {
      // Fallback ถ้ายังไม่ได้สร้างไฟล์ Index.html ใน Apps Script
      const contracts = getContractsFromSheet();
      return createJsonResponse({
        status: 'success',
        message: 'เชื่อมต่อชีตสำเร็จ (แนะนำสร้างไฟล์ Index.html ในโปรเจกต์ Apps Script เพื่อเปิดหน้าเว็บแบบเต็มรูปแบบ)',
        data: contracts,
        count: contracts.length
      });
    }
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

/**
 * จัดการคำขอ POST จากระบบภายนอก (React App หรือ REST Client)
 */
function doPost(e) {
  try {
    const contents = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const payload = JSON.parse(contents);
    const action = payload.action || 'syncAll';

    if (action === 'syncAll') {
      const contracts = payload.contracts || [];
      saveAllContractsToSheet(contracts);
      return createJsonResponse({
        status: 'success',
        message: 'ซิงค์ข้อมูลสัญญาทั้งหมด ' + contracts.length + ' รายการเรียบร้อยแล้ว',
        count: contracts.length
      });
    }

    if (action === 'addContract') {
      addOrUpdateSingleContract(payload.contract);
      return createJsonResponse({
        status: 'success',
        message: 'บันทึกสัญญาใหม่ลง Google Sheets สำเร็จ'
      });
    }

    if (action === 'updateContract') {
      addOrUpdateSingleContract(payload.contract);
      return createJsonResponse({
        status: 'success',
        message: 'อัปเดตสัญญาใน Google Sheets สำเร็จ'
      });
    }

    if (action === 'deleteContract') {
      deleteContractById(payload.id);
      return createJsonResponse({
        status: 'success',
        message: 'ลบสัญญาออกจาก Google Sheets สำเร็จ'
      });
    }

    return createJsonResponse({ status: 'error', message: 'Unknown POST action' });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

// =============================================================================
// ฟังก์ชันสำหรับเรียกใช้งานจาก Index.html ผ่าน google.script.run
// =============================================================================

function apiGetContracts() {
  return getContractsFromSheet();
}

function apiSaveAllContracts(contracts) {
  saveAllContractsToSheet(contracts);
  return { status: 'success', count: contracts.length };
}

function apiAddContract(contract) {
  addOrUpdateSingleContract(contract);
  return { status: 'success', message: 'บันทึกสัญญาใหม่สำเร็จ' };
}

function apiUpdateContract(contract) {
  addOrUpdateSingleContract(contract);
  return { status: 'success', message: 'อัปเดตข้อมูลสัญญาสำเร็จ' };
}

function apiDeleteContract(id) {
  deleteContractById(id);
  return { status: 'success', message: 'ลบสัญญาสำเร็จ' };
}

function apiPing() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}

// =============================================================================
// จัดการฐานข้อมูลบน Google Sheets
// =============================================================================

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    initHeaders(sheet);
  }
  return sheet;
}

function initHeaders(sheet) {
  const headers = [
    'ID', 'เลขที่สัญญา', 'วันที่ทำสัญญา', 'ปีงบประมาณ', 'ชื่อผู้ยืม',
    'ตำแหน่ง', 'กลุ่มงาน/สังกัด', 'วัตถุประสงค์', 'ประเภทการยืม', 'แหล่งเงิน',
    'วงเงินยืม (บาท)', 'วันที่จ่ายเงิน', 'กำหนดส่งใช้คืน', 'หมายเหตุ',
    'รายการส่งใช้ (JSON)', 'ข้อมูลฉบับเต็ม (JSON)', 'แก้ไขล่าสุด'
  ];
  sheet.appendRow(headers);
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#047857');
  headerRange.setFontColor('#ffffff');
  sheet.setFrozenRows(1);
}

function getContractsFromSheet() {
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const data = sheet.getRange(2, 1, lastRow - 1, 17).getValues();
  const list = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const fullJson = row[15]; // คอลัมน์ 16: JSON สัญญาเต็ม
    if (fullJson && typeof fullJson === 'string' && fullJson.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(fullJson);
        list.push(parsed);
        continue;
      } catch (err) {}
    }

    // กรณีข้อมูลกรอกด้วยมือในชีต ให้ดึงจากคอลัมน์
    if (row[0] || row[1]) {
      list.push({
        id: String(row[0] || 'contract-' + (i + 1)),
        contractNo: String(row[1] || ''),
        contractDate: formatDate(row[2]),
        fiscalYear: Number(row[3]) || 2568,
        borrowerName: String(row[4] || ''),
        position: String(row[5] || ''),
        department: String(row[6] || ''),
        purpose: String(row[7] || ''),
        loanType: String(row[8] || 'general'),
        budgetType: String(row[9] || 'เงินงบประมาณ (เงินรายจ่ายประจำปี)'),
        loanAmount: Number(row[10]) || 0,
        disbursementDate: formatDate(row[11]),
        dueDate: formatDate(row[12]),
        remarks: String(row[13] || ''),
        repayments: row[14] ? tryParseJson(row[14], []) : [],
        createdAt: new Date().toISOString(),
        updatedAt: formatDate(row[16]) || new Date().toISOString(),
      });
    }
  }

  return list;
}

function saveAllContractsToSheet(contracts) {
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }

  if (!contracts || contracts.length === 0) return;

  const rows = contracts.map(c => [
    c.id || '',
    c.contractNo || '',
    c.contractDate || '',
    c.fiscalYear || '',
    c.borrowerName || '',
    c.position || '',
    c.department || '',
    c.purpose || '',
    c.loanType || '',
    c.budgetType || '',
    c.loanAmount || 0,
    c.disbursementDate || '',
    c.dueDate || '',
    c.remarks || '',
    JSON.stringify(c.repayments || []),
    JSON.stringify(c),
    new Date().toISOString()
  ]);

  sheet.getRange(2, 1, rows.length, 17).setValues(rows);
}

function addOrUpdateSingleContract(contract) {
  if (!contract || !contract.id) return;
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();

  let targetRow = -1;
  if (lastRow > 1) {
    const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(contract.id)) {
        targetRow = i + 2;
        break;
      }
    }
  }

  const rowData = [
    contract.id,
    contract.contractNo || '',
    contract.contractDate || '',
    contract.fiscalYear || '',
    contract.borrowerName || '',
    contract.position || '',
    contract.department || '',
    contract.purpose || '',
    contract.loanType || '',
    contract.budgetType || '',
    contract.loanAmount || 0,
    contract.disbursementDate || '',
    contract.dueDate || '',
    contract.remarks || '',
    JSON.stringify(contract.repayments || []),
    JSON.stringify(contract),
    new Date().toISOString()
  ];

  if (targetRow > 0) {
    sheet.getRange(targetRow, 1, 1, 17).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

function deleteContractById(id) {
  if (!id) return;
  const sheet = getOrCreateSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      sheet.deleteRow(i + 2);
      break;
    }
  }
}

// =============================================================================
// เครื่องมือช่วยเหลือ (Utilities)
// =============================================================================

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function formatDate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(val);
}

function tryParseJson(str, def) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return def;
  }
}
