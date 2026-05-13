import {db} from "../utils/db.js";

export function getByCuit(cuit) {
  return db.client.findUnique({ where: { cuit } });
}

export function update(cuit, data) {
  return db.client.update({ where: { cuit }, data });
}

export function remove(cuit) {
  return db.client.delete({ where: { cuit } });
}
