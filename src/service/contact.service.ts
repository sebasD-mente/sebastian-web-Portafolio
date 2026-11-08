import type {
  ContactFieldErrors,
  ContactInquiryInput,
  ContactSubmissionReceipt,
  ContactValidationResult,
  EngagementModalityId,
  EngagementModalityOption
} from "@/types/portfolio";

const ENGAGEMENT_MODALITIES: EngagementModalityOption[] = [
  {
    id: "end-to-end-implementation",
    code: "MOD-01 // END-TO-END",
    title: "Contrato de Implementación End-to-End",
    slaResponse: "< 12h hábiles",
    typicalDuration: "2 a 6 semanas",
    summary:
      "Diseño de arquitectura de 6 capas, construcción full-stack/cloud, pruebas automatizadas y despliegue en producción listo para operar."
  },
  {
    id: "agentic-ai-systems",
    code: "MOD-02 // AGENTIC AI",
    title: "Sistemas de Agentes IA & Harness Engineering",
    slaResponse: "< 12h hábiles",
    typicalDuration: "2 a 4 semanas",
    summary:
      "Orquestación multi-agente con grafos DAG deterministas, servidores MCP con sandboxing e invariantes Maker-Checker One-Shot."
  },
  {
    id: "homelab-cloud-architecture",
    code: "MOD-03 // INFRA & EDGE",
    title: "Arquitectura Distribuida, Docker & Self-Hosting",
    slaResponse: "< 24h hábiles",
    typicalDuration: "1 a 3 semanas",
    summary:
      "Contenedorización multi-stage de baja huella de memoria, túneles TLS Zero-Trust, observabilidad OpenTelemetry y migración Linux."
  },
  {
    id: "technical-advisory",
    code: "MOD-04 // ADVISORY",
    title: "Consultoría Ejecutiva & Auditoría de Arquitectura",
    slaResponse: "< 24h hábiles",
    typicalDuration: "Sesiones o Retainer Mensual",
    summary:
      "Revisión profunda de cuellos de botella P99, deuda estructural, seguridad de agentes e implantación del Arnés Camaleón v2.1 en equipos."
  }
];

const VALID_MODALITY_IDS = new Set<EngagementModalityId>(
  ENGAGEMENT_MODALITIES.map((item) => item.id)
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function stripControlAndHtmlTags(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function getEngagementModalities(): EngagementModalityOption[] {
  return ENGAGEMENT_MODALITIES.map((item) => ({ ...item }));
}

export function validateContactInquiry(
  rawInput: Partial<Record<keyof ContactInquiryInput, unknown>>
): ContactValidationResult {
  const fullName = stripControlAndHtmlTags(rawInput.fullName);
  const email = stripControlAndHtmlTags(rawInput.email).toLowerCase();
  const organization = stripControlAndHtmlTags(rawInput.organization);
  const rawModality = stripControlAndHtmlTags(rawInput.modality) as EngagementModalityId;
  const projectSummary = stripControlAndHtmlTags(rawInput.projectSummary);
  const websiteHoneypot = stripControlAndHtmlTags(rawInput.websiteHoneypot);

  const modality: EngagementModalityId = VALID_MODALITY_IDS.has(rawModality)
    ? rawModality
    : "end-to-end-implementation";

  const sanitized: ContactInquiryInput = {
    fullName,
    email,
    organization: organization || undefined,
    modality,
    projectSummary,
    websiteHoneypot: websiteHoneypot || undefined
  };

  if (websiteHoneypot.length > 0) {
    return {
      valid: false,
      sanitized,
      errors: {},
      isSpamHoneypot: true
    };
  }

  const errors: ContactFieldErrors = {};

  if (fullName.length < 2 || fullName.length > 100) {
    errors.fullName =
      "Ingresa tu nombre completo (entre 2 y 100 caracteres).";
  }

  if (!email || !EMAIL_RE.test(email) || email.length > 160) {
    errors.email =
      "Ingresa un correo electrónico válido (ej. nombre@empresa.com).";
  }

  if (!VALID_MODALITY_IDS.has(rawModality)) {
    errors.modality =
      "Selecciona una modalidad de colaboración comercial válida.";
  }

  if (projectSummary.length < 20 || projectSummary.length > 2000) {
    errors.projectSummary =
      "Describe el alcance técnico, objetivo o sistema requerido (mínimo 20 caracteres).";
  }

  return {
    valid: Object.keys(errors).length === 0,
    sanitized,
    errors,
    isSpamHoneypot: false
  };
}

export function createContactSubmissionReceipt(
  inquiry: ContactInquiryInput,
  correlationId = "contact-req-01"
): ContactSubmissionReceipt {
  const modalityOption =
    ENGAGEMENT_MODALITIES.find((m) => m.id === inquiry.modality) ??
    ENGAGEMENT_MODALITIES[0];

  const deterministicSuffix = Math.abs(
    Array.from(`${inquiry.email}:${inquiry.fullName}:${inquiry.modality}`).reduce(
      (hash, ch) => (hash * 31 + ch.charCodeAt(0)) | 0,
      7
    )
  )
    .toString(16)
    .slice(0, 6)
    .toUpperCase()
    .padEnd(6, "0");

  const receiptId = `DL-${deterministicSuffix}`;

  return {
    ok: true,
    receiptId,
    correlationId,
    timestamp: new Date().toISOString(),
    modalityLabel: modalityOption.title,
    estimatedResponseWindow: modalityOption.slaResponse,
    summaryMessage: `Solicitud registrada en dekolabs.org (${receiptId}). Sebastián revisará tu requerimiento de "${modalityOption.title}" y responderá a ${inquiry.email} en ${modalityOption.slaResponse}.`
  };
}
