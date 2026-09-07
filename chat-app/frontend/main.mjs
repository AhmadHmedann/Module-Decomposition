import {sortMessagesOldestFirst, validateMessage,addMessageIfNew,MessageCard,renderMessages } from "./shared.mjs";
// const backend = "https://hm-chat-application.trainees.hosting.cyf.academy/";
const backend = "http://localhost:4000/";
let messages = [];
const formFeedbackMessage = document.getElementById("form-feedback");
const formElm = document.getElementById("message-form");
const rootEle = document.getElementById("messages-root");



async function fetchMessages() {
  try {
    const response = await fetch(backend);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    messages = await response.json();
    sortMessagesOldestFirst(messages);
    renderMessages(messages,rootEle);
    keepFetchingMessages();
  } catch (error) {
    console.error("Failed to fetch messages: ", error);
  }
}
async function keepFetchingMessages() {
  try {
    const lastMessageTime =
      messages.length !== 0
        ? messages[messages.length - 1].createdAt
        : new Date(0).toISOString();

    const queryString = lastMessageTime
      ? `?since=${encodeURIComponent(lastMessageTime)}`
      : "";
    const URl = `${backend}${queryString}`;

    const response = await fetch(URl);
    if (!response.ok) {
      const responseMessage = await response.text();
      throw new Error(responseMessage || `HTTP error : ${response.status}`);
    }
    const newMessages = await response.json();
    // const messageRoot = document.getElementById("messages-root");

    newMessages.forEach((message) => {
      addMessageIfNew(messages,message);
    });
    keepFetchingMessages();
  } catch (error) {
    console.error("Failed to check for new messages:", error);
    setTimeout(keepFetchingMessages, 3000);
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  formFeedbackMessage.textContent = "";
  const username = document.getElementById("username-input").value.trim();
  const message = document.getElementById("message-input").value.trim();
  const validateMessageError = validateMessage(username, message);
  if (validateMessageError !== null) {
    formFeedbackMessage.textContent = validateMessageError;
    formFeedbackMessage.className = "error";
    return;
  }
  const messageObj = {
    username: username,
    message: message,
  };
  const messageJSON = JSON.stringify(messageObj);
  try {
    const response = await fetch(backend, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: messageJSON,
    });
    if (!response.ok) {
      const responseMessage = await response.text();
      throw new Error(responseMessage || `HTTP error; ${response.status}`);
    }
    const newMessage = await response.json();
    addMessageIfNew(messages,newMessage);

    formFeedbackMessage.textContent = "Message sent successfully.";
    formFeedbackMessage.className = "success";
    formElm.reset();
  } catch (error) {
    formFeedbackMessage.textContent =
      error.message || "Failed to send the message. Please try again.";
    formFeedbackMessage.className = "error";
  }
}

fetchMessages();
formElm.addEventListener("submit", handleSubmit);
