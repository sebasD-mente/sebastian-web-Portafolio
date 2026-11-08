import {
  buildRuntimeLogEntry,
  createCorrelationId
} from "@/runtime/logger";
import {
  createContactSubmissionReceipt,
  validateContactInquiry
} from "@/service/contact.service";
import type {
  ContactFieldErrors,
  ContactSubmissionReceipt,
  RuntimeLogEntry
} from "@/types/portfolio";

export interface ContactEndpointSuccessPayload {
  ok: true;
  receipt: ContactSubmissionReceipt;
  runtimeLog: RuntimeLogEntry;
}

export interface ContactEndpointErrorPayload {
  ok: false;
  message: string;
  errors: ContactFieldErrors;
  correlationId: string;
  runtimeLog: RuntimeLogEntry;
}

export type ContactEndpointPayload =
  | ContactEndpointSuccessPayload
  | ContactEndpointErrorPayload;

async function extractRequestBody(
  request: Request
): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const parsed = (await request.json()) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    const out: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      if (typeof value === "string") {
        out[key] = value;
      }
    });
    return out;
  }

  const rawText = await request.text();
  if (!rawText.trim()) return {};
  const parsed = JSON.parse(rawText) as unknown;
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }
  return {};
}

export async function handleContactPost(request: Request): Promise<Response> {
  const startMs = Date.now();
  const correlationId =
    request.headers.get("x-correlation-id")?.trim() ||
    createCorrelationId("cnt");

  let rawBody: Record<string, unknown>;
  try {
    rawBody = await extractRequestBody(request);
  } catch {
    const durationMs = Math.max(1, Date.now() - startMs);
    const runtimeLog = buildRuntimeLogEntry({
      level: "warn",
      component: "runtime.contact.handler",
      action: "POST /api/contact",
      durationMs,
      input: "invalid-json-payload",
      output: null,
      error: {
        message: "Payload JSON malformado en solicitud a /api/contact.",
        why: "El endpoint de contratación valida payloads estructurados bajo política Fail-Closed.",
        fix: "Envía un objeto JSON válido o FormData con fullName, email, modality y projectSummary."
      },
      correlationId
    });

    const errorPayload: ContactEndpointErrorPayload = {
      ok: false,
      message: "El formato de la solicitud no es válido. Revisa los campos e inténtalo nuevamente.",
      errors: {},
      correlationId,
      runtimeLog
    };

    return Response.json(errorPayload, {
      status: 400,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "x-correlation-id": correlationId
      }
    });
  }

  const validation = validateContactInquiry(rawBody);
  const durationMs = Math.max(1, Date.now() - startMs);

  if (validation.isSpamHoneypot) {
    const fakeReceipt = createContactSubmissionReceipt(
      {
        fullName: "Honeypot Filter",
        email: "filtered@dekolabs.org",
        modality: "end-to-end-implementation",
        projectSummary: "Filtered automated submission via honeypot field."
      },
      correlationId
    );
    const runtimeLog = buildRuntimeLogEntry({
      level: "warn",
      component: "runtime.contact.handler",
      action: "POST /api/contact (honeypot-blocked)",
      durationMs,
      input: { modality: validation.sanitized.modality },
      output: { filtered: true },
      error: null,
      correlationId
    });

    return Response.json(
      {
        ok: true,
        receipt: fakeReceipt,
        runtimeLog
      } satisfies ContactEndpointSuccessPayload,
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "x-correlation-id": correlationId
        }
      }
    );
  }

  if (!validation.valid) {
    const runtimeLog = buildRuntimeLogEntry({
      level: "warn",
      component: "runtime.contact.handler",
      action: "POST /api/contact (validation-failed)",
      durationMs,
      input: {
        modality: validation.sanitized.modality,
        invalidFields: Object.keys(validation.errors)
      },
      output: null,
      error: {
        message: "Validación de campos fallida en formulario de contacto comercial.",
        why: "Se requiere nombre, correo válido, modalidad de colaboración y resumen técnico >= 20 caracteres.",
        fix: "Completa los campos señalados en el objeto errors."
      },
      correlationId
    });

    const errorPayload: ContactEndpointErrorPayload = {
      ok: false,
      message: "Por favor revisa los campos marcados antes de enviar tu solicitud.",
      errors: validation.errors,
      correlationId,
      runtimeLog
    };

    return Response.json(errorPayload, {
      status: 422,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "x-correlation-id": correlationId
      }
    });
  }

  const receipt = createContactSubmissionReceipt(
    validation.sanitized,
    correlationId
  );

  const runtimeLog = buildRuntimeLogEntry({
    level: "info",
    component: "runtime.contact.handler",
    action: "POST /api/contact (accepted)",
    durationMs,
    input: {
      modality: validation.sanitized.modality,
      organization: validation.sanitized.organization ?? "independent"
    },
    output: {
      receiptId: receipt.receiptId,
      estimatedResponseWindow: receipt.estimatedResponseWindow
    },
    error: null,
    correlationId
  });

  const successPayload: ContactEndpointSuccessPayload = {
    ok: true,
    receipt,
    runtimeLog
  };

  return Response.json(successPayload, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "x-correlation-id": correlationId
    }
  });
}
