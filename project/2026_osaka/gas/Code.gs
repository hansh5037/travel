// 이 파일은 구글 시트에 직접 붙여넣는 Apps Script 코드입니다.
// 구글 시트 > 확장 프로그램 > Apps Script 에서 이 내용을 그대로 붙여넣고
// "배포 > 새 배포 > 웹 앱"으로 배포하세요. (실행: 나, 액세스 권한: 모든 사용자)
//
// 시트 구조: "ExtraCosts" 시트에 [id, day, desc, price] 열을 사용합니다.
// 시트가 없으면 첫 실행 시 자동으로 만들어집니다.

function doGet(e) {
  return jsonResponse(getAllRows());
}

function doPost(e) {
  const action = e.parameter.action;

  if (action === 'add') {
    const sheet = getSheet();
    const id = Utilities.getUuid();
    const day = e.parameter.day;
    const desc = e.parameter.desc || '';
    const price = Number(e.parameter.price);

    sheet.appendRow([id, day, desc, price]);
    return jsonResponse({ ok: true, id: id });
  }

  if (action === 'delete') {
    const sheet = getSheet();
    const id = e.parameter.id;
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ ok: false, error: 'unknown action' });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('ExtraCosts');

  if (!sheet) {
    sheet = ss.insertSheet('ExtraCosts');
    sheet.appendRow(['id', 'day', 'desc', 'price']);
  }

  return sheet;
}

function getAllRows() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    rows.push({
      id: data[i][0],
      day: Number(data[i][1]),
      key: data[i][2],
      price: Number(data[i][3])
    });
  }

  return rows;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
