import admin from "./admin.js";

export const db = admin.firestore();
export const bucket = admin.storage().bucket();
export default admin;
