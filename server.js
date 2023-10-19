const express = require("express");
const driveHandler = require("./driveHandler.js");
const app = express();
const port = 3000;

// Middleware to parse JSON data
app.use(express.json());

// Define a route to handle POST requests
app.post("/api/upload", async (req, res) => {
  const { fileId, folderId, fileName } = req.body; // The data sent in the POST request
  console.log(req.body);
  driveHandler.start(fileId, folderId, fileName, (resp) => {
    if (resp) return res.json({ result: "true", id: resp });
    res.json({ result: "false" });
  });

  // You can process the data here and send a response
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
