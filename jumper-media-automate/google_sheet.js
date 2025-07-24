const fs = require("fs");
const mime = require("mime-types");
const { google } = require("googleapis");
const path = require("path");
const { parse } = require("csv-parse/sync");
// Load OAuth2 client
const { appendToLogReport } = require("./processing_report/process_report");
const CREDENTIALS_PATH = process.env.CREDENTIALS_PATH;
const TOKEN_PATH = process.env.TOKEN_PATH;

async function storeCSVInGoogleSheet(
  fileId,
  filepath,
  name = "Cannibalization"
) {
  try {
    const auth = await authenticate();
    const sheetUrl = await uploadCSVAsGoogleSheet(auth, fileId, filepath, name);

    return sheetUrl;
  } catch (err) {
    console.error("Error:", err.message);
  }
}

async function createGoogleDocFile(title, content) {
  console.log("Content:::", content);
  const auth = await authenticate();
  const docs = google.docs({ version: "v1", auth });
  const drive = google.drive({ version: "v3", auth });

  // Step 1: Create the empty Google Doc
  const doc = await docs.documents.create({
    requestBody: { title },
  });

  const documentId = doc.data.documentId;

  // Step 2: Add plain text to the doc
  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [
        {
          insertText: {
            location: { index: 1 },
            text: content.toString(), // Ensures it's a string
          },
        },
      ],
    },
  });

  // Step 3: Make it public (read-only)
  await drive.permissions.create({
    fileId: documentId,
    requestBody: {
      type: "anyone",
      role: "reader",
    },
  });

  // Step 4: Return the public link
  return `https://docs.google.com/document/d/${documentId}/edit`;
}

async function authenticate() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_secret, client_id, redirect_uris } =
    credentials.installed || credentials.web;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  if (fs.existsSync(TOKEN_PATH)) {
    oAuth2Client.setCredentials(JSON.parse(fs.readFileSync(TOKEN_PATH)));
  } else {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/drive.file"],
    });

    console.log("Authorize this app by visiting this URL:", authUrl);
    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const code = await new Promise((resolve) =>
      readline.question("Enter the code from that page here: ", (answer) => {
        readline.close();
        resolve(answer);
      })
    );

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    console.log("Token stored to", TOKEN_PATH);
  }

  return oAuth2Client;
}

async function uploadCSVAsGoogleSheet(auth, fileId, filePath, sheetName) {
  const sheets = google.sheets({ version: "v4", auth });

  // const content = fs.readFileSync(path.join(__dirname, filePath));
  // const rows = parse(content, { skip_empty_lines: true });
  // 1. Read and properly parse the CSV
  const content = fs.readFileSync(path.join(__dirname, filePath), "utf8");

  // Remove UTF-8 BOM if present and parse
  const rows = parse(content.replace(/^\uFEFF/, ""), {
    skip_empty_lines: true,
    relax_quotes: true, // Handles malformed quotes
    trim: true, // Trims whitespace
    skip_lines_with_error: true, // Skips problematic lines
  });

  // 1. Add a new sheet (tab) to the existing spreadsheet
  const addSheetRes = await sheets.spreadsheets.batchUpdate({
    spreadsheetId: fileId,
    requestBody: {
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetName
                .replace(".csv", "")
                .replace(/^./, (c) => c.toUpperCase()),
            },
          },
        },
      ],
    },
  });

  const newSheetId = addSheetRes.data.replies[0].addSheet.properties.sheetId;

  await sheets.spreadsheets.values.update({
    spreadsheetId: fileId,
    range: `${sheetName
      .replace(".csv", "")
      .replace(/^./, (c) => c.toUpperCase())}!A1`,
    valueInputOption: "RAW",
    requestBody: {
      values: rows,
    },
  });

  // 3. Style the header row and auto-resize columns
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: fileId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId: newSheetId,
              startRowIndex: 0,
              endRowIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.2, green: 0.6, blue: 1.0 },
                textFormat: {
                  foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                  bold: true,
                },
              },
            },
            fields: "userEnteredFormat(backgroundColor,textFormat)",
          },
        },
        {
          autoResizeDimensions: {
            dimensions: {
              sheetId: newSheetId,
              dimension: "COLUMNS",
              startIndex: 0,
            },
          },
        },
      ],
    },
  });

  return `https://docs.google.com/spreadsheets/d/${fileId}/edit#gid=${newSheetId}`;
}

