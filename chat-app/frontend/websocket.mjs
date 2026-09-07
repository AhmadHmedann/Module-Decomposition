import {
  sortMessagesOldestFirst,
  validateMessage,
  addMessageIfNew,
  renderMessages,
} from "./shared.mjs";

const websocketURL = "wss://hm-chat-application.trainees.hosting.cyf.academy/";
const websocket = new WebSocket(websocketURL, "chat-protocol");
const rootEle = document.getElementById("messages-root");
const submitButton = document.getElementById("submit-button");
const formFeedbackMessage = document.getElementById("form-feedback");
const formElm = document.getElementById("message-form");

let messages = [];

function handleReceivedMessage(receivedObject) {
  if (receivedObject.type === "message-history") {
    messages = sortMessagesOldestFirst(receivedObject.data);
    renderMessages(messages, rootEle);
  }
  if (receivedObject.type === "message-added") {
    const newMessage = receivedObject.data;
    addMessageIfNew(messages, newMessage);
  }
  if (receivedObject.type === "error") {
    formFeedbackMessage.textContent = receivedObject.data;
    formFeedbackMessage.className = "error";
  }
  if (receivedObject.type === "message-sent") {
    formFeedbackMessage.textContent = receivedObject.data;
    formFeedbackMessage.className = "success";
    formElm.reset();

    setTimeout(() => {
      formFeedbackMessage.textContent = "";
      formFeedbackMessage.className = "";
    }, 1000);
  }
  if (receivedObject.type === "updatedMessage") {
    const updatedMessage = messages.find(
      (message) => message.id === receivedObject.data.messageId,
    );
    updatedMessage.likesCount = receivedObject.data.likesCount;
    updatedMessage.dislikesCount = receivedObject.data.dislikesCount;
    renderMessages(messages, rootEle);
  }
}

websocket.addEventListener("open", () => {
  submitButton.disabled = false;
});

websocket.addEventListener("error", () => {
  console.error("Websocket connection failed");
});
websocket.addEventListener("close", () => {
  submitButton.disabled = true;
});
websocket.addEventListener("message", (event) => {
  const receivedObject = JSON.parse(event.data);
  handleReceivedMessage(receivedObject);
});

function handleSubmitMessage(event) {
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
  const newMessage = {
    username: username,
    message: message,
  };

  websocket.send(JSON.stringify({ type: "newMessage", data: newMessage }));
}
function handleReaction(event) {
  const reactionBtn = event.target.closest(".reaction-btn");
  if (!reactionBtn) return;
  const messageElm = event.target.closest(".show-message");

  const action = reactionBtn.dataset.action;
  const messageId = messageElm.dataset.messageId;
  const messageReaction = {
    type: "reaction",
    data: { messageId: Number(messageId), action: action },
  };
  websocket.send(JSON.stringify(messageReaction));
}

formElm.addEventListener("submit", handleSubmitMessage);
rootEle.addEventListener("click", handleReaction);
