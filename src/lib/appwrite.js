// src/lib/appwrite.js
import { Client, Account, Databases, Functions } from "appwrite";

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT || "68b1072d00299f0f88b9");

export const account = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);
