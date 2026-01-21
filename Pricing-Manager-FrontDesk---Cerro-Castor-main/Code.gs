
/**
 * Serves the React Application
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Castor ERP - Gestión Integral')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * --- DB HELPERS ---
 */
function getOrInitUsersSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('DB_USUARIOS');
  if (!sheet) {
    sheet = ss.insertSheet('DB_USUARIOS');
    // Header
    sheet.appendRow(['Email', 'Password', 'Nombre', 'Permisos_JSON', 'Last_Login']);
    sheet.setFrozenRows(1);
    // Create Default Admin
    // Pass is "admin123" (Base64 encoded for simple obfuscation: YWRtaW4xMjM=)
    sheet.appendRow(['admin@cerrocastor.com', 'YWRtaW4xMjM=', 'Administrador', '["ADMIN","PRICING_ACCESS","GASTRO_ACCESS","STOCK_ACCESS"]', new Date()]);
  }
  return sheet;
}

/**
 * --- AUTH API ---
 */

function apiLogin(email, password) {
  const sheet = getOrInitUsersSheet();
  const data = sheet.getDataRange().getValues();
  
  // Simple obfuscation for transport (NOT SECURE for production, but fits GAS prototype)
  const inputHash = Utilities.base64Encode(password);

  // Skip header (row 0)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0] == email && row[1] == inputHash) {
      // Update Last Login
      sheet.getRange(i + 1, 5).setValue(new Date());
      
      return JSON.stringify({
        email: row[0],
        name: row[2],
        permissions: JSON.parse(row[3] || '[]')
      });
    }
  }
  throw new Error('Credenciales inválidas');
}

function apiGetUsers() {
  const sheet = getOrInitUsersSheet();
  const data = sheet.getDataRange().getValues();
  const users = [];
  
  for (let i = 1; i < data.length; i++) {
    users.push({
      email: data[i][0],
      name: data[i][2],
      permissions: JSON.parse(data[i][3] || '[]')
    });
  }
  return JSON.stringify(users);
}

function apiSaveUser(userJson, password) {
  const user = JSON.parse(userJson);
  const sheet = getOrInitUsersSheet();
  const data = sheet.getDataRange().getValues();
  
  let foundRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == user.email) {
      foundRow = i + 1;
      break;
    }
  }
  
  const permString = JSON.stringify(user.permissions);
  
  if (foundRow > 0) {
    // Update
    sheet.getRange(foundRow, 3).setValue(user.name);
    sheet.getRange(foundRow, 4).setValue(permString);
    if (password) {
      sheet.getRange(foundRow, 2).setValue(Utilities.base64Encode(password));
    }
  } else {
    // Insert
    if (!password) throw new Error("Password requerido para nuevo usuario");
    sheet.appendRow([user.email, Utilities.base64Encode(password), user.name, permString, '']);
  }
  return true;
}

/**
 * --- PRICING API (Existing) ---
 */

function apiSaveScenario(jsonString) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000); 
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('BD_HISTORICO');
    if (!sheet) {
      sheet = ss.insertSheet('BD_HISTORICO');
      sheet.appendRow(['ID', 'Fecha Cierre', 'Usuario', 'Temporada', 'Tipo', 'Nombre', 'JSON_DATA']);
      sheet.setFrozenRows(1);
    }
    const scenario = JSON.parse(jsonString);
    const userEmail = Session.getActiveUser().getEmail();
    const timestamp = new Date();
    sheet.appendRow([
      scenario.id, timestamp, userEmail, scenario.season, scenario.type, scenario.name, jsonString
    ]);
    CacheService.getScriptCache().remove('HISTORY_CACHE');
    return true;
  } catch (e) {
    throw new Error('Error saving data: ' + e.toString());
  } finally {
    lock.releaseLock();
  }
}

function apiSaveDraft(jsonString) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('DRAFT_STORE');
    if (!sheet) {
      sheet = ss.insertSheet('DRAFT_STORE');
      sheet.appendRow(['ID', 'Last Updated', 'Usuario', 'Nombre', 'JSON_DATA']);
      sheet.setFrozenRows(1);
    }
    const scenario = JSON.parse(jsonString);
    const id = scenario.id;
    const userEmail = Session.getActiveUser().getEmail();
    const timestamp = new Date();
    const lastRow = sheet.getLastRow();
    let foundRowIndex = -1;
    if (lastRow > 1) {
      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
      const index = ids.indexOf(id);
      if (index !== -1) foundRowIndex = index + 2; 
    }
    if (foundRowIndex !== -1) {
      sheet.getRange(foundRowIndex, 2).setValue(timestamp);
      sheet.getRange(foundRowIndex, 3).setValue(userEmail);
      sheet.getRange(foundRowIndex, 4).setValue(scenario.name);
      sheet.getRange(foundRowIndex, 5).setValue(jsonString);
    } else {
      sheet.appendRow([id, timestamp, userEmail, scenario.name, jsonString]);
    }
    return true;
  } catch (e) { return false; }
}

function apiGetHistory() {
  try {
    const cache = CacheService.getScriptCache();
    const cachedData = cache.get('HISTORY_CACHE');
    if (cachedData != null) return cachedData;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('BD_HISTORICO');
    if (!sheet) return JSON.stringify([]);
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return JSON.stringify([]); 
    
    const values = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
    const history = values.map(row => {
      const rawJson = row[6];
      if (!rawJson) return null;
      try {
        const scenario = JSON.parse(rawJson);
        return {
          scenarioId: scenario.id,
          name: scenario.name,
          season: scenario.season,
          scenarioType: scenario.type,
          status: scenario.status,
          closedAt: scenario.closedAt,
          data: scenario.calculatedData,
          params: scenario.params
        };
      } catch (e) { return null; }
    }).filter(item => item !== null);
    
    const resultJson = JSON.stringify(history.reverse());
    cache.put('HISTORY_CACHE', resultJson, 600);
    return resultJson;
  } catch (e) {
    throw new Error('Error retrieving history: ' + e.toString());
  }
}

function apiGetDefaultCoefficients() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('CONFIG_COEFFICIENTS');
    if (!sheet) {
      sheet = ss.insertSheet('CONFIG_COEFFICIENTS');
      sheet.appendRow(['Days', 'Discount Percentage']);
      sheet.setFrozenRows(1);
      const seedData = [[1, 0], [2, 2.5], [3, 5.0], [4, 7.5], [5, 10.0], [6, 12.0], [7, 14.0], [8, 16.0], [9, 18.0], [10, 20.0], [15, 25.0], [30, 35.0]];
      sheet.getRange(2, 1, seedData.length, 2).setValues(seedData);
      return JSON.stringify(seedData.map(r => ({ day: r[0], value: r[1] })));
    }
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return JSON.stringify([]);
    const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    const coefficients = values.map(row => ({ day: Number(row[0]), value: Number(row[1]) })).filter(c => !isNaN(c.day) && c.day > 0);
    return JSON.stringify(coefficients);
  } catch (e) {
    throw new Error('Error retrieving config: ' + e.toString());
  }
}