async function createGoogleSheetFile(businessUrl, filePath, folderId) {
  try {
    const auth = await authenticate();
    const drive = google.drive({ version: "v3", auth });
    const sheets = google.sheets({ version: "v4", auth });

    const fileMetadata = {
      name: `Audit-${businessUrl}`,
      mimeType: "application/vnd.google-apps.spreadsheet",
      parents: [folderId],
    };

    console.log("________________pick________________");
    const media = {
      mimeType: "text/csv",
      // body: fs.createReadStream(path.join(__dirname, filePath)),
      body: fs.createReadStream(filePath),
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: "id",
    });

    const fileId = file.data.id;

    // Share the file with anyone (read-only)
    await drive.permissions.create({
      fileId,
      resource: {
        role: "reader",
        type: "anyone",
      },
    });

    // Get the sheetId of the first/default sheet
    const sheetMeta = await sheets.spreadsheets.get({
      spreadsheetId: fileId,
    });

    const sheetId = sheetMeta.data.sheets[0].properties.sheetId;

    // Style the header row and auto-resize columns
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: fileId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId,
                startRowIndex: 0,
                endRowIndex: 1, // First row
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.6, blue: 1.0 },
                  textFormat: {
                    foregroundColor: { red: 1.0, green: 1.0, blue: 1.0 },
                    bold: true,
                  },
                },
              },
              fields: "userEnteredFormat(backgroundColor,textFormat)",
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId,
                dimension: "COLUMNS",
                startIndex: 0,
              },
            },
          },
        ],
      },
    });

    appendToLogReport({
      source: "Google Drive",
      purpose: "Adding Google Sheet",
      success: true,
      error: "",
    });
    if(fileId) {
      console.log("<<Google sheet file creation success>>")
    }
    return fileId; // Return the spreadsheet ID
  } catch (error) {
    console.log("___________________GOOGLE SHEET ERROR______________\n");
    console.log("Error Message:", error.message);
    appendToLogReport({
      source: "Google Drive",
      purpose: "Adding Google Sheet",
      success: true,
      error: error.message,
    });
    return false;
  }
}

async function createGoogleDriveFolder(folderName) {
  try {
    const auth = await authenticate();
    const drive = google.drive({ version: "v3", auth });

    // Create folder
    const fileMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    };

    const folder = await drive.files.create({
      resource: fileMetadata,
      fields: "id",
    });

    const folderId = folder.data.id;

    // Make the folder public (read-only)
    await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    appendToLogReport({
      source: "Google Drive",
      purpose: "creating folder",
      success: true,
      error: "",
    });

    return {
      id: folderId,
      url: `https://drive.google.com/drive/folders/${folderId}`,
    };
  } catch (error) {
    appendToLogReport({
      source: "Google Drive",
      purpose: "creating folder",
      success: false,
      error: error.message,
    });
    console.log(
      "____________________________Google Driver folder creation Error"
    );
    console.log("Error Message:", error.message);
    return false;
  }
}

async function uploadDocxToGoogleDrive(filePath, fileName, folderId) {
  try {
    const auth = await authenticate();
    const drive = google.drive({ version: "v3", auth });

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx MIME type
    };

    const media = {
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id",
    });

    const fileId = response.data.id;

    // Make the file public (read-only)
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    return `https://drive.google.com/file/d/${fileId}/view`;
  } catch (error) {
    console.error("Error uploading DOCX file:", error.message);
    return false;
  }
}

module.exports = {
  storeCSVInGoogleSheet,
  createGoogleSheetFile,
  createGoogleDocFile,
  createGoogleDriveFolder,
  uploadDocxToGoogleDrive,
};
