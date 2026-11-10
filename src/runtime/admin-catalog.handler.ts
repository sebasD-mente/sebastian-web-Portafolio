import { timingSafeEqual } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import {
  buildRuntimeLogEntry,
  createCorrelationId
} from "@/runtime/logger";
import {
  deleteCatalogSystemBySlugAsync,
  getCatalogSectionsConfig,
  getCatalogSystemBySlugAsync,
  getDefaultCatalogUploadsDir,
  getDefaultSystemTemplateInput,
  listCatalogSystemsAsync,
  upsertCatalogSystemAsync,
  validateCatalogSystemUpsertPayload
} from "@/service/systems.service";
import type {
  AsyncCatalogRepository,
  CatalogSectionDescriptor,
  CatalogSectionId,
  ProductionSystem,
  ProductionSystemUpsertInput,
  RuntimeLogEntry
} from "@/types/portfolio";

export const ALLOWED_UPLOAD_MIME_TYPES = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp"
} as const;

export type AllowedUploadMimeType = keyof typeof ALLOWED_UPLOAD_MIME_TYPES;

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const SAFE_ASSET_FILENAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,120}\.(?:png|jpg|jpeg|webp)$/i;

export interface AdminCatalogHandlerOptions {
  adminAccessKey?: string;
  uploadsDir?: string;
  repo?: AsyncCatalogRepository;
}

export interface AdminSystemsListSuccessPayload {
  ok: true;
  systems: ProductionSystem[];
  sections: Record<CatalogSectionId, CatalogSectionDescriptor>;
  template: ProductionSystemUpsertInput;
  correlationId: string;
  runtimeLog: RuntimeLogEntry;
}

export interface AdminSystemSingleSuccessPayload {
  ok: true;
  system: ProductionSystem;
  correlationId: string;
  runtimeLog: RuntimeLogEntry;
}

export interface AdminSystemDeleteSuccessPayload {
  ok: true;
  deletedSlug: string;
  correlationId: string;
  runtimeLog: RuntimeLogEntry;
}

export interface AdminUploadedAssetDescriptor {
  filename: string;
  url: string;
  mimeType: AllowedUploadMimeType;
  sizeBytes: number;
}

export interface AdminUploadSuccessPayload {
  ok: true;
  asset: AdminUploadedAssetDescriptor;
  correlationId: string;
  runtimeLog: RuntimeLogEntry;
}

export interface AdminCatalogErrorPayload {
  ok: false;
  message: string;
  errors?: Record<string, string>;
  correlationId: string;
  runtimeLog: RuntimeLogEntry;
}

function resolveExpectedAdminKey(options?: AdminCatalogHandlerOptions): string {
  if (typeof options?.adminAccessKey === "string") {
    return options.adminAccessKey.trim();
  }
  const envKey = process.env.ADMIN_ACCESS_KEY?.trim();
  if (envKey && envKey.length > 0) {
    return envKey;
  }
  if (process.env.NODE_ENV !== "production") {
    return "dekolabs-admin-dev-key";
  }
  return "";
}

function extractIncomingAdminKey(request: Request): string {
  const headerKey = request.headers.get("x-admin-key")?.trim();
  if (headerKey) {
    return headerKey;
  }
  const authHeader = request.headers.get("authorization")?.trim() ?? "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  return "";
}

export function isAdminRequestAuthorized(
  request: Request,
  options?: AdminCatalogHandlerOptions
): boolean {
  const expected = resolveExpectedAdminKey(options);
  const provided = extractIncomingAdminKey(request);
  if (!expected || !provided) {
    return false;
  }
  const expectedBuf = Buffer.from(expected, "utf8");
  const providedBuf = Buffer.from(provided, "utf8");
  if (expectedBuf.byteLength !== providedBuf.byteLength) {
    return false;
  }
  return timingSafeEqual(expectedBuf, providedBuf);
}

function buildUnauthorizedResponse(
  action: string,
  correlationId: string,
  startMs: number
): Response {
  const durationMs = Math.max(1, Date.now() - startMs);
  const runtimeLog = buildRuntimeLogEntry({
    level: "warn",
    component: "runtime.admin-catalog.handler",
    action: `${action} (unauthorized)`,
    durationMs,
    input: { authHeaderPresent: false },
    output: null,
    error: {
      message: "Acceso denegado: clave ADMIN_ACCESS_KEY ausente o inválida.",
      why: "Los endpoints de administración del catálogo operan bajo política Fail-Closed.",
      fix: "Proporciona la cabecera 'x-admin-key' o 'Authorization: Bearer <ADMIN_ACCESS_KEY>'."
    },
    correlationId
  });

  const payload: AdminCatalogErrorPayload = {
    ok: false,
    message: "No autorizado. Verifica tu clave de acceso de administrador (ADMIN_ACCESS_KEY).",
    correlationId,
    runtimeLog
  };

  return Response.json(payload, {
    status: 401,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "x-correlation-id": correlationId
    }
  });
}

function safeRevalidateCatalogPaths(slug?: string): void {
  try {
    revalidatePath("/");
    revalidatePath("/admin/proyectos");
    if (slug) {
      revalidatePath(`/sistemas/${slug}`);
    }
  } catch {
    // En pruebas unitarias fuera del contexto estático de Next.js, revalidatePath es un no-op seguro.
  }
}

export async function handleAdminSystemsGet(
  request: Request,
  options?: AdminCatalogHandlerOptions
): Promise<Response> {
  const startMs = Date.now();
  const correlationId =
    request.headers.get("x-correlation-id")?.trim() ||
    createCorrelationId("adm-get");

  if (!isAdminRequestAuthorized(request, options)) {
    return buildUnauthorizedResponse("GET /api/admin/systems", correlationId, startMs);
  }

  let slugFilter: string | null = null;
  try {
    const parsedUrl = new URL(request.url, "http://localhost:3000");
    slugFilter = parsedUrl.searchParams.get("slug")?.trim() || null;
  } catch {
    slugFilter = null;
  }

  if (slugFilter) {
    const system = await getCatalogSystemBySlugAsync(slugFilter, options?.repo);
    const durationMs = Math.max(1, Date.now() - startMs);

    if (!system) {
      const runtimeLog = buildRuntimeLogEntry({
        level: "warn",
        component: "runtime.admin-catalog.handler",
        action: "GET /api/admin/systems (not-found)",
        durationMs,
        input: { slug: slugFilter },
        output: null,
        error: {
          message: `No se encontró ningún sistema con slug '${slugFilter}'.`,
          why: "El slug solicitado no existe en el catálogo actual.",
          fix: "Verifica el slug o consulta GET /api/admin/systems sin filtro."
        },
        correlationId
      });

      return Response.json(
        {
          ok: false,
          message: `El proyecto '${slugFilter}' no existe.`,
          correlationId,
          runtimeLog
        } satisfies AdminCatalogErrorPayload,
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store, max-age=0",
            "x-correlation-id": correlationId
          }
        }
      );
    }

    const runtimeLog = buildRuntimeLogEntry({
      level: "info",
      component: "runtime.admin-catalog.handler",
      action: "GET /api/admin/systems (single)",
      durationMs,
      input: { slug: slugFilter },
      output: { slug: system.slug, catalogSection: system.catalogSection },
      error: null,
      correlationId
    });

    return Response.json(
      {
        ok: true,
        system,
        correlationId,
        runtimeLog
      } satisfies AdminSystemSingleSuccessPayload,
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "x-correlation-id": correlationId
        }
      }
    );
  }

  const systems = await listCatalogSystemsAsync(options?.repo);
  const sections = getCatalogSectionsConfig();
  const template = getDefaultSystemTemplateInput();
  const durationMs = Math.max(1, Date.now() - startMs);

  const runtimeLog = buildRuntimeLogEntry({
    level: "info",
    component: "runtime.admin-catalog.handler",
    action: "GET /api/admin/systems",
    durationMs,
    input: { filter: "all" },
    output: { totalSystems: systems.length },
    error: null,
    correlationId
  });

  const payload: AdminSystemsListSuccessPayload = {
    ok: true,
    systems,
    sections,
    template,
    correlationId,
    runtimeLog
  };

  return Response.json(payload, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "x-correlation-id": correlationId
    }
  });
}

async function handleAdminSystemsUpsertCommon(
  request: Request,
  method: "POST" | "PUT",
  options?: AdminCatalogHandlerOptions
): Promise<Response> {
  const startMs = Date.now();
  const correlationId =
    request.headers.get("x-correlation-id")?.trim() ||
    createCorrelationId(method === "POST" ? "adm-post" : "adm-put");

  if (!isAdminRequestAuthorized(request, options)) {
    return buildUnauthorizedResponse(
      `${method} /api/admin/systems`,
      correlationId,
      startMs
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    const durationMs = Math.max(1, Date.now() - startMs);
    const runtimeLog = buildRuntimeLogEntry({
      level: "warn",
      component: "runtime.admin-catalog.handler",
      action: `${method} /api/admin/systems (invalid-json)`,
      durationMs,
      input: "invalid-json-payload",
      output: null,
      error: {
        message: "El cuerpo de la solicitud no es un JSON válido.",
        why: "El endpoint de administración exige un payload JSON estructurado.",
        fix: "Envía un objeto JSON válido con los datos del proyecto."
      },
      correlationId
    });

    return Response.json(
      {
        ok: false,
        message: "Formato JSON inválido en la solicitud.",
        correlationId,
        runtimeLog
      } satisfies AdminCatalogErrorPayload,
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "x-correlation-id": correlationId
        }
      }
    );
  }

  const validation = validateCatalogSystemUpsertPayload(rawBody);
  if (!validation.valid || !validation.input) {
    const durationMs = Math.max(1, Date.now() - startMs);
    const runtimeLog = buildRuntimeLogEntry({
      level: "warn",
      component: "runtime.admin-catalog.handler",
      action: `${method} /api/admin/systems (validation-failed)`,
      durationMs,
      input: { invalidFields: Object.keys(validation.errors) },
      output: null,
      error: {
        message: "Validación de campos fallida al guardar el proyecto.",
        why: "Todos los campos obligatorios y la categoría deben ser válidos antes de persistir.",
        fix: "Revisa el objeto 'errors' devuelto en la respuesta."
      },
      correlationId
    });

    return Response.json(
      {
        ok: false,
        message: "Por favor revisa los campos obligatorios del proyecto.",
        errors: validation.errors,
        correlationId,
        runtimeLog
      } satisfies AdminCatalogErrorPayload,
      {
        status: 422,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "x-correlation-id": correlationId
        }
      }
    );
  }

  const savedSystem = await upsertCatalogSystemAsync(
    validation.input,
    options?.repo
  );
  safeRevalidateCatalogPaths(savedSystem.slug);

  const durationMs = Math.max(1, Date.now() - startMs);
  const runtimeLog = buildRuntimeLogEntry({
    level: "info",
    component: "runtime.admin-catalog.handler",
    action: `${method} /api/admin/systems`,
    durationMs,
    input: {
      slug: savedSystem.slug,
      catalogSection: savedSystem.catalogSection,
      gallerySlotsPopulated: (savedSystem.galleryImages ?? []).filter(
        (g) => g.src.trim().length > 0
      ).length
    },
    output: {
      id: savedSystem.id,
      slug: savedSystem.slug,
      catalogSection: savedSystem.catalogSection
    },
    error: null,
    correlationId
  });

  const payload: AdminSystemSingleSuccessPayload = {
    ok: true,
    system: savedSystem,
    correlationId,
    runtimeLog
  };

  return Response.json(payload, {
    status: method === "POST" ? 201 : 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "x-correlation-id": correlationId
    }
  });
}

export async function handleAdminSystemsPost(
  request: Request,
  options?: AdminCatalogHandlerOptions
): Promise<Response> {
  return handleAdminSystemsUpsertCommon(request, "POST", options);
}

export async function handleAdminSystemsPut(
  request: Request,
  options?: AdminCatalogHandlerOptions
): Promise<Response> {
  return handleAdminSystemsUpsertCommon(request, "PUT", options);
}

export async function handleAdminSystemsDelete(
  request: Request,
  options?: AdminCatalogHandlerOptions
): Promise<Response> {
  const startMs = Date.now();
  const correlationId =
    request.headers.get("x-correlation-id")?.trim() ||
    createCorrelationId("adm-del");

  if (!isAdminRequestAuthorized(request, options)) {
    return buildUnauthorizedResponse(
      "DELETE /api/admin/systems",
      correlationId,
      startMs
    );
  }

  let targetSlug = "";
  try {
    const parsedUrl = new URL(request.url, "http://localhost:3000");
    targetSlug = parsedUrl.searchParams.get("slug")?.trim() || "";
  } catch {
    targetSlug = "";
  }

  if (!targetSlug) {
    try {
      const body = (await request.json()) as Record<string, unknown>;
      if (body && typeof body.slug === "string") {
        targetSlug = body.slug.trim();
      }
    } catch {
      // Sin body JSON adicional
    }
  }

  if (!targetSlug) {
    const durationMs = Math.max(1, Date.now() - startMs);
    const runtimeLog = buildRuntimeLogEntry({
      level: "warn",
      component: "runtime.admin-catalog.handler",
      action: "DELETE /api/admin/systems (missing-slug)",
      durationMs,
      input: {},
      output: null,
      error: {
        message: "Falta el parámetro 'slug' para eliminar el proyecto.",
        why: "Se requiere identificar de forma inequívoca el proyecto a eliminar.",
        fix: "Envía '?slug=<slug>' en la URL o '{ \"slug\": \"<slug>\" }' en el cuerpo."
      },
      correlationId
    });

    return Response.json(
      {
        ok: false,
        message: "Debes indicar el 'slug' del proyecto a eliminar.",
        correlationId,
        runtimeLog
      } satisfies AdminCatalogErrorPayload,
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "x-correlation-id": correlationId
        }
      }
    );
  }

  const deleted = await deleteCatalogSystemBySlugAsync(targetSlug, options?.repo);
  const durationMs = Math.max(1, Date.now() - startMs);

  if (!deleted) {
    const runtimeLog = buildRuntimeLogEntry({
      level: "warn",
      component: "runtime.admin-catalog.handler",
      action: "DELETE /api/admin/systems (not-found)",
      durationMs,
      input: { slug: targetSlug },
      output: null,
      error: {
        message: `No se encontró el proyecto '${targetSlug}' para eliminar.`,
        why: "El slug no existe en el catálogo.",
        fix: "Verifica el slug antes de solicitar el borrado."
      },
      correlationId
    });

    return Response.json(
      {
        ok: false,
        message: `El proyecto '${targetSlug}' no existe.`,
        correlationId,
        runtimeLog
      } satisfies AdminCatalogErrorPayload,
      {
        status: 404,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "x-correlation-id": correlationId
        }
      }
    );
  }

  safeRevalidateCatalogPaths(targetSlug);

  const runtimeLog = buildRuntimeLogEntry({
    level: "info",
    component: "runtime.admin-catalog.handler",
    action: "DELETE /api/admin/systems",
    durationMs,
    input: { slug: targetSlug },
    output: { deletedSlug: targetSlug },
    error: null,
    correlationId
  });

  return Response.json(
    {
      ok: true,
      deletedSlug: targetSlug,
      correlationId,
      runtimeLog
    } satisfies AdminSystemDeleteSuccessPayload,
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "x-correlation-id": correlationId
      }
    }
  );
}

interface ExtractedUploadFile {
  originalFilename: string;
  mimeType: string;
  buffer: Buffer;
}

async function extractUploadFromRequest(
  request: Request
): Promise<ExtractedUploadFile | null> {
  const contentType = (request.headers.get("content-type") ?? "").toLowerCase();

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const fileEntry = formData.get("file");
    if (!fileEntry || typeof fileEntry === "string") {
      return null;
    }
    const blob = fileEntry as File;
    const arrayBuffer = await blob.arrayBuffer();
    return {
      originalFilename: blob.name || "upload.png",
      mimeType: (blob.type || "").toLowerCase().trim(),
      buffer: Buffer.from(arrayBuffer)
    };
  }

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as Record<string, unknown>;
    if (!body || typeof body !== "object") {
      return null;
    }
    const originalFilename =
      typeof body.filename === "string" && body.filename.trim()
        ? body.filename.trim()
        : "upload.png";
    let mimeType =
      typeof body.mimeType === "string"
        ? body.mimeType.toLowerCase().trim()
        : "";
    let rawBase64 =
      typeof body.dataBase64 === "string" ? body.dataBase64.trim() : "";

    const dataUrlMatch = rawBase64.match(
      /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i
    );
    if (dataUrlMatch) {
      mimeType = (dataUrlMatch[1] ?? mimeType).toLowerCase();
      rawBase64 = dataUrlMatch[2] ?? "";
    }

    if (!rawBase64) {
      return null;
    }

    return {
      originalFilename,
      mimeType,
      buffer: Buffer.from(rawBase64, "base64")
    };
  }

  return null;
}

export function sanitizeUploadBaseName(rawFilename: string): string {
  const base = path.basename(rawFilename, path.extname(rawFilename));
  const cleaned = base
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  return cleaned || "dekolabs-asset";
}

export function isSafeAssetFilename(filename: string): boolean {
  if (!filename || typeof filename !== "string") {
    return false;
  }
  if (
    filename.includes("..") ||
    filename.includes("/") ||
    filename.includes("\\") ||
    filename.includes("\0")
  ) {
    return false;
  }
  return SAFE_ASSET_FILENAME_RE.test(filename);
}

function resolveMimeTypeFromExtension(filename: string): AllowedUploadMimeType {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

export async function handleAdminUploadPost(
  request: Request,
  options?: AdminCatalogHandlerOptions
): Promise<Response> {
  const startMs = Date.now();
  const correlationId =
    request.headers.get("x-correlation-id")?.trim() ||
    createCorrelationId("adm-upl");

  if (!isAdminRequestAuthorized(request, options)) {
    return buildUnauthorizedResponse(
      "POST /api/admin/upload",
      correlationId,
      startMs
    );
  }

  let extracted: ExtractedUploadFile | null = null;
  try {
    extracted = await extractUploadFromRequest(request);
  } catch {
    extracted = null;
  }

  if (!extracted) {
    const durationMs = Math.max(1, Date.now() - startMs);
    const runtimeLog = buildRuntimeLogEntry({
      level: "warn",
      component: "runtime.admin-catalog.handler",
      action: "POST /api/admin/upload (missing-file)",
      durationMs,
      input: {},
      output: null,
      error: {
        message: "No se recibió un archivo de imagen válido en la solicitud.",
        why: "El endpoint requiere multipart/form-data (campo 'file') o JSON con 'dataBase64'.",
        fix: "Adjunta una imagen PNG, JPEG o WebP en el campo 'file'."
      },
      correlationId
    });

    return Response.json(
      {
        ok: false,
        message: "No se encontró ningún archivo de imagen en la solicitud.",
        correlationId,
        runtimeLog
      } satisfies AdminCatalogErrorPayload,
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "x-correlation-id": correlationId
        }
      }
    );
  }

  const normalizedMime =
    extracted.mimeType === "image/jpg" ? "image/jpeg" : extracted.mimeType;

  if (!(normalizedMime in ALLOWED_UPLOAD_MIME_TYPES)) {
    const durationMs = Math.max(1, Date.now() - startMs);
    const runtimeLog = buildRuntimeLogEntry({
      level: "warn",
      component: "runtime.admin-catalog.handler",
      action: "POST /api/admin/upload (unsupported-mime)",
      durationMs,
      input: { mimeType: extracted.mimeType },
      output: null,
      error: {
        message: `Tipo de archivo no permitido: '${extracted.mimeType || "desconocido"}'.`,
        why: "Solo se aceptan imágenes verificadas image/png, image/jpeg o image/webp.",
        fix: "Sube una imagen en formato PNG, JPG o WEBP."
      },
      correlationId
    });

    return Response.json(
      {
        ok: false,
        message: "Formato no permitido. Usa imágenes PNG, JPG o WEBP.",
        correlationId,
        runtimeLog
      } satisfies AdminCatalogErrorPayload,
      {
        status: 415,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "x-correlation-id": correlationId
        }
      }
    );
  }

  const allowedMime = normalizedMime as AllowedUploadMimeType;
  const sizeBytes = extracted.buffer.byteLength;

  if (sizeBytes <= 0 || sizeBytes > MAX_UPLOAD_SIZE_BYTES) {
    const durationMs = Math.max(1, Date.now() - startMs);
    const runtimeLog = buildRuntimeLogEntry({
      level: "warn",
      component: "runtime.admin-catalog.handler",
      action: "POST /api/admin/upload (invalid-size)",
      durationMs,
      input: { sizeBytes },
      output: null,
      error: {
        message: `Tamaño de archivo fuera de rango (${sizeBytes} bytes).`,
        why: "El archivo no puede estar vacío ni superar los 10 MB.",
        fix: "Sube una imagen de entre 1 byte y 10 MB."
      },
      correlationId
    });

    return Response.json(
      {
        ok: false,
        message: "El archivo está vacío o supera el límite máximo de 10 MB.",
        correlationId,
        runtimeLog
      } satisfies AdminCatalogErrorPayload,
      {
        status: 413,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "x-correlation-id": correlationId
        }
      }
    );
  }

  const ext = ALLOWED_UPLOAD_MIME_TYPES[allowedMime];
  const safeBase = sanitizeUploadBaseName(extracted.originalFilename);
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const finalFilename = `${safeBase}-${uniqueSuffix}${ext}`;

  const uploadsDir = path.resolve(
    getDefaultCatalogUploadsDir(options?.uploadsDir)
  );
  const targetFilePath = path.resolve(uploadsDir, finalFilename);

  if (
    !isSafeAssetFilename(finalFilename) ||
    path.dirname(targetFilePath) !== uploadsDir
  ) {
    const durationMs = Math.max(1, Date.now() - startMs);
    const runtimeLog = buildRuntimeLogEntry({
      level: "error",
      component: "runtime.admin-catalog.handler",
      action: "POST /api/admin/upload (path-traversal-blocked)",
      durationMs,
      input: { originalFilename: extracted.originalFilename },
      output: null,
      error: {
        message: "Nombre de archivo bloqueado por política de seguridad.",
        why: "Se impide cualquier escritura fuera del volumen CATALOG_UPLOADS_DIR.",
        fix: "Usa un nombre de archivo estándar sin caracteres de ruta."
      },
      correlationId
    });

    return Response.json(
      {
        ok: false,
        message: "Nombre de archivo inválido.",
        correlationId,
        runtimeLog
      } satisfies AdminCatalogErrorPayload,
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "x-correlation-id": correlationId
        }
      }
    );
  }

  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.writeFileSync(targetFilePath, extracted.buffer);

  const assetUrl = `/api/assets/${finalFilename}`;
  const durationMs = Math.max(1, Date.now() - startMs);

  const runtimeLog = buildRuntimeLogEntry({
    level: "info",
    component: "runtime.admin-catalog.handler",
    action: "POST /api/admin/upload",
    durationMs,
    input: {
      originalFilename: extracted.originalFilename,
      mimeType: allowedMime,
      sizeBytes
    },
    output: {
      filename: finalFilename,
      url: assetUrl
    },
    error: null,
    correlationId
  });

  const payload: AdminUploadSuccessPayload = {
    ok: true,
    asset: {
      filename: finalFilename,
      url: assetUrl,
      mimeType: allowedMime,
      sizeBytes
    },
    correlationId,
    runtimeLog
  };

  return Response.json(payload, {
    status: 201,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "x-correlation-id": correlationId
    }
  });
}

export async function handleAssetGet(
  request: Request,
  rawFilename: string,
  options?: AdminCatalogHandlerOptions
): Promise<Response> {
  const startMs = Date.now();
  const correlationId =
    request.headers.get("x-correlation-id")?.trim() ||
    createCorrelationId("asset-get");

  let decodedFilename = "";
  try {
    decodedFilename = decodeURIComponent(rawFilename ?? "").trim();
  } catch {
    decodedFilename = "";
  }

  const uploadsDir = path.resolve(
    getDefaultCatalogUploadsDir(options?.uploadsDir)
  );

  if (!isSafeAssetFilename(decodedFilename)) {
    const durationMs = Math.max(1, Date.now() - startMs);
    const runtimeLog = buildRuntimeLogEntry({
      level: "warn",
      component: "runtime.admin-catalog.handler",
      action: "GET /api/assets/[filename] (invalid-filename)",
      durationMs,
      input: { filename: rawFilename },
      output: null,
      error: {
        message: "Solicitud de activo bloqueada: nombre de archivo inválido.",
        why: "El servidor de activos bloquea path traversal ('..', '/', '\\\\') y extensiones no autorizadas.",
        fix: "Solicita únicamente nombres de archivo simples con extensión .png, .jpg o .webp."
      },
      correlationId
    });

    return Response.json(
      {
        ok: false,
        message: "Nombre de archivo inválido o no permitido.",
        correlationId,
        runtimeLog
      } satisfies AdminCatalogErrorPayload,
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "x-correlation-id": correlationId
        }
      }
    );
  }

  const targetFilePath = path.resolve(uploadsDir, decodedFilename);
  if (
    path.dirname(targetFilePath) !== uploadsDir ||
    !fs.existsSync(targetFilePath) ||
    !fs.statSync(targetFilePath).isFile()
  ) {
    const durationMs = Math.max(1, Date.now() - startMs);
    const runtimeLog = buildRuntimeLogEntry({
      level: "warn",
      component: "runtime.admin-catalog.handler",
      action: "GET /api/assets/[filename] (not-found)",
      durationMs,
      input: { filename: decodedFilename },
      output: null,
      error: {
        message: `El archivo de imagen '${decodedFilename}' no existe en el volumen de activos.`,
        why: "No se encontró el archivo solicitado en CATALOG_UPLOADS_DIR.",
        fix: "Sube primero la imagen mediante POST /api/admin/upload."
      },
      correlationId
    });

    return Response.json(
      {
        ok: false,
        message: "Imagen no encontrada.",
        correlationId,
        runtimeLog
      } satisfies AdminCatalogErrorPayload,
      {
        status: 404,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "x-correlation-id": correlationId
        }
      }
    );
  }

  const buffer = fs.readFileSync(targetFilePath);
  const contentType = resolveMimeTypeFromExtension(decodedFilename);

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "x-correlation-id": correlationId
    }
  });
}
