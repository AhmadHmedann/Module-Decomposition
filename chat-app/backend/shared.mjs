export function validateBody(body) {
  if (
    typeof body != "object" ||
    body === null ||
    Array.isArray(body) ||
    !("message" in body) ||
    !("username" in body)
  ) {
    return "Expected body to be a JSON object containing keys message and username.";
  }
  if (typeof body.message !== "string" || typeof body.username !== "string")
    return "Message and username must be strings.";

  return null;
}
export function validateMessage(trimmedMessage, trimmedUsername) {
  if (trimmedMessage.length < 1 || trimmedMessage.length > 500)
    return "Message must be between 1 and 500 characters.";

  if (trimmedUsername.length < 2 || trimmedUsername.length > 100)
    return "Username must be between 2 and 100 characters.";

  return null;
}
