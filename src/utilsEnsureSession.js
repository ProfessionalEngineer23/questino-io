// src/utilsEnsureSession.js
import { account } from "./lib/appwrite";

export async function ensureSession() {
  try {
    await account.get();
  } catch {
    await account.createAnonymousSession();
  }
}
