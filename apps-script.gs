// ============================================================
// GOOGLE APPS SCRIPT — Person Matching System Backend
// ============================================================
// SETUP INSTRUCTIONS:
// 1. Go to https://script.google.com
// 2. Click "New Project"
// 3. Delete everything in the editor
// 4. Paste this entire file
// 5. Click "Save" (give it any name)
// 6. Click "Deploy" → "New deployment"
// 7. Type: Web app
// 8. Execute as: Me
// 9. Who has access: Anyone
// 10. Click "Deploy"
// 11. Copy the Web App URL → paste into js/config.js as SCRIPT_URL
// ============================================================

const SPREADSHEET_ID = '1gHKb65Z-5WEcO6GxoJ8V4DRNh_F4Z9nGthMC7aWPewg'; // Replace with your Google Sheet ID

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  let params;
  try {
    params = JSON.parse(e.postData.contents);
  } catch(err) {
    params = e.parameter;
  }
  return handleRequest({ parameter: params });
}

function handleRequest(e) {
  const p      = e.parameter;
  const action = p.action;
  const sheet  = p.sheet;

  try {
    let result;
    switch(action) {
      case 'getAll':   result = getAll(sheet);              break;
      case 'append':   result = appendRow(sheet, p.row);   break;
      case 'update':   result = updateRow(sheet, p.id, p.row); break;
      case 'delete':   result = deleteRow(sheet, p.id);    break;
      default:         result = { success: false, error: 'Unknown action' };
    }
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── GET ALL ROWS ──
function getAll(sheetName) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, error: `Sheet "${sheetName}" not found` };

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] }; // header only

  const rows = data.slice(1); // skip header row
  return { success: true, data: rows };
}

// ── APPEND ROW ──
function appendRow(sheetName, rowJson) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, error: `Sheet "${sheetName}" not found` };

  const row = JSON.parse(rowJson);
  const id  = generateId();
  sheet.appendRow([id, ...row]);
  return { success: true, id: id };
}

// ── UPDATE ROW ──
function updateRow(sheetName, id, rowJson) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, error: `Sheet "${sheetName}" not found` };

  const data = sheet.getDataRange().getValues();
  const row  = JSON.parse(rowJson);

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      const rowNum = i + 1;
      // Update all columns except the ID (col 1)
      for (let j = 0; j < row.length; j++) {
        sheet.getRange(rowNum, j + 2).setValue(row[j]);
      }
      return { success: true };
    }
  }
  return { success: false, error: 'Row not found' };
}

// ── DELETE ROW ──
function deleteRow(sheetName, id) {
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { success: false, error: `Sheet "${sheetName}" not found` };

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, error: 'Row not found' };
}

// ── GENERATE UNIQUE ID ──
function generateId() {
  return 'id_' + new Date().getTime() + '_' + Math.random().toString(36).substr(2, 5);
}

// ============================================================
// SHEET SETUP HELPER — Run this ONCE to create headers
// Go to Apps Script → Run → setupSheets
// ============================================================
function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // USERS sheet
  let usersSheet = ss.getSheetByName('users');
  if (!usersSheet) usersSheet = ss.insertSheet('users');
  usersSheet.getRange(1, 1, 1, 10).setValues([[
    'id','username','password','role','name','gender','dob','contact','address','dateCreated'
  ]]);
  // Insert default admin account (password: admin123)
  usersSheet.appendRow([
    generateId(),'admin','admin123','ADMINISTRATOR',
    'Administrator','MALE','','','',new Date().toISOString()
  ]);

  // RESIDENTS sheet
  let resSheet = ss.getSheetByName('residents');
  if (!resSheet) resSheet = ss.insertSheet('residents');
  resSheet.getRange(1, 1, 1, 22).setValues([[
    'id','fname','lname','mname','nickname','dob','pob',
    'gender','contact','address',
    'skin','build','haircolor','hairtype','hairlength',
    'eyes','face','nose','ear','marks','complications','dateCreated'
  ]]);

  // BLOTTERS sheet
  let blotterSheet = ss.getSheetByName('blotters');
  if (!blotterSheet) blotterSheet = ss.insertSheet('blotters');
  blotterSheet.getRange(1, 1, 1, 13).setValues([[
    'id','incident','place','datetime',
    'complainantName','complainantAddress','complainantContact',
    'suspectName','suspectAddress',
    'witnessName','witnessAddress',
    'narrative','dateCreated'
  ]]);

  Logger.log('✅ Sheets setup complete!');
  Logger.log('Admin credentials: username=admin, password=admin123');
}
