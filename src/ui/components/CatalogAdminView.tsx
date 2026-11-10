"use client";

import React, { useState } from "react";
import type {
  CatalogSectionDescriptor,
  CatalogSectionId,
  CodeSnippetTab,
  PipelineStage,
  ProductionSystem,
  ProductionSystemCategory,
  ProductionSystemLayoutVariant,
  ProductionSystemUpsertInput,
  SolvedChallenge,
  SystemArchitectureSpec,
  SystemGalleryImage,
  SystemGallerySlotNumber
} from "@/types/portfolio";

export interface CatalogAdminViewProps {
  initialSystems: ProductionSystem[];
  sections: Record<CatalogSectionId, CatalogSectionDescriptor>;
  defaultTemplate: ProductionSystemUpsertInput;
  authenticatedUsername?: string;
}

export interface UploadSlotStatus {
  uploading: boolean;
  error: string | null;
  lastUploadedUrl: string | null;
}

export function slugifyProjectTitle(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ensureThreeGallerySlots(
  gallery: readonly SystemGalleryImage[] | undefined,
  projectTitle: string
): [SystemGalleryImage, SystemGalleryImage, SystemGalleryImage] {
  const titleLabel = projectTitle.trim() || "PROYECTO";
  const slots: [SystemGalleryImage, SystemGalleryImage, SystemGalleryImage] = [
    {
      slot: 1,
      src: "",
      alt: `${titleLabel} — Vista de interfaz 01`,
      label: "VIEW 01 // INTERFAZ PRINCIPAL Y OPERACIÓN",
      caption:
        "Captura operativa principal del sistema desplegado en producción."
    },
    {
      slot: 2,
      src: "",
      alt: `${titleLabel} — Vista de interfaz 02`,
      label: "VIEW 02 // FLUJO TRANSACCIONAL Y MOTOR INTERNO",
      caption:
        "Detalle de ejecución del pipeline, validación y estado del servicio."
    },
    {
      slot: 3,
      src: "",
      alt: `${titleLabel} — Vista de interfaz 03`,
      label: "VIEW 03 // INFRAESTRUCTURA, TELEMETRÍA Y STORAGE",
      caption:
        "Inspección técnica de almacenamiento, telemetría y observabilidad."
    }
  ];

  if (Array.isArray(gallery)) {
    for (const item of gallery) {
      if (!item || typeof item !== "object") continue;
      const idx =
        item.slot === 1 ? 0 : item.slot === 2 ? 1 : item.slot === 3 ? 2 : -1;
      if (idx !== -1) {
        const defaultSlot = slots[idx]!;
        slots[idx] = {
          slot: defaultSlot.slot,
          src: typeof item.src === "string" ? item.src.trim() : "",
          alt:
            typeof item.alt === "string" && item.alt.trim().length > 0
              ? item.alt.trim()
              : defaultSlot.alt,
          label:
            typeof item.label === "string" && item.label.trim().length > 0
              ? item.label.trim()
              : defaultSlot.label,
          caption:
            typeof item.caption === "string" && item.caption.trim().length > 0
              ? item.caption.trim()
              : defaultSlot.caption
        };
      }
    }
  }

  return slots;
}

export function convertSystemToFormInput(
  system: ProductionSystem | ProductionSystemUpsertInput
): ProductionSystemUpsertInput {
  const gallery = ensureThreeGallerySlots(
    system.galleryImages,
    system.title || "Proyecto"
  );
  const specs: SystemArchitectureSpec[] =
    Array.isArray(system.architectureSpecs) &&
    system.architectureSpecs.length >= 2
      ? system.architectureSpecs.map((s) => ({ ...s }))
      : [
          {
            label: system.architectureSpecs?.[0]?.label || "ARQUITECTURA",
            value:
              system.architectureSpecs?.[0]?.value ||
              "Stateless Cloud-Native"
          },
          {
            label: system.architectureSpecs?.[1]?.label || "DISPONIBILIDAD",
            value:
              system.architectureSpecs?.[1]?.value || "99.9% SLA Activo"
          }
        ];

  const stageNumbers: Array<"ETAPA 01" | "ETAPA 02" | "ETAPA 03"> = [
    "ETAPA 01",
    "ETAPA 02",
    "ETAPA 03"
  ];
  const pipelineStages: PipelineStage[] = stageNumbers.map((stageNum, idx) => {
    const existing = system.pipelineStages?.[idx];
    return {
      stageNumber: stageNum,
      title: existing?.title || `${stageNum} // PROCESAMIENTO`,
      latencyOrSlo: existing?.latencyOrSlo || "SLO 99.9%",
      description:
        existing?.description ||
        "Etapa verificada del pipeline en producción.",
      invariants:
        Array.isArray(existing?.invariants) && existing.invariants.length > 0
          ? [...existing.invariants]
          : ["Zero-Trust Input", "Deterministic Validation"]
    };
  });

  const challengeNumbers: Array<"01" | "02" | "03"> = ["01", "02", "03"];
  const solvedChallenges: SolvedChallenge[] = challengeNumbers.map(
    (num, idx) => {
      const existing = system.solvedChallenges?.[idx];
      return {
        number: num,
        title: existing?.title || `Desafío de Ingeniería ${num}`,
        problem:
          existing?.problem ||
          "Restricción técnica identificada en el entorno de producción.",
        solution:
          existing?.solution ||
          "Implementación determinista desacoplada en 6 capas.",
        impactMetric: existing?.impactMetric || "100% verificado"
      };
    }
  );

  const codeTabs: CodeSnippetTab[] =
    Array.isArray(system.codeTabs) && system.codeTabs.length > 0
      ? system.codeTabs.map((t) => ({ ...t }))
      : [
          {
            id: "tab-01",
            filename: "src/service/system.service.ts",
            layer: "Layer 4 · Service",
            language: "typescript",
            code: "export async function executePipeline() {\n  return { status: 'verified' };\n}"
          }
        ];

  return {
    id: system.id,
    order: system.order || "01",
    slug: system.slug || "",
    title: system.title || "",
    subtitle: system.subtitle || "",
    catalogSection: system.catalogSection ?? "production-systems",
    category: system.category ?? "distributed-systems",
    categoryLabel: system.categoryLabel || "E-COMMERCE & CLOUD MEDIA ENGINE",
    projectHeaderLabel:
      system.projectHeaderLabel ||
      `PROJECT ${system.order || "01"} // ${system.categoryLabel || "ARCHITECTURE"}`,
    versionBadge: system.versionBadge || "v1.0.0 PRODUCTION",
    previewImageSrc:
      system.previewImageSrc || "/assets/deco-vintage-preview.png",
    previewImageAlt:
      system.previewImageAlt ||
      `Vista preliminar de ${system.title || "proyecto"}`,
    highlightedStackTag:
      system.highlightedStackTag || system.stackTags?.[0] || "TYPESCRIPT",
    featuredOnHome: system.featuredOnHome ?? true,
    layoutVariant: system.layoutVariant ?? "primary-7-5",
    status: system.status ?? "PRODUCTION // ONLINE",
    liveMetricPill: system.liveMetricPill || "v1.0.0 · 100/100 PASS",
    summary: system.summary || "",
    architecturalNarrative: system.architecturalNarrative || "",
    stackTags:
      Array.isArray(system.stackTags) && system.stackTags.length > 0
        ? [...system.stackTags]
        : ["NEXT.JS 15", "TYPESCRIPT", "POSTGRESQL + PGVECTOR"],
    architectureSpecs: specs,
    deploymentLedger: {
      architecturePattern:
        system.deploymentLedger?.architecturePattern ||
        "6-Layer Clean Architecture",
      commitSha: system.deploymentLedger?.commitSha || "v1.0.0",
      hostEnvironment:
        system.deploymentLedger?.hostEnvironment ||
        "Ubuntu 24.04 LTS · Docker",
      verificationGate:
        system.deploymentLedger?.verificationGate || "100/100 PASS"
    },
    liveUrl: system.liveUrl || "https://dekolabs.org",
    detailHref: system.detailHref || `/sistemas/${system.slug || "nuevo"}`,
    galleryImages: gallery,
    pipelineStages,
    codeTabs,
    solvedChallenges
  };
}

export function createBlankProjectDraft(
  nextOrder: string = "05",
  targetSection: CatalogSectionId = "production-systems"
): ProductionSystemUpsertInput {
  const isAiSection = targetSection === "ai-projects";
  return {
    order: nextOrder,
    slug: "",
    title: "",
    subtitle: "",
    catalogSection: targetSection,
    category: isAiSection ? "ai-agents" : "distributed-systems",
    categoryLabel: isAiSection
      ? "AGENTIC AI & RAG SYSTEMS"
      : "CLOUD & DISTRIBUTED SYSTEMS",
    projectHeaderLabel: `PROJECT ${nextOrder} // ${
      isAiSection ? "AGENTIC AI & RAG SYSTEMS" : "CLOUD & DISTRIBUTED SYSTEMS"
    }`,
    versionBadge: isAiSection ? "v0.9.0 IN BUILD" : "v1.0.0 PRODUCTION",
    previewImageSrc: "/assets/deco-vintage-preview.png",
    previewImageAlt: "Vista preliminar del proyecto en dekolabs.org",
    highlightedStackTag: isAiSection ? "GOOGLE ADK" : "GOOGLE CLOUD STORAGE",
    featuredOnHome: true,
    layoutVariant: "primary-7-5",
    status: "PRODUCTION // ONLINE",
    liveMetricPill: "v1.0.0 · 100/100 PASS",
    summary: "",
    architecturalNarrative: "",
    stackTags: isAiSection
      ? ["GOOGLE ADK", "POSTGRESQL + PGVECTOR", "NEXT.JS 15", "TYPESCRIPT"]
      : ["NEXT.JS 15", "TYPESCRIPT", "DOCKER", "GOOGLE CLOUD STORAGE"],
    architectureSpecs: [
      {
        label: "ARQUITECTURA",
        value: isAiSection
          ? "6-Layer Agentic RAG Pipeline"
          : "Stateless Cloud-Native"
      },
      {
        label: "DISPONIBILIDAD",
        value: "99.9% SLA Activo"
      }
    ],
    deploymentLedger: {
      architecturePattern: "6-Layer Clean Architecture",
      commitSha: "v1.0.0-prod",
      hostEnvironment: "Ubuntu 24.04 LTS · Docker Standalone",
      verificationGate: "100/100 PASS"
    },
    liveUrl: "https://dekolabs.org",
    galleryImages: ensureThreeGallerySlots([], "Nuevo Proyecto"),
    pipelineStages: [
      {
        stageNumber: "ETAPA 01",
        title: "INGESTA Y VALIDACIÓN DE CONTRATOS",
        latencyOrSlo: "p95 < 15ms",
        description:
          "Validación determinista de esquemas de entrada y aislamiento de seguridad.",
        invariants: ["Zero-Trust Input", "Strict Schema Validation"]
      },
      {
        stageNumber: "ETAPA 02",
        title: "ORQUESTACIÓN DE DOMINIO Y PERSISTENCIA",
        latencyOrSlo: "p95 < 45ms",
        description:
          "Ejecución transaccional sobre PostgreSQL 17 y procesamiento principal.",
        invariants: ["ACID Transactions", "Capability Seams"]
      },
      {
        stageNumber: "ETAPA 03",
        title: "ENTREGA Y OBSERVABILIDAD ESTRUCTURADA",
        latencyOrSlo: "SLO 99.9%",
        description:
          "Emisión de respuesta con telemetría RuntimeLogEntry y correlationId.",
        invariants: ["Correlation ID", "Read-Only Container Safe"]
      }
    ],
    codeTabs: [
      {
        id: "tab-01",
        filename: "src/service/pipeline.service.ts",
        layer: "Layer 4 · Service",
        language: "typescript",
        code: "export async function runProductionPipeline() {\n  return { ok: true };\n}"
      }
    ],
    solvedChallenges: [
      {
        number: "01",
        title: "Separación Estricta de Responsabilidades",
        problem: "Riesgo de acoplamiento entre vistas React y acceso a datos.",
        solution:
          "Arquitectura de 6 capas verificada mecánicamente en cada commit.",
        impactMetric: "0 violaciones de capas"
      },
      {
        number: "02",
        title: "Persistencia de Activos en Contenedor Read-Only",
        problem:
          "El contenedor de producción ejecuta con read_only: true por seguridad.",
        solution:
          "Volumen Docker dedicado montado en /app/data/uploads con permisos 1001:1001.",
        impactMetric: "100% durabilidad en despliegues"
      },
      {
        number: "03",
        title: "Rendimiento y Latencia Predecible",
        problem: "Sobrecarga en consultas repetitivas y entrega de imágenes.",
        solution:
          "Índices optimizados en PostgreSQL y cabeceras Cache-Control inmutables.",
        impactMetric: "p99 < 40ms"
      }
    ]
  };
}

export function buildDecoTemplateDraft(
  defaultTemplate: ProductionSystemUpsertInput,
  nextOrder: string = "02"
): ProductionSystemUpsertInput {
  const cloned = convertSystemToFormInput(defaultTemplate);
  return {
    ...cloned,
    id: undefined,
    order: nextOrder,
    slug: `${cloned.slug || "deco-vintage-platform"}-copia`,
    title: `${cloned.title || "DECO VINTAGE PLATFORM"} (MOLDE)`,
    projectHeaderLabel: `PROJECT ${nextOrder} // ${cloned.categoryLabel}`,
    featuredOnHome: true
  };
}

export function CatalogAdminView({
  initialSystems,
  sections,
  defaultTemplate,
  authenticatedUsername = "admin@dekolabs.org"
}: CatalogAdminViewProps) {
  const [systems, setSystems] = useState<ProductionSystem[]>(() =>
    [...initialSystems].sort((a, b) => a.order.localeCompare(b.order))
  );
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const [isEditingExisting, setIsEditingExisting] = useState<boolean>(() =>
    initialSystems.some((s) => s.slug === "deco-vintage-platform")
  );

  const [formState, setFormState] = useState<ProductionSystemUpsertInput>(() => {
    const deco = initialSystems.find((s) => s.slug === "deco-vintage-platform");
    if (deco) {
      return convertSystemToFormInput(deco);
    }
    return convertSystemToFormInput(defaultTemplate);
  });

  const [newStackTagInput, setNewStackTagInput] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [statusBanner, setStatusBanner] = useState<{
    type: "idle" | "loading" | "success" | "error";
    message: string;
  }>({
    type: "idle",
    message:
      "Selecciona un proyecto existente para editar sus 4 imágenes y datos técnicos, o crea un proyecto nuevo."
  });

  const [coverUploadStatus, setCoverUploadStatus] = useState<UploadSlotStatus>({
    uploading: false,
    error: null,
    lastUploadedUrl: null
  });

  const [galleryUploadStatus, setGalleryUploadStatus] = useState<
    Record<SystemGallerySlotNumber, UploadSlotStatus>
  >({
    1: { uploading: false, error: null, lastUploadedUrl: null },
    2: { uploading: false, error: null, lastUploadedUrl: null },
    3: { uploading: false, error: null, lastUploadedUrl: null }
  });

  const productionSystemsList = systems.filter(
    (s) => (s.catalogSection ?? "production-systems") === "production-systems"
  );
  const aiProjectsList = systems.filter(
    (s) => s.catalogSection === "ai-projects"
  );

  function clearFieldError(fieldName: string): void {
    setFieldErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }

  function validateFieldOnBlur(fieldName: string, value: string): void {
    const trimmed = value.trim();
    if (!trimmed) {
      const labels: Record<string, string> = {
        title: "El título del proyecto es obligatorio.",
        slug: "El identificador URL (slug) es obligatorio.",
        subtitle: "El subtítulo técnico es obligatorio.",
        categoryLabel: "La etiqueta de categoría es obligatoria.",
        summary: "El resumen para la tarjeta de inicio es obligatorio.",
        liveUrl: "La URL del sistema en vivo es obligatoria."
      };
      if (labels[fieldName]) {
        setFieldErrors((prev) => ({
          ...prev,
          [fieldName]: labels[fieldName]!
        }));
      }
    }
  }

  function handleSelectSystemForEdit(system: ProductionSystem): void {
    setIsEditingExisting(true);
    setFormState(convertSystemToFormInput(system));
    setFieldErrors({});
    setStatusBanner({
      type: "idle",
      message: `Editando proyecto '${system.title}' (/sistemas/${system.slug}).`
    });
  }

  function handleCreateNewBlank(
    targetSection: CatalogSectionId = "production-systems"
  ): void {
    const nextOrderNum = String(systems.length + 1).padStart(2, "0");
    setIsEditingExisting(false);
    setFormState(createBlankProjectDraft(nextOrderNum, targetSection));
    setFieldErrors({});
    setStatusBanner({
      type: "idle",
      message: `Creando nuevo proyecto para la sección '${sections[targetSection].heading}'.`
    });
  }

  function handleLoadDecoTemplate(): void {
    const nextOrderNum = String(systems.length + 1).padStart(2, "0");
    const decoSource =
      systems.find((s) => s.slug === "deco-vintage-platform") ??
      defaultTemplate;
    setIsEditingExisting(false);
    setFormState(
      buildDecoTemplateDraft(
        convertSystemToFormInput(decoSource),
        nextOrderNum
      )
    );
    setFieldErrors({});
    setStatusBanner({
      type: "success",
      message:
        "Molde base de DECO VINTAGE PLATFORM cargado. Ajusta el título, slug, categoría e imágenes antes de guardar."
    });
  }

  async function handleLogout(): Promise<void> {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setStatusBanner({
      type: "loading",
      message: "Cerrando sesión segura de administrador..."
    });

    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        credentials: "same-origin"
      });
    } catch {
      // Continuar con redirección incluso si falla la red
    }

    if (typeof window !== "undefined") {
      window.location.assign("/admin/login");
    }
  }

  async function uploadImageFileToServer(
    file: File
  ): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "same-origin",
        body: formData
      });

      const payload = (await response.json()) as {
        ok: boolean;
        asset?: { url: string; filename: string };
        message?: string;
      };

      if (response.status === 401) {
        if (typeof window !== "undefined") {
          window.location.assign("/admin/login");
        }
        return {
          ok: false,
          error:
            payload.message ||
            "Tu sesión de administrador expiró. Inicia sesión nuevamente en /admin/login."
        };
      }

      if (!response.ok || !payload.ok || !payload.asset?.url) {
        return {
          ok: false,
          error:
            payload.message ||
            `Error al subir la imagen (HTTP ${response.status}).`
        };
      }

      return {
        ok: true,
        url: payload.asset.url
      };
    } catch {
      return {
        ok: false,
        error: "Error de conexión al subir el archivo a /api/admin/upload."
      };
    }
  }

  async function handleCoverFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;

    setCoverUploadStatus({
      uploading: true,
      error: null,
      lastUploadedUrl: null
    });

    const result = await uploadImageFileToServer(file);
    if (!result.ok) {
      setCoverUploadStatus({
        uploading: false,
        error: result.error,
        lastUploadedUrl: null
      });
      return;
    }

    setFormState((prev) => ({
      ...prev,
      previewImageSrc: result.url
    }));
    setCoverUploadStatus({
      uploading: false,
      error: null,
      lastUploadedUrl: result.url
    });
    setStatusBanner({
      type: "success",
      message: `Imagen de portada subida a ${result.url}. Recuerda hacer clic en 'Guardar y Publicar Proyecto' para confirmar.`
    });
  }

  async function handleGallerySlotFileChange(
    slot: SystemGallerySlotNumber,
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> {
    const file = event.target.files?.[0];
    if (!file) return;

    setGalleryUploadStatus((prev) => ({
      ...prev,
      [slot]: { uploading: true, error: null, lastUploadedUrl: null }
    }));

    const result = await uploadImageFileToServer(file);
    if (!result.ok) {
      setGalleryUploadStatus((prev) => ({
        ...prev,
        [slot]: { uploading: false, error: result.error, lastUploadedUrl: null }
      }));
      return;
    }

    setFormState((prev) => {
      const currentSlots = ensureThreeGallerySlots(
        prev.galleryImages,
        prev.title || "Proyecto"
      );
      const updated = currentSlots.map((item) =>
        item.slot === slot ? { ...item, src: result.url } : item
      );
      return {
        ...prev,
        galleryImages: updated
      };
    });

    setGalleryUploadStatus((prev) => ({
      ...prev,
      [slot]: { uploading: false, error: null, lastUploadedUrl: result.url }
    }));
    setStatusBanner({
      type: "success",
      message: `Imagen de detalle VIEW 0${slot} subida a ${result.url}. Haz clic en 'Guardar y Publicar Proyecto' para persistir en PostgreSQL.`
    });
  }

  function updateGallerySlotField(
    slot: SystemGallerySlotNumber,
    field: "src" | "label" | "caption" | "alt",
    value: string
  ): void {
    setFormState((prev) => {
      const currentSlots = ensureThreeGallerySlots(
        prev.galleryImages,
        prev.title || "Proyecto"
      );
      const updated = currentSlots.map((item) =>
        item.slot === slot ? { ...item, [field]: value } : item
      );
      return {
        ...prev,
        galleryImages: updated
      };
    });
  }

  function handleAddStackTag(): void {
    const cleaned = newStackTagInput.trim().toUpperCase();
    if (!cleaned) return;
    setFormState((prev) => {
      if (prev.stackTags.includes(cleaned)) {
        return prev;
      }
      return {
        ...prev,
        stackTags: [...prev.stackTags, cleaned],
        highlightedStackTag: prev.highlightedStackTag || cleaned
      };
    });
    setNewStackTagInput("");
    clearFieldError("stackTags");
  }

  function handleRemoveStackTag(tagToRemove: string): void {
    setFormState((prev) => {
      const filtered = prev.stackTags.filter((t) => t !== tagToRemove);
      const nextHighlighted =
        prev.highlightedStackTag === tagToRemove
          ? (filtered[0] ?? "")
          : prev.highlightedStackTag;
      return {
        ...prev,
        stackTags: filtered,
        highlightedStackTag: nextHighlighted
      };
    });
  }

  function handleUpdateArchSpec(
    index: number,
    field: "label" | "value",
    value: string
  ): void {
    setFormState((prev) => {
      const specs = [...prev.architectureSpecs];
      const current = specs[index] ?? { label: "ESPECIFICACIÓN", value: "" };
      specs[index] = { ...current, [field]: value };
      return {
        ...prev,
        architectureSpecs: specs
      };
    });
  }

  function handleUpdatePipelineStage(
    index: number,
    field: "title" | "latencyOrSlo" | "description" | "invariants",
    value: string
  ): void {
    setFormState((prev) => {
      const stages = [...prev.pipelineStages];
      const current = stages[index];
      if (!current) return prev;
      if (field === "invariants") {
        stages[index] = {
          ...current,
          invariants: value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        };
      } else {
        stages[index] = {
          ...current,
          [field]: value
        };
      }
      return {
        ...prev,
        pipelineStages: stages
      };
    });
  }

  function handleUpdateCodeTab(
    index: number,
    field: keyof CodeSnippetTab,
    value: string
  ): void {
    setFormState((prev) => {
      const tabs = [...prev.codeTabs];
      const current = tabs[index];
      if (!current) return prev;
      tabs[index] = {
        ...current,
        [field]: value
      };
      return {
        ...prev,
        codeTabs: tabs
      };
    });
  }

  function handleAddCodeTab(): void {
    setFormState((prev) => {
      const nextIdx = prev.codeTabs.length + 1;
      return {
        ...prev,
        codeTabs: [
          ...prev.codeTabs,
          {
            id: `tab-0${nextIdx}`,
            filename: `src/service/module-0${nextIdx}.ts`,
            layer: "Layer 4 · Service",
            language: "typescript",
            code: "// Escribe o pega aquí el fragmento de código real del sistema\n"
          }
        ]
      };
    });
  }

  function handleRemoveCodeTab(index: number): void {
    setFormState((prev) => {
      if (prev.codeTabs.length <= 1) return prev;
      return {
        ...prev,
        codeTabs: prev.codeTabs.filter((_, i) => i !== index)
      };
    });
  }

  function handleUpdateSolvedChallenge(
    index: number,
    field: "title" | "problem" | "solution" | "impactMetric",
    value: string
  ): void {
    setFormState((prev) => {
      const challenges = [...prev.solvedChallenges];
      const current = challenges[index];
      if (!current) return prev;
      challenges[index] = {
        ...current,
        [field]: value
      };
      return {
        ...prev,
        solvedChallenges: challenges
      };
    });
  }

  async function handleSubmitForm(
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    setStatusBanner({
      type: "loading",
      message: "Guardando proyecto en el catálogo y revalidando vistas públicas..."
    });

    const method = isEditingExisting ? "PUT" : "POST";

    try {
      const response = await fetch("/api/admin/systems", {
        method,
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formState)
      });

      const payload = (await response.json()) as {
        ok: boolean;
        system?: ProductionSystem;
        message?: string;
        errors?: Record<string, string>;
      };

      if (response.status === 401) {
        setStatusBanner({
          type: "error",
          message:
            payload.message ||
            "Sesión expirada. Redirigiendo a /admin/login..."
        });
        if (typeof window !== "undefined") {
          window.location.assign("/admin/login");
        }
        return;
      }

      if (!response.ok || !payload.ok || !payload.system) {
        if (payload.errors) {
          setFieldErrors(payload.errors);
        }
        setStatusBanner({
          type: "error",
          message:
            payload.message ||
            `No se pudo guardar el proyecto (HTTP ${response.status}).`
        });
        return;
      }

      const saved = payload.system;
      setSystems((prev) => {
        const filtered = prev.filter((item) => item.slug !== saved.slug);
        return [...filtered, saved].sort((a, b) =>
          a.order.localeCompare(b.order)
        );
      });
      setIsEditingExisting(true);
      setFormState(convertSystemToFormInput(saved));
      setFieldErrors({});
      setStatusBanner({
        type: "success",
        message: `Proyecto '${saved.title}' publicado exitosamente en '${
          sections[saved.catalogSection ?? "production-systems"].heading
        }' (/sistemas/${saved.slug}).`
      });
    } catch {
      setStatusBanner({
        type: "error",
        message: "Error de red al guardar en /api/admin/systems."
      });
    }
  }

  async function handleDeleteProject(slugToDelete: string): Promise<void> {
    setStatusBanner({
      type: "loading",
      message: `Eliminando proyecto '${slugToDelete}'...`
    });

    try {
      const response = await fetch(
        `/api/admin/systems?slug=${encodeURIComponent(slugToDelete)}`,
        {
          method: "DELETE",
          credentials: "same-origin"
        }
      );

      const payload = (await response.json()) as {
        ok: boolean;
        deletedSlug?: string;
        message?: string;
      };

      if (response.status === 401) {
        setStatusBanner({
          type: "error",
          message:
            payload.message ||
            "Sesión expirada. Redirigiendo a /admin/login..."
        });
        if (typeof window !== "undefined") {
          window.location.assign("/admin/login");
        }
        return;
      }

      if (!response.ok || !payload.ok) {
        setStatusBanner({
          type: "error",
          message:
            payload.message ||
            `No fue posible eliminar '${slugToDelete}' (HTTP ${response.status}).`
        });
        return;
      }

      setSystems((prev) => prev.filter((s) => s.slug !== slugToDelete));
      setStatusBanner({
        type: "success",
        message: `Proyecto '${slugToDelete}' eliminado del catálogo.`
      });
    } catch {
      setStatusBanner({
        type: "error",
        message: "Error de red al intentar eliminar el proyecto."
      });
    }
  }

  const normalizedGallerySlots = ensureThreeGallerySlots(
    formState.galleryImages,
    formState.title || "Proyecto"
  );

  return (
    <div className="bg-[#F8F9FA] text-[#0A0A0A] min-h-screen pb-24">
      {/* Top Studio Header */}
      <section className="border-b border-[#E5E7EB] bg-white py-8">
        <div className="swiss-container">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#2563EB] font-semibold mb-2">
                DEKOLABS STUDIO // CATALOG &amp; ASSET MANAGER (/admin/proyectos)
              </p>
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#0A0A0A]">
                Panel de Administración de Proyectos e Imágenes
              </h1>
              <p className="mt-2 text-sm sm:text-base text-[#4B5563] max-w-3xl">
                Gestiona las tarjetas de inicio en{" "}
                <strong className="text-[#111827]">SISTEMAS EN PRODUCCIÓN</strong> y{" "}
                <strong className="text-[#111827]">MÁS PROYECTOS DE IA</strong>, y sube
                desde tu PC la imagen de portada más las{" "}
                <strong className="text-[#111827]">
                  3 imágenes exclusivas de la vista de detalle
                </strong>{" "}
                hacia el volumen persistente{" "}
                <code className="font-mono text-xs bg-[#F3F4F6] px-1.5 py-0.5 rounded">
                  /app/data/uploads
                </code>
                .
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleCreateNewBlank("production-systems")}
                className="px-4 py-2.5 bg-[#0A0A0A] hover:bg-[#1F2937] text-white font-mono text-xs font-semibold uppercase tracking-wider rounded-[8px] transition-colors cursor-pointer"
              >
                + Nuevo en Producción
              </button>
              <button
                type="button"
                onClick={() => handleCreateNewBlank("ai-projects")}
                className="px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-mono text-xs font-semibold uppercase tracking-wider rounded-[8px] transition-colors cursor-pointer"
              >
                + Nuevo Proyecto de IA
              </button>
              <button
                type="button"
                onClick={handleLoadDecoTemplate}
                className="px-4 py-2.5 bg-white hover:bg-[#F3F4F6] text-[#111827] border border-[#D1D5DB] font-mono text-xs font-semibold uppercase tracking-wider rounded-[8px] transition-colors cursor-pointer"
              >
                Cargar Molde Base (Deco Vintage)
              </button>
            </div>
          </div>

          {/* Active Session & Live Status Bar */}
          <div className="mt-6 p-4 rounded-[10px] bg-[#F8F9FA] border border-[#E5E7EB] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#ECFDF5] border border-[#6EE7B7] font-mono text-xs font-semibold text-[#065F46]">
                <span
                  aria-hidden="true"
                  className="w-2 h-2 rounded-full bg-[#10B981]"
                />
                SESIÓN ACTIVA · HTTPONLY
              </span>
              <span className="font-mono text-xs text-[#374151]">
                Administrador:{" "}
                <strong className="text-[#111827]">{authenticatedUsername}</strong>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="min-h-[40px] px-3.5 py-1.5 bg-white hover:bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5] rounded-[6px] font-mono text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-60"
              >
                {isLoggingOut ? "Cerrando Sesión..." : "Cerrar Sesión"}
              </button>
            </div>

            {/* Live Status Banner */}
            <div
              role="status"
              aria-live="polite"
              className={`px-4 py-3 rounded-[8px] border text-xs sm:text-sm font-medium md:max-w-md ${
                statusBanner.type === "error"
                  ? "bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]"
                  : statusBanner.type === "success"
                    ? "bg-[#ECFDF5] border-[#6EE7B7] text-[#065F46]"
                    : statusBanner.type === "loading"
                      ? "bg-[#EFF6FF] border-[#93C5FD] text-[#1E40AF]"
                      : "bg-white border-[#E5E7EB] text-[#374151]"
              }`}
            >
              {statusBanner.message}
            </div>
          </div>
        </div>
      </section>

      {/* Main Studio Grid: Left Catalog Sidebar (4 cols) + Right 4-Block Form (8 cols) */}
      <div className="swiss-container mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Existing Projects Grouped by Category */}
        <aside
          aria-label="Proyectos registrados en el catálogo"
          className="lg:col-span-4 space-y-6"
        >
          {/* Category 1: SISTEMAS EN PRODUCCIÓN */}
          <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 mb-4">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#2563EB] font-semibold block">
                  SECCIÓN 01 // #proyectos-destacados
                </span>
                <h2 className="font-display text-base font-bold text-[#0A0A0A]">
                  SISTEMAS EN PRODUCCIÓN ({productionSystemsList.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => handleCreateNewBlank("production-systems")}
                className="px-2.5 py-1 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] font-mono text-xs font-semibold rounded-[6px] cursor-pointer"
              >
                + Añadir
              </button>
            </div>

            <div className="space-y-3">
              {productionSystemsList.map((sys) => {
                const populatedSlots = ensureThreeGallerySlots(
                  sys.galleryImages,
                  sys.title
                ).filter((g) => g.src.trim().length > 0).length;
                const isSelected =
                  isEditingExisting && formState.slug === sys.slug;

                return (
                  <div
                    key={sys.slug}
                    className={`p-3.5 rounded-[8px] border transition-colors ${
                      isSelected
                        ? "border-[#2563EB] bg-[#EFF6FF]/60"
                        : "border-[#E5E7EB] bg-[#F8F9FA]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-[11px] text-[#4B5563] block">
                          #{sys.order} · /sistemas/{sys.slug}
                        </span>
                        <h3 className="font-display text-sm font-bold text-[#111827]">
                          {sys.title}
                        </h3>
                      </div>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white border border-[#D1D5DB] text-[#111827]">
                        {populatedSlots}/3 fotos detalle
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSelectSystemForEdit(sys)}
                          className="px-3 py-1.5 bg-[#0A0A0A] hover:bg-[#1F2937] text-white font-mono text-xs font-semibold rounded-[6px] cursor-pointer"
                        >
                          Editar
                        </button>
                        <a
                          href={`/sistemas/${sys.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 bg-white hover:bg-[#F3F4F6] border border-[#D1D5DB] text-[#111827] font-mono text-xs rounded-[6px]"
                        >
                          Ver ↗
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(sys.slug)}
                        className="px-2.5 py-1.5 text-[#B91C1C] hover:bg-[#FEF2F2] font-mono text-xs rounded-[6px] cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category 2: MÁS PROYECTOS DE IA */}
          <div className="bg-white border border-[#E5E7EB] rounded-[12px] p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3 mb-4">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#2563EB] font-semibold block">
                  SECCIÓN 02 // #mas-proyectos-ia
                </span>
                <h2 className="font-display text-base font-bold text-[#0A0A0A]">
                  MÁS PROYECTOS DE IA ({aiProjectsList.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={() => handleCreateNewBlank("ai-projects")}
                className="px-2.5 py-1 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1D4ED8] font-mono text-xs font-semibold rounded-[6px] cursor-pointer"
              >
                + Añadir IA
              </button>
            </div>

            {aiProjectsList.length === 0 ? (
              <p className="text-xs text-[#4B5563] font-mono py-3">
                Aún no hay proyectos en MÁS PROYECTOS DE IA. Usa el botón{" "}
                <strong>&quot;+ Nuevo Proyecto de IA&quot;</strong> para publicar el
                primero.
              </p>
            ) : (
              <div className="space-y-3">
                {aiProjectsList.map((sys) => {
                  const populatedSlots = ensureThreeGallerySlots(
                    sys.galleryImages,
                    sys.title
                  ).filter((g) => g.src.trim().length > 0).length;
                  const isSelected =
                    isEditingExisting && formState.slug === sys.slug;

                  return (
                    <div
                      key={sys.slug}
                      className={`p-3.5 rounded-[8px] border transition-colors ${
                        isSelected
                          ? "border-[#2563EB] bg-[#EFF6FF]/60"
                          : "border-[#E5E7EB] bg-[#F8F9FA]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-[11px] text-[#4B5563] block">
                            #{sys.order} · /sistemas/{sys.slug}
                          </span>
                          <h3 className="font-display text-sm font-bold text-[#111827]">
                            {sys.title}
                          </h3>
                        </div>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white border border-[#D1D5DB] text-[#111827]">
                          {populatedSlots}/3 fotos detalle
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectSystemForEdit(sys)}
                            className="px-3 py-1.5 bg-[#0A0A0A] hover:bg-[#1F2937] text-white font-mono text-xs font-semibold rounded-[6px] cursor-pointer"
                          >
                            Editar
                          </button>
                          <a
                            href={`/sistemas/${sys.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 bg-white hover:bg-[#F3F4F6] border border-[#D1D5DB] text-[#111827] font-mono text-xs rounded-[6px]"
                          >
                            Ver ↗
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteProject(sys.slug)}
                          className="px-2.5 py-1.5 text-[#B91C1C] hover:bg-[#FEF2F2] font-mono text-xs rounded-[6px] cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Right Column: Complete 4-Block Project & 4-Image Editor Form */}
        <form
          action="/api/admin/systems"
          method="POST"
          onSubmit={handleSubmitForm}
          className="lg:col-span-8 space-y-8"
          noValidate
        >
          {/* ================================================================ */}
          {/* BLOQUE A — SELECTOR DE CATEGORÍA Y DATOS DE LA TARJETA DE INICIO */}
          {/* ================================================================ */}
          <fieldset className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 sm:p-8 shadow-xs space-y-6">
            <legend className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#2563EB] px-2">
              BLOQUE A // CATEGORÍA EN HOME, TARJETA PRELIMINAR E IMAGEN DE PORTADA
            </legend>

            {/* Category Radio Buttons (Zero-Click Scanning for 2 Exclusive Choices) */}
            <div>
              <span className="block font-mono text-xs font-semibold uppercase tracking-wider text-[#111827] mb-2">
                Ubicación del Proyecto en la Página de Inicio (catalogSection) *
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  htmlFor="catalog-section-production"
                  className={`flex items-start gap-3 p-4 rounded-[8px] border cursor-pointer transition-colors ${
                    formState.catalogSection === "production-systems"
                      ? "border-[#2563EB] bg-[#EFF6FF]/60"
                      : "border-[#D1D5DB] bg-[#F8F9FA]"
                  }`}
                >
                  <input
                    id="catalog-section-production"
                    type="radio"
                    name="catalogSection"
                    value="production-systems"
                    checked={formState.catalogSection === "production-systems"}
                    onChange={() =>
                      setFormState((prev) => ({
                        ...prev,
                        catalogSection: "production-systems"
                      }))
                    }
                    className="mt-1 accent-[#2563EB]"
                  />
                  <div>
                    <span className="font-display text-sm font-bold text-[#111827] block">
                      SISTEMAS EN PRODUCCIÓN
                    </span>
                    <span className="text-xs text-[#4B5563] block mt-0.5">
                      Aparece en la sección principal (#proyectos-destacados) para
                      plataformas ya desplegadas en producción.
                    </span>
                  </div>
                </label>

                <label
                  htmlFor="catalog-section-ai"
                  className={`flex items-start gap-3 p-4 rounded-[8px] border cursor-pointer transition-colors ${
                    formState.catalogSection === "ai-projects"
                      ? "border-[#2563EB] bg-[#EFF6FF]/60"
                      : "border-[#D1D5DB] bg-[#F8F9FA]"
                  }`}
                >
                  <input
                    id="catalog-section-ai"
                    type="radio"
                    name="catalogSection"
                    value="ai-projects"
                    checked={formState.catalogSection === "ai-projects"}
                    onChange={() =>
                      setFormState((prev) => ({
                        ...prev,
                        catalogSection: "ai-projects"
                      }))
                    }
                    className="mt-1 accent-[#2563EB]"
                  />
                  <div>
                    <span className="font-display text-sm font-bold text-[#111827] block">
                      MÁS PROYECTOS DE IA
                    </span>
                    <span className="text-xs text-[#4B5563] block mt-0.5">
                      Aparece bajo &quot;MÁS PROYECTOS DE IA&quot; (#mas-proyectos-ia) para
                      agentes ADK, RAG y arquitecturas en construcción.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Order, Header Label, Version Badge & Featured Checkbox */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="project-order-input"
                  className="block font-mono text-xs font-semibold uppercase text-[#111827] mb-1"
                >
                  Orden *
                </label>
                <input
                  id="project-order-input"
                  name="order"
                  type="text"
                  value={formState.order}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, order: e.target.value }))
                  }
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="w-full min-h-[44px] px-3 py-2 border border-[#D1D5DB] rounded-[6px] font-mono text-sm"
                />
              </div>

              <div className="sm:col-span-6">
                <label
                  htmlFor="project-header-label-input"
                  className="block font-mono text-xs font-semibold uppercase text-[#111827] mb-1"
                >
                  Header Izquierdo de Tarjeta (projectHeaderLabel)
                </label>
                <input
                  id="project-header-label-input"
                  name="projectHeaderLabel"
                  type="text"
                  value={formState.projectHeaderLabel || ""}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      projectHeaderLabel: e.target.value
                    }))
                  }
                  placeholder="PROJECT 01 // E-COMMERCE & CLOUD MEDIA ENGINE"
                  className="w-full min-h-[44px] px-3 py-2 border border-[#D1D5DB] rounded-[6px] font-mono text-sm"
                />
              </div>

              <div className="sm:col-span-4">
                <label
                  htmlFor="project-version-badge-input"
                  className="block font-mono text-xs font-semibold uppercase text-[#111827] mb-1"
                >
                  Badge de Versión (versionBadge)
                </label>
                <input
                  id="project-version-badge-input"
                  name="versionBadge"
                  type="text"
                  value={formState.versionBadge || ""}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      versionBadge: e.target.value
                    }))
                  }
                  placeholder="v3.4.0 PRODUCTION"
                  className="w-full min-h-[44px] px-3 py-2 border border-[#D1D5DB] rounded-[6px] font-mono text-sm"
                />
              </div>
            </div>

            {/* Title, Slug & Category Label */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-5">
                <label
                  htmlFor="project-title-input"
                  className="block font-mono text-xs font-semibold uppercase text-[#111827] mb-1"
                >
                  Título del Proyecto (title) *
                </label>
                <input
                  id="project-title-input"
                  name="title"
                  type="text"
                  required
                  value={formState.title}
                  onChange={(e) => {
                    const nextTitle = e.target.value;
                    clearFieldError("title");
                    setFormState((prev) => ({
                      ...prev,
                      title: nextTitle,
                      slug:
                        !isEditingExisting && !prev.slug
                          ? slugifyProjectTitle(nextTitle)
                          : prev.slug
                    }));
                  }}
                  onBlur={(e) => validateFieldOnBlur("title", e.target.value)}
                  placeholder="DECO VINTAGE PLATFORM"
                  className="w-full min-h-[44px] px-3 py-2 border border-[#D1D5DB] rounded-[6px] text-sm font-semibold"
                />
                {fieldErrors.title && (
                  <p className="mt-1 text-xs text-[#B91C1C]">{fieldErrors.title}</p>
                )}
              </div>

              <div className="sm:col-span-4">
                <label
                  htmlFor="project-slug-input"
                  className="block font-mono text-xs font-semibold uppercase text-[#111827] mb-1"
                >
                  Slug URL (/sistemas/[slug]) *
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="project-slug-input"
                    name="slug"
                    type="text"
                    required
                    value={formState.slug}
                    onChange={(e) => {
                      clearFieldError("slug");
                      setFormState((prev) => ({
                        ...prev,
                        slug: slugifyProjectTitle(e.target.value)
                      }));
                    }}
                    onBlur={(e) => validateFieldOnBlur("slug", e.target.value)}
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder="deco-vintage-platform"
                    className="w-full min-h-[44px] px-3 py-2 border border-[#D1D5DB] rounded-[6px] font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFormState((prev) => ({
                        ...prev,
                        slug: slugifyProjectTitle(prev.title)
                      }))
                    }
                    className="min-h-[44px] px-2.5 py-2 bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#D1D5DB] rounded-[6px] font-mono text-[11px] cursor-pointer"
                  >
                    Auto
                  </button>
                </div>
                {fieldErrors.slug && (
                  <p className="mt-1 text-xs text-[#B91C1C]">{fieldErrors.slug}</p>
                )}
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="project-category-label-input"
                  className="block font-mono text-xs font-semibold uppercase text-[#111827] mb-1"
                >
                  Etiqueta Categoría *
                </label>
                <input
                  id="project-category-label-input"
                  name="categoryLabel"
                  type="text"
                  required
                  value={formState.categoryLabel}
                  onChange={(e) => {
                    clearFieldError("categoryLabel");
                    setFormState((prev) => ({
                      ...prev,
                      categoryLabel: e.target.value
                    }));
                  }}
                  onBlur={(e) =>
                    validateFieldOnBlur("categoryLabel", e.target.value)
                  }
                  placeholder="E-COMMERCE & CLOUD MEDIA ENGINE"
                  className="w-full min-h-[44px] px-3 py-2 border border-[#D1D5DB] rounded-[6px] font-mono text-xs"
                />
                {fieldErrors.categoryLabel && (
                  <p className="mt-1 text-xs text-[#B91C1C]">
                    {fieldErrors.categoryLabel}
                  </p>
                )}
              </div>
            </div>

            {/* Summary Description on Card */}
            <div>
              <label
                htmlFor="project-summary-textarea"
                className="block font-mono text-xs font-semibold uppercase text-[#111827] mb-1"
              >
                Descripción de la Tarjeta de Inicio (summary) *
              </label>
              <textarea
                id="project-summary-textarea"
                name="summary"
                rows={3}
                required
                value={formState.summary}
                onChange={(e) => {
                  clearFieldError("summary");
                  setFormState((prev) => ({
                    ...prev,
                    summary: e.target.value
                  }));
                }}
                onBlur={(e) => validateFieldOnBlur("summary", e.target.value)}
                placeholder="Resumen ejecutivo del sistema que se muestra en la tarjeta de vista preliminar..."
                className="w-full px-3.5 py-2.5 border border-[#D1D5DB] rounded-[6px] text-sm"
              />
              {fieldErrors.summary && (
                <p className="mt-1 text-xs text-[#B91C1C]">{fieldErrors.summary}</p>
              )}
            </div>

            {/* Stack Pills Editor + Highlighted Blue Pill Selector */}
            <div className="p-4 rounded-[8px] bg-[#F8F9FA] border border-[#E5E7EB] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div className="flex-1">
                  <label
                    htmlFor="new-stack-tag-input"
                    className="block font-mono text-xs font-semibold uppercase text-[#111827] mb-1"
                  >
                    Pills de Stack Tecnológico (stackTags) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="new-stack-tag-input"
                      name="newStackTag"
                      type="text"
                      value={newStackTagInput}
                      onChange={(e) => setNewStackTagInput(e.target.value)}
                      placeholder="Ej. GOOGLE ADK, POSTGRESQL + PGVECTOR, DOCKER..."
                      className="w-full min-h-[42px] px-3 py-1.5 bg-white border border-[#D1D5DB] rounded-[6px] font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddStackTag}
                      className="min-h-[42px] px-4 py-1.5 bg-[#0A0A0A] hover:bg-[#1F2937] text-white font-mono text-xs font-semibold rounded-[6px] cursor-pointer whitespace-nowrap"
                    >
                      + Añadir Pill
                    </button>
                  </div>
                </div>

                <div className="sm:w-64">
                  <label
                    htmlFor="highlighted-stack-tag-select"
                    className="block font-mono text-xs font-semibold uppercase text-[#2563EB] mb-1"
                  >
                    Pill Destacado en Azul (highlightedStackTag)
                  </label>
                  <select
                    id="highlighted-stack-tag-select"
                    name="highlightedStackTag"
                    value={formState.highlightedStackTag || ""}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        highlightedStackTag: e.target.value
                      }))
                    }
                    className="w-full min-h-[42px] px-3 py-1.5 bg-white border border-[#D1D5DB] rounded-[6px] font-mono text-xs"
                  >
                    {formState.stackTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {formState.stackTags.map((tag) => {
                  const isHighlighted = formState.highlightedStackTag === tag;
                  return (
                    <span
                      key={tag}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-[6px] font-mono text-xs font-semibold border ${
                        isHighlighted
                          ? "bg-[#EFF6FF] border-[#93C5FD] text-[#2563EB]"
                          : "bg-white border-[#D1D5DB] text-[#111827]"
                      }`}
                    >
                      {tag}
                      {isHighlighted && (
                        <span className="text-[10px] uppercase">(AZUL)</span>
                      )}
                      <button
                        type="button"
                        aria-label={`Quitar tag ${tag}`}
                        onClick={() => handleRemoveStackTag(tag)}
                        className="text-[#6B7280] hover:text-[#B91C1C] font-bold cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Architecture & Availability Specs + Live URL + Featured Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[0, 1].map((specIdx) => {
                const spec = formState.architectureSpecs[specIdx] ?? {
                  label: specIdx === 0 ? "ARQUITECTURA" : "DISPONIBILIDAD",
                  value: ""
                };
                return (
                  <div
                    key={specIdx}
                    className="p-3.5 rounded-[8px] border border-[#E5E7EB] bg-[#F8F9FA] space-y-2"
                  >
                    <label
                      htmlFor={`arch-spec-label-${specIdx}`}
                      className="block font-mono text-[11px] font-semibold uppercase text-[#4B5563]"
                    >
                      Recuadro Métrica {specIdx + 1} (Etiqueta / Valor)
                    </label>
                    <input
                      id={`arch-spec-label-${specIdx}`}
                      name={`archSpecLabel_${specIdx}`}
                      type="text"
                      value={spec.label}
                      onChange={(e) =>
                        handleUpdateArchSpec(specIdx, "label", e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded font-mono text-xs"
                    />
                    <input
                      id={`arch-spec-value-${specIdx}`}
                      name={`archSpecValue_${specIdx}`}
                      type="text"
                      aria-label={`Valor de especificación ${specIdx + 1}`}
                      value={spec.value}
                      onChange={(e) =>
                        handleUpdateArchSpec(specIdx, "value", e.target.value)
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded text-sm font-semibold"
                    />
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-8">
                <label
                  htmlFor="project-live-url-input"
                  className="block font-mono text-xs font-semibold uppercase text-[#111827] mb-1"
                >
                  URL del Sistema en Vivo (liveUrl — Botón &quot;PROBAR SISTEMA EN VIVO ↗&quot;) *
                </label>
                <input
                  id="project-live-url-input"
                  name="liveUrl"
                  type="url"
                  required
                  value={formState.liveUrl}
                  onChange={(e) => {
                    clearFieldError("liveUrl");
                    setFormState((prev) => ({
                      ...prev,
                      liveUrl: e.target.value
                    }));
                  }}
                  onBlur={(e) => validateFieldOnBlur("liveUrl", e.target.value)}
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  placeholder="https://www.decovintage.online"
                  className="w-full min-h-[44px] px-3 py-2 border border-[#D1D5DB] rounded-[6px] font-mono text-sm"
                />
                {fieldErrors.liveUrl && (
                  <p className="mt-1 text-xs text-[#B91C1C]">
                    {fieldErrors.liveUrl}
                  </p>
                )}
              </div>

              <div className="sm:col-span-4 pt-4">
                <label
                  htmlFor="project-featured-checkbox"
                  className="inline-flex items-center gap-2.5 cursor-pointer select-none"
                >
                  <input
                    id="project-featured-checkbox"
                    name="featuredOnHome"
                    type="checkbox"
                    checked={formState.featuredOnHome ?? true}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        featuredOnHome: e.target.checked
                      }))
                    }
                    className="w-4 h-4 accent-[#2563EB]"
                  />
                  <span className="font-mono text-xs font-semibold text-[#111827]">
                    Mostrar Tarjeta en Home (featuredOnHome)
                  </span>
                </label>
              </div>
            </div>

            {/* Cover Image Uploader (Image #1 of 4: Home Card Preview Image) */}
            <div className="p-5 rounded-[10px] border-2 border-dashed border-[#CBD5E1] bg-[#F8F9FA] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#2563EB] block">
                    IMAGEN 1 DE 4 // PORTADA DE LA TARJETA EN EL INICIO (previewImageSrc)
                  </span>
                  <p className="text-xs text-[#4B5563]">
                    Esta imagen se muestra únicamente en la tarjeta resumen de la
                    página principal (diferente a las 3 imágenes de detalle).
                  </p>
                </div>
                {coverUploadStatus.uploading && (
                  <span className="font-mono text-xs text-[#2563EB] font-semibold">
                    Subiendo a /app/data/uploads...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-5">
                  <div className="aspect-16/10 w-full rounded-[8px] overflow-hidden border border-[#D1D5DB] bg-white flex items-center justify-center">
                    {formState.previewImageSrc ? (
                      <img
                        src={formState.previewImageSrc}
                        alt={
                          formState.previewImageAlt ||
                          formState.title ||
                          "Vista previa portada"
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-mono text-xs text-[#6B7280]">
                        Sin imagen de portada
                      </span>
                    )}
                  </div>
                </div>

                <div className="md:col-span-7 space-y-3">
                  <div>
                    <label
                      htmlFor="cover-image-file-input"
                      className="block font-mono text-xs font-semibold uppercase text-[#111827] mb-1"
                    >
                      Subir Imagen de Portada desde tu PC (PNG, JPG, WEBP &lt;= 10 MB)
                    </label>
                    <input
                      id="cover-image-file-input"
                      name="coverImageFile"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleCoverFileChange}
                      className="block w-full text-xs text-[#374151] file:mr-3 file:py-2 file:px-3.5 file:rounded-[6px] file:border-0 file:font-mono file:text-xs file:font-semibold file:bg-[#0A0A0A] file:text-white hover:file:bg-[#1F2937] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cover-image-src-input"
                      className="block font-mono text-[11px] font-semibold uppercase text-[#4B5563] mb-1"
                    >
                      Ruta o URL Activa de Portada (previewImageSrc)
                    </label>
                    <input
                      id="cover-image-src-input"
                      name="previewImageSrc"
                      type="text"
                      value={formState.previewImageSrc || ""}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          previewImageSrc: e.target.value
                        }))
                      }
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      className="w-full px-3 py-1.5 bg-white border border-[#D1D5DB] rounded-[6px] font-mono text-xs"
                    />
                  </div>

                  {coverUploadStatus.error && (
                    <p className="text-xs text-[#B91C1C] font-medium">
                      {coverUploadStatus.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </fieldset>

          {/* ================================================================ */}
          {/* BLOQUE B — LAS 3 IMÁGENES EXCLUSIVAS DE LA VISTA DE DETALLE      */}
          {/* ================================================================ */}
          <fieldset className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 sm:p-8 shadow-xs space-y-6">
            <legend className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#2563EB] px-2">
              BLOQUE B // 3 IMÁGENES EXCLUSIVAS DE LA VISTA DE DETALLE (/sistemas/[slug])
            </legend>

            <p className="text-xs sm:text-sm text-[#4B5563]">
              Estas <strong className="text-[#111827]">3 vistas técnicas (VIEW 01, VIEW 02, VIEW 03)</strong>{" "}
              se renderizan dentro de la página de estudio de caso (
              <code>01 // VISTAS DE INTERFAZ Y OPERACIÓN DEL SISTEMA</code>) y son{" "}
              <strong className="text-[#111827]">
                independientes de la foto de la tarjeta de inicio
              </strong>
              .
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {normalizedGallerySlots.map((slotItem) => {
                const slotNum = slotItem.slot;
                const slotStatus = galleryUploadStatus[slotNum];
                const hasUploadedSrc = slotItem.src.trim().length > 0;

                return (
                  <div
                    key={slotNum}
                    className="p-4 rounded-[10px] border border-[#D1D5DB] bg-[#F8F9FA] flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[#111827]">
                          RANURA DETALLE // VIEW 0{slotNum}
                        </span>
                        <span
                          className={`font-mono text-[10px] px-2 py-0.5 rounded font-semibold ${
                            hasUploadedSrc
                              ? "bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7]"
                              : "bg-white text-[#6B7280] border border-[#D1D5DB]"
                          }`}
                        >
                          {hasUploadedSrc ? "ACTIVA" : "VACÍA"}
                        </span>
                      </div>

                      {/* Slot Image Preview */}
                      <div className="aspect-16/10 w-full rounded-[6px] overflow-hidden border border-[#D1D5DB] bg-white flex items-center justify-center">
                        {hasUploadedSrc ? (
                          <img
                            src={slotItem.src}
                            alt={slotItem.alt || slotItem.label}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-mono text-[11px] text-[#6B7280] text-center px-2">
                            VIEW 0{slotNum} · Lista para subir desde tu PC
                          </span>
                        )}
                      </div>

                      {/* File Input from PC */}
                      <div>
                        <label
                          htmlFor={`gallery-file-slot-${slotNum}`}
                          className="block font-mono text-[11px] font-semibold uppercase text-[#111827] mb-1"
                        >
                          Subir Foto VIEW 0{slotNum} desde PC
                        </label>
                        <input
                          id={`gallery-file-slot-${slotNum}`}
                          name={`galleryFileSlot_${slotNum}`}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) =>
                            handleGallerySlotFileChange(slotNum, e)
                          }
                          className="block w-full text-[11px] text-[#374151] file:mr-2 file:py-1.5 file:px-2.5 file:rounded file:border-0 file:font-mono file:text-[11px] file:font-semibold file:bg-[#2563EB] file:text-white hover:file:bg-[#1D4ED8] cursor-pointer"
                        />
                        {slotStatus.uploading && (
                          <p className="mt-1 font-mono text-[11px] text-[#2563EB]">
                            Subiendo VIEW 0{slotNum}...
                          </p>
                        )}
                        {slotStatus.error && (
                          <p className="mt-1 text-[11px] text-[#B91C1C]">
                            {slotStatus.error}
                          </p>
                        )}
                      </div>

                      {/* URL / Path Input */}
                      <div>
                        <label
                          htmlFor={`gallery-src-slot-${slotNum}`}
                          className="block font-mono text-[10px] font-semibold uppercase text-[#4B5563] mb-0.5"
                        >
                          URL de Imagen VIEW 0{slotNum} (src)
                        </label>
                        <input
                          id={`gallery-src-slot-${slotNum}`}
                          name={`gallerySrcSlot_${slotNum}`}
                          type="text"
                          value={slotItem.src}
                          onChange={(e) =>
                            updateGallerySlotField(
                              slotNum,
                              "src",
                              e.target.value
                            )
                          }
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          placeholder={`/api/assets/vista-detalle-0${slotNum}.webp`}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded font-mono text-xs"
                        />
                      </div>

                      {/* Label Input */}
                      <div>
                        <label
                          htmlFor={`gallery-label-slot-${slotNum}`}
                          className="block font-mono text-[10px] font-semibold uppercase text-[#4B5563] mb-0.5"
                        >
                          Etiqueta Técnica Superior (label)
                        </label>
                        <input
                          id={`gallery-label-slot-${slotNum}`}
                          name={`galleryLabelSlot_${slotNum}`}
                          type="text"
                          value={slotItem.label}
                          onChange={(e) =>
                            updateGallerySlotField(
                              slotNum,
                              "label",
                              e.target.value
                            )
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded font-mono text-xs"
                        />
                      </div>

                      {/* Caption Input */}
                      <div>
                        <label
                          htmlFor={`gallery-caption-slot-${slotNum}`}
                          className="block font-mono text-[10px] font-semibold uppercase text-[#4B5563] mb-0.5"
                        >
                          Pie de Foto Explicativo (caption)
                        </label>
                        <textarea
                          id={`gallery-caption-slot-${slotNum}`}
                          name={`galleryCaptionSlot_${slotNum}`}
                          rows={2}
                          value={slotItem.caption}
                          onChange={(e) =>
                            updateGallerySlotField(
                              slotNum,
                              "caption",
                              e.target.value
                            )
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded text-xs"
                        />
                      </div>
                    </div>

                    {hasUploadedSrc && (
                      <button
                        type="button"
                        onClick={() =>
                          updateGallerySlotField(slotNum, "src", "")
                        }
                        className="w-full py-1.5 text-center font-mono text-[11px] text-[#B91C1C] hover:bg-[#FEF2F2] rounded border border-transparent hover:border-[#FCA5A5] cursor-pointer"
                      >
                        Limpiar Imagen VIEW 0{slotNum}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>

          {/* ================================================================ */}
          {/* BLOQUE C — NARRATIVA ARQUITECTÓNICA Y DEPLOYMENT LEDGER          */}
          {/* ================================================================ */}
          <fieldset className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 sm:p-8 shadow-xs space-y-5">
            <legend className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#2563EB] px-2">
              BLOQUE C // NARRATIVA DEL CASO DE ESTUDIO Y DEPLOYMENT METADATA LEDGER
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-8">
                <label
                  htmlFor="project-subtitle-input"
                  className="block font-mono text-xs font-semibold uppercase text-[#111827] mb-1"
                >
                  Subtítulo Técnico en Vista de Detalle (subtitle) *
                </label>
                <input
                  id="project-subtitle-input"
                  name="subtitle"
                  type="text"
                  required
                  value={formState.subtitle}
                  onChange={(e) => {
                    clearFieldError("subtitle");
                    setFormState((prev) => ({
                      ...prev,
                      subtitle: e.target.value
                    }));
                  }}
                  onBlur={(e) => validateFieldOnBlur("subtitle", e.target.value)}
                  placeholder="Plataforma E-Commerce Full-Stack, Cotizador Dinámico & Pipeline Multimedia"
                  className="w-full min-h-[44px] px-3 py-2 border border-[#D1D5DB] rounded-[6px] text-sm"
                />
                {fieldErrors.subtitle && (
                  <p className="mt-1 text-xs text-[#B91C1C]">
                    {fieldErrors.subtitle}
                  </p>
                )}
              </div>

              <div className="sm:col-span-4">
                <label
                  htmlFor="project-status-select"
                  className="block font-mono text-xs font-semibold uppercase text-[#111827] mb-1"
                >
                  Estado Operativo (status)
                </label>
                <select
                  id="project-status-select"
                  name="status"
                  value={formState.status || "PRODUCTION // ONLINE"}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      status: e.target.value as ProductionSystem["status"]
                    }))
                  }
                  className="w-full min-h-[44px] px-3 py-2 bg-white border border-[#D1D5DB] rounded-[6px] font-mono text-xs"
                >
                  <option value="PRODUCTION // ONLINE">
                    PRODUCTION // ONLINE
                  </option>
                  <option value="PRODUCTION // VERIFIED">
                    PRODUCTION // VERIFIED
                  </option>
                  <option value="ACTIVE // EDGE NODE">
                    ACTIVE // EDGE NODE
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="project-narrative-textarea"
                className="block font-mono text-xs font-semibold uppercase text-[#111827] mb-1"
              >
                Narrativa Arquitectónica Profunda (architecturalNarrative)
              </label>
              <textarea
                id="project-narrative-textarea"
                name="architecturalNarrative"
                rows={4}
                value={formState.architecturalNarrative}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    architecturalNarrative: e.target.value
                  }))
                }
                placeholder="Explica la arquitectura interna, decisiones de diseño y garantías en producción..."
                className="w-full px-3.5 py-2.5 border border-[#D1D5DB] rounded-[6px] text-sm"
              />
            </div>

            {/* Deployment Ledger 4 Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label
                  htmlFor="ledger-arch-pattern-input"
                  className="block font-mono text-xs font-semibold uppercase text-[#111827] mb-1"
                >
                  ARCHITECTURE PATTERN
                </label>
                <input
                  id="ledger-arch-pattern-input"
                  name="architecturePattern"
                  type="text"
                  value={formState.deploymentLedger.architecturePattern}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      deploymentLedger: {
                        ...prev.deploymentLedger,
                        architecturePattern: e.target.value
                      }
                    }))
                  }
                  className="w-full min-h-[42px] px-3 py-1.5 border border-[#D1D5DB] rounded-[6px] font-mono text-xs"
                />
              </div>

              <div>
                <label
                  htmlFor="ledger-commit-sha-input"
                  className="block font-mono text-xs font-semibold uppercase text-[#111827] mb-1"
                >
                  COMMIT SHA / RELEASE
                </label>
                <input
                  id="ledger-commit-sha-input"
                  name="commitSha"
                  type="text"
                  value={formState.deploymentLedger.commitSha}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      deploymentLedger: {
                        ...prev.deploymentLedger,
                        commitSha: e.target.value
                      }
                    }))
                  }
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="w-full min-h-[42px] px-3 py-1.5 border border-[#D1D5DB] rounded-[6px] font-mono text-xs"
                />
              </div>

              <div>
                <label
                  htmlFor="ledger-gate-status-input"
                  className="block font-mono text-xs font-semibold uppercase text-[#111827] mb-1"
                >
                  GATE STATUS
                </label>
                <input
                  id="ledger-gate-status-input"
                  name="verificationGate"
                  type="text"
                  value={formState.deploymentLedger.verificationGate}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      deploymentLedger: {
                        ...prev.deploymentLedger,
                        verificationGate: e.target.value
                      }
                    }))
                  }
                  className="w-full min-h-[42px] px-3 py-1.5 border border-[#D1D5DB] rounded-[6px] font-mono text-xs"
                />
              </div>

              <div>
                <label
                  htmlFor="ledger-host-os-input"
                  className="block font-mono text-xs font-semibold uppercase text-[#111827] mb-1"
                >
                  HOST OS / INFRASTRUCTURE
                </label>
                <input
                  id="ledger-host-os-input"
                  name="hostEnvironment"
                  type="text"
                  value={formState.deploymentLedger.hostEnvironment}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      deploymentLedger: {
                        ...prev.deploymentLedger,
                        hostEnvironment: e.target.value
                      }
                    }))
                  }
                  className="w-full min-h-[42px] px-3 py-1.5 border border-[#D1D5DB] rounded-[6px] font-mono text-xs"
                />
              </div>
            </div>
          </fieldset>

          {/* ================================================================ */}
          {/* BLOQUE D — BLUEPRINT TÉCNICO (PIPELINE, CÓDIGO Y DESAFÍOS)       */}
          {/* ================================================================ */}
          <fieldset className="bg-white border border-[#E5E7EB] rounded-[12px] p-6 sm:p-8 shadow-xs space-y-8">
            <legend className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#2563EB] px-2">
              BLOQUE D // BLUEPRINT TÉCNICO (3 ETAPAS DEL PIPELINE, CÓDIGO Y 3 DESAFÍOS)
            </legend>

            {/* D.1 — 3 Pipeline Stages */}
            <div className="space-y-4">
              <h3 className="font-display text-base font-bold text-[#111827]">
                1. Etapas del Pipeline de Producción (ETAPA 01, 02 y 03)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {formState.pipelineStages.map((stage, idx) => (
                  <div
                    key={stage.stageNumber}
                    className="p-4 rounded-[8px] border border-[#E5E7EB] bg-[#F8F9FA] space-y-2.5"
                  >
                    <span className="font-mono text-xs font-bold text-[#2563EB] block">
                      {stage.stageNumber}
                    </span>

                    <div>
                      <label
                        htmlFor={`stage-title-${idx}`}
                        className="block font-mono text-[10px] uppercase text-[#4B5563]"
                      >
                        Título de Etapa
                      </label>
                      <input
                        id={`stage-title-${idx}`}
                        name={`stageTitle_${idx}`}
                        type="text"
                        value={stage.title}
                        onChange={(e) =>
                          handleUpdatePipelineStage(idx, "title", e.target.value)
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`stage-slo-${idx}`}
                        className="block font-mono text-[10px] uppercase text-[#4B5563]"
                      >
                        Latencia / SLO
                      </label>
                      <input
                        id={`stage-slo-${idx}`}
                        name={`stageSlo_${idx}`}
                        type="text"
                        value={stage.latencyOrSlo}
                        onChange={(e) =>
                          handleUpdatePipelineStage(
                            idx,
                            "latencyOrSlo",
                            e.target.value
                          )
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`stage-desc-${idx}`}
                        className="block font-mono text-[10px] uppercase text-[#4B5563]"
                      >
                        Descripción
                      </label>
                      <textarea
                        id={`stage-desc-${idx}`}
                        name={`stageDesc_${idx}`}
                        rows={3}
                        value={stage.description}
                        onChange={(e) =>
                          handleUpdatePipelineStage(
                            idx,
                            "description",
                            e.target.value
                          )
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded text-xs"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`stage-invariants-${idx}`}
                        className="block font-mono text-[10px] uppercase text-[#4B5563]"
                      >
                        Invariantes (separadas por coma)
                      </label>
                      <input
                        id={`stage-invariants-${idx}`}
                        name={`stageInvariants_${idx}`}
                        type="text"
                        value={stage.invariants.join(", ")}
                        onChange={(e) =>
                          handleUpdatePipelineStage(
                            idx,
                            "invariants",
                            e.target.value
                          )
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded font-mono text-[11px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* D.2 — Code Inspector Tabs */}
            <div className="space-y-4 pt-2 border-t border-[#E5E7EB]">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-[#111827]">
                  2. Pestañas del Inspector Interactivo de Código (codeTabs)
                </h3>
                <button
                  type="button"
                  onClick={handleAddCodeTab}
                  className="px-3 py-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] border border-[#D1D5DB] rounded-[6px] font-mono text-xs font-semibold cursor-pointer"
                >
                  + Añadir Pestaña de Código
                </button>
              </div>

              <div className="space-y-4">
                {formState.codeTabs.map((tab, idx) => (
                  <div
                    key={`${tab.id}-${idx}`}
                    className="p-4 rounded-[8px] border border-[#E5E7EB] bg-[#F8F9FA] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#111827]">
                        PESTAÑA DE CÓDIGO #{idx + 1}
                      </span>
                      {formState.codeTabs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCodeTab(idx)}
                          className="font-mono text-xs text-[#B91C1C] hover:underline cursor-pointer"
                        >
                          Eliminar pestaña
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label
                          htmlFor={`codetab-filename-${idx}`}
                          className="block font-mono text-[10px] uppercase text-[#4B5563]"
                        >
                          Archivo (filename)
                        </label>
                        <input
                          id={`codetab-filename-${idx}`}
                          name={`codeTabFilename_${idx}`}
                          type="text"
                          value={tab.filename}
                          onChange={(e) =>
                            handleUpdateCodeTab(idx, "filename", e.target.value)
                          }
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`codetab-layer-${idx}`}
                          className="block font-mono text-[10px] uppercase text-[#4B5563]"
                        >
                          Capa Arquitectónica (layer)
                        </label>
                        <input
                          id={`codetab-layer-${idx}`}
                          name={`codeTabLayer_${idx}`}
                          type="text"
                          value={tab.layer}
                          onChange={(e) =>
                            handleUpdateCodeTab(idx, "layer", e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`codetab-lang-${idx}`}
                          className="block font-mono text-[10px] uppercase text-[#4B5563]"
                        >
                          Lenguaje (language)
                        </label>
                        <input
                          id={`codetab-lang-${idx}`}
                          name={`codeTabLang_${idx}`}
                          type="text"
                          value={tab.language}
                          onChange={(e) =>
                            handleUpdateCodeTab(idx, "language", e.target.value)
                          }
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor={`codetab-code-${idx}`}
                        className="block font-mono text-[10px] uppercase text-[#4B5563]"
                      >
                        Fragmento de Código Fuente (code)
                      </label>
                      <textarea
                        id={`codetab-code-${idx}`}
                        name={`codeTabCode_${idx}`}
                        rows={5}
                        value={tab.code}
                        onChange={(e) =>
                          handleUpdateCodeTab(idx, "code", e.target.value)
                        }
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        className="w-full px-3 py-2 bg-[#0A0A0A] text-[#F8F9FA] border border-[#374151] rounded font-mono text-xs leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* D.3 — 3 Solved Engineering Challenges */}
            <div className="space-y-4 pt-2 border-t border-[#E5E7EB]">
              <h3 className="font-display text-base font-bold text-[#111827]">
                3. Desafíos de Ingeniería Resueltos (01, 02 y 03)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {formState.solvedChallenges.map((challenge, idx) => (
                  <div
                    key={challenge.number}
                    className="p-4 rounded-[8px] border border-[#E5E7EB] bg-[#F8F9FA] space-y-2.5"
                  >
                    <span className="font-mono text-xs font-bold text-[#2563EB] block">
                      DESAFÍO #{challenge.number}
                    </span>

                    <div>
                      <label
                        htmlFor={`challenge-title-${idx}`}
                        className="block font-mono text-[10px] uppercase text-[#4B5563]"
                      >
                        Título del Desafío
                      </label>
                      <input
                        id={`challenge-title-${idx}`}
                        name={`challengeTitle_${idx}`}
                        type="text"
                        value={challenge.title}
                        onChange={(e) =>
                          handleUpdateSolvedChallenge(
                            idx,
                            "title",
                            e.target.value
                          )
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`challenge-problem-${idx}`}
                        className="block font-mono text-[10px] uppercase text-[#4B5563]"
                      >
                        Problema (problem)
                      </label>
                      <textarea
                        id={`challenge-problem-${idx}`}
                        name={`challengeProblem_${idx}`}
                        rows={2}
                        value={challenge.problem}
                        onChange={(e) =>
                          handleUpdateSolvedChallenge(
                            idx,
                            "problem",
                            e.target.value
                          )
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded text-xs"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`challenge-solution-${idx}`}
                        className="block font-mono text-[10px] uppercase text-[#4B5563]"
                      >
                        Solución de Ingeniería (solution)
                      </label>
                      <textarea
                        id={`challenge-solution-${idx}`}
                        name={`challengeSolution_${idx}`}
                        rows={2}
                        value={challenge.solution}
                        onChange={(e) =>
                          handleUpdateSolvedChallenge(
                            idx,
                            "solution",
                            e.target.value
                          )
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded text-xs"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`challenge-impact-${idx}`}
                        className="block font-mono text-[10px] uppercase text-[#4B5563]"
                      >
                        Métrica de Impacto (impactMetric)
                      </label>
                      <input
                        id={`challenge-impact-${idx}`}
                        name={`challengeImpact_${idx}`}
                        type="text"
                        value={challenge.impactMetric}
                        onChange={(e) =>
                          handleUpdateSolvedChallenge(
                            idx,
                            "impactMetric",
                            e.target.value
                          )
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D1D5DB] rounded font-mono text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-[#4B5563] font-mono">
                Destino:{" "}
                <strong className="text-[#111827]">
                  {sections[formState.catalogSection].heading}
                </strong>{" "}
                · Ruta: <code>/sistemas/{formState.slug || "nuevo"}</code>
              </div>

              <button
                type="submit"
                disabled={statusBanner.type === "loading"}
                className="min-h-[48px] px-6 py-3 bg-[#0A0A0A] hover:bg-[#1F2937] disabled:opacity-60 text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-wider rounded-[10px] transition-colors cursor-pointer"
              >
                {statusBanner.type === "loading"
                  ? "Guardando en PostgreSQL..."
                  : isEditingExisting
                    ? "Guardar Cambios y Publicar Proyecto"
                    : "Crear y Publicar Nuevo Proyecto"}
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
