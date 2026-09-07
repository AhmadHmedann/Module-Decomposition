import express from "express";
import cors from "cors";
import { validateBody,validateMessage } from "./shared.mjs";

const app = express();
app.use(cors());
const port = 4000;

const callbacksForNewMessages = [];
const messages = [];
let nextMessageId = 1;


app.get("/", (req, res) => {
  const since = req.query.since;
  if (since === undefined) {
    res.json(messages);
    return;
  }
  const sinceTime = new Date(since).getTime();
  if (Number.isNaN(sinceTime)) {
    res.status(400).send("Invalid timestamp");
    return;
  }
  const messagesToSend = messages.filter((message) => {
    const messageTime = new Date(message.createdAt).getTime();
    return messageTime > sinceTime;
  });
  if (messagesToSend.length === 0) {
    callbacksForNewMessages.push((value) => res.json(value));
  } else {
    res.json(messagesToSend);
  }
});

app.post("/", (req, res) => {
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
    const validateBodyError = validateBody(body);
    if (validateBodyError !== null) {
      res.status(400).send(validateBodyError);
      return;
    }

    const message = body.message.trim();
    const username = body.username.trim();
    const validateMessageError = validateMessage(message, username);
    if (validateMessageError !== null) {
      res.status(400).send(validateMessageError);
      return;
    }
    const newMessage = {
      id: nextMessageId++,
      message: message,
      username: username,
      createdAt: new Date().toISOString(),
    };
    messages.push(newMessage);
    while (callbacksForNewMessages.length > 0) {
      const callback = callbacksForNewMessages.pop();
      callback([newMessage]);
    }
    res.status(201).json(newMessage);
  });
});

app.listen(port, () => {
  console.error(`Chat server listening on port ${port}`);
});
