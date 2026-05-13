import * as clientService from "../services/client.service.js";

export async function getClient(req, res) {
  try {
    const cuit = req.params.cuit;
    const client = await clientService.getByCuit(cuit);
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateClientCtrl(req, res) {
  try {
    const cuit = req.params.cuit;
    const updated = await clientService.update(cuit, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteClientCtrl(req, res) {
  try {
    const cuit = req.params.cuit;
    const deleted = await clientService.remove(cuit);
    res.json(deleted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
