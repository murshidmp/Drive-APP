# Drive-APP
How to Use:

To utilize this code for uploading a file to Google Drive, follow these steps:

1.  Set up your Google Cloud project and enable the Google Drive API.

2.  Create a `config.json` file with the required credentials, token paths, and other configuration information.

3.  Ensure that you have Node.js installed on your system.

4.  Install the necessary npm packages using the following command:

    Copy code

    `npm install express googleapis`

5.  Start the Express server with the command:

    Copy code

    `node server.js`

You can make a POST request to `http://localhost:3000/api/upload` with the following JSON data using a POST request or `curl` command:

jsonCopy code

`{
  "fileId": "YOUR_FILE_ID",
  "folderId": "YOUR_FOLDER_ID",
  "fileName": "YOUR_FILE_NAME"
}`

Please note that this configuration contains a single Google Drive test account for both downloading and uploading. You have the option to use different Google accounts as needed.