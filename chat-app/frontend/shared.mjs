export function sortMessagesOldestFirst(messages) {
  return messages.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function validateMessage(trimmedUsername, trimmedMessage) {
  if (trimmedUsername.length === 0) {
    return "The username cannot be empty or contain only spaces.";
  }
  if (trimmedMessage.length === 0) {
    return "The message cannot be empty or contain only spaces.";
  }
  if (trimmedMessage.length < 1 || trimmedMessage.length > 500)
    return "Message must be between 1 and 500 characters.";

  if (trimmedUsername.length < 2 || trimmedUsername.length > 100)
    return "Username must be between 2 and 100 characters.";

  return null;
}
export function addMessageIfNew(messages,newMessage) {
  const alreadyExists = messages.some(
    (message) => message.id === newMessage.id,
  );
  if (alreadyExists) {
    return;
  }
  messages.push(newMessage);
  const newMessageCard = MessageCard(newMessage);
  const messageRoot = document.getElementById("messages-root");
  if (messages.length === 1) {
    messageRoot.textContent = "";
  }
  messageRoot.append(newMessageCard);
}

export function MessageCard({ id, username, message, createdAt,likesCount,dislikesCount }) {
  const template = document.getElementById("show-message-template");
  const card = template.content.cloneNode(true);
  
  const usernameEle = card.querySelector(".message-username");
  usernameEle.textContent = username;

  const messageEle = card.querySelector(".message-content");
  messageEle.textContent = message;

  const timeEle = card.querySelector(".message-created-time");
  timeEle.textContent = new Date(createdAt).toLocaleString();
  timeEle.dateTime = createdAt;

  const messageElm = card.querySelector(".show-message");
  messageElm.dataset.messageId = id;

  const likeBtn = card.querySelector(`[data-action="like"]`);
  likeBtn.textContent = `❤️ ${(likesCount)??0}`;
  const dislikeBtn = card.querySelector(`[data-action="dislike"]`)
  dislikeBtn.textContent = `👎${(dislikesCount??0)}`;

  return card;
}
export function renderMessages(messages,rootEle) {
  rootEle.textContent = "";
  if (messages.length === 0) {
    rootEle.textContent = "There are no messages to display :(";
    return;
  }
  messages.forEach((message) => {
    const card = MessageCard(message);
    rootEle.append(card);
  });
}
