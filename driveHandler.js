const fs = require("fs").promises;
const fss = require("fs");
const path = require("path");
const process = require("process");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");
const { json } = require("express");
const { drive } = require("googleapis/build/src/apis/drive");
const config = JSON.parse(fss.readFileSync("config.json"));
// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/drive"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH_DW = path.join(process.cwd(), config.download_token);
const CREDENTIALS_PATH_DW = path.join(process.cwd(), config.download_cred);
const TOKEN_PATH_UP = path.join(process.cwd(), config.upload_token);
const CREDENTIALS_PATH_UP = path.join(process.cwd(), config.upload_cred);

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist(tokenPath) {
  try {
    const content = await fs.readFile(tokenPath);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    console.log(err);
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize(tokenPath, credPath) {
  let client = await loadSavedCredentialsIfExist(tokenPath);
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: credPath,
  });
  console.log("after client");
  console.log(client);
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 */
async function listFiles(authClient) {
  const drive = google.drive({ version: "v3", auth: authClient });
  const res = await drive.files.list({
    pageSize: 10,
    fields: "nextPageToken, files(id, name)",
  });
  const files = res.data.files;
  if (files.length === 0) {
    console.log("No files found.");
    return;
  }

  console.log("Files:");
  files.map((file) => {
    console.log(`${file.name} (${file.id})`);
  });
}

async function main(
  authClientDw,
  authClientUp,
  fileId,
  folderId,
  fileName,
  callback
) {
  const driveDw = google.drive({ version: "v3", auth: authClientDw });
  const driveUp = google.drive({ version: "v3", auth: authClientUp });

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };
  driveDw.files.get(
    {
      fileId: fileId,
      alt: "media",
    },
    { responseType: "stream" },
    async function (err, res) {
      if (err) {
        console.log(err);
        callback(err, null);
      }
      const media = {
        mimeType: "video/*",
        body: res.data,
      };
      let file;
      try {
        file = await driveUp.files.create({
          resource: fileMetadata,
          media: media,
          fields: "id",
        });
      } catch (error) {
        callback(error, null);
      }

      console.log("File Id:", file.data.id);
      callback(null, file.data.id);
      res.data
        .on("end", () => {
          console.log("Done");
        })
        .on("error", (err) => {
          callback(err, null);
          console.log("Error", err);
        });
      // .pipe(dest)
      return file.data.id;
    }
  );
  
}

exports.start = async (fileId, folderId, fileName, cb) => {
  const authClientDw = await authorize(TOKEN_PATH_DW, CREDENTIALS_PATH_DW);
  const authClientUp = await authorize(TOKEN_PATH_UP, CREDENTIALS_PATH_UP);
  main(authClientDw, authClientUp, fileId, folderId, fileName, (err, id) => {
    if (err) cb(false);
    else cb(id);
  });
};
