export function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Secret, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
}

export function sendJson(res, status, payload) {
  setCors(res);
  res.status(status).json(payload);
}

export function handleOptions(req, res) {
  if (req.method !== "OPTIONS") {
    return false;
  }
  setCors(res);
  res.status(204).end();
  return true;
}

export async function readRawBody(req, limitBytes = 5_000_000) {
  if (Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === "string") {
    return Buffer.from(req.body);
  }
  if (req.body && typeof req.body === "object") {
    return Buffer.from(JSON.stringify(req.body));
  }

  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    total += buffer.length;
    if (total > limitBytes) {
      throw new Error("El cuerpo de la solicitud es demasiado grande.");
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}

export async function readJsonBody(req, limitBytes = 5_000_000) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  const raw = await readRawBody(req, limitBytes);
  if (!raw.length) {
    return {};
  }
  try {
    return JSON.parse(raw.toString("utf8"));
  } catch {
    throw new Error("La solicitud no contiene JSON válido.");
  }
}

export function getAdminSecret(req) {
  return String(req.headers["x-admin-secret"] || "").trim();
}

export function requireAdmin(req) {
  const expected = String(process.env.ADMIN_SECRET || "").trim();
  if (!expected) {
    const error = new Error("ADMIN_SECRET no está configurado en el servidor.");
    error.statusCode = 503;
    throw error;
  }
  if (getAdminSecret(req) !== expected) {
    const error = new Error("Código de administración incorrecto.");
    error.statusCode = 401;
    throw error;
  }
}

export function errorResponse(res, error) {
  const status = Number(error?.statusCode) || 500;
  sendJson(res, status, {
    ok: false,
    error: error?.message || "Error interno del servidor."
  });
}
