import express from "express";
const app = express();
const parseBody = function (req, res, next) {
  const bodyChunks = [];
  req.on("data", (chunk) => bodyChunks.push(chunk));
  req.on("end", () => {
    const bodyString = Buffer.concat(bodyChunks).toString("utf8");
    let body;
    try {
      body = JSON.parse(bodyString);
    } catch (error) {
      res.status(400).send("Expected body to be JSON.");
      return;
    }
    if (!Array.isArray(body)) {
      res.status(400).send("Expected body to be array.");
      return;
    }
    const allString = body.every((item) => typeof item === "string");
    if (!allString) {
      res.status(400).send("Expected all array elements to be a string.");
      return;
    }
    req.body = body;
    next();
  });
};

const checkUsername = (req, res, next) => {
  req.username = req.get("X-Username") ?? null;
  next();
};
app.use(checkUsername);
app.use(parseBody);
app.post("/", (req, res) => {
  let response = "";
  if (req.username) {
    response += `You are authenticated as ${req.username}.`;
  } else {
    response += "You are not authenticated.";
  }
  const count = req.body.length;
  const subjectWord = count === 1 ? "subject" : "subjects";
  response += `\n\nYou have requested information about ${count} ${subjectWord}`;

  if (count > 0) {
    response += `: ${req.body.join(", ")}`;
  }
  response += ".";
  res.send(response);
});
app.listen(3000)