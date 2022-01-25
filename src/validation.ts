export function validateUsername(username: any): [undefined, string] | [string] {
  if (typeof username !== "string" || username.length === 0 || username.length > 64) {
    return [undefined, "'username' must be a string between 1 and 64 characters in length"];
  }
  return [username];
}

export function validatePassword(password: any): [undefined, string] | [string] {
  if (typeof password !== "string" || password.length < 6 || password.length > 64) {
    return [undefined, "'password' must be a string between 6 and 64 characters in length"];
  }
  return [password];
}
