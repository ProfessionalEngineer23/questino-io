import { Client, Databases, Account } from "appwrite";

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || "68b10a4800298b059cf0");

export const db = new Databases(client);
export const account = new Account(client);
