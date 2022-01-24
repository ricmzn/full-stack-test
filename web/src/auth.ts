import axios from "axios";
import jwtDecode, { JwtPayload } from "jwt-decode";
import pkg from "../../package.json";

export interface Token extends JwtPayload {
  uid?: number;
}

export function getToken(decode = true) {
  const token = localStorage.getItem(`${pkg.name}-token`);
  try {
    const decoded = token && jwtDecode<Token>(token);
    if (token && decoded && decoded.uid) {
      if (decode) {
        return decoded;
      } else {
        return token;
      }
    }
  } catch (err) {
    console.error("Failed to decode JWT key: ", err);
  }
}

export function setToken(token: string) {
  localStorage.setItem(`${pkg.name}-token`, token);
}

export function refreshToken() {
  const token = getToken(false) as string;
  if (token) {
    axios.defaults.headers.common["authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["authorization"];
  }
}
