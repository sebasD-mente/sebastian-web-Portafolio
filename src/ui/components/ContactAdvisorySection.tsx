"use client";

import React, { useState } from "react";
import type {
  ContactFieldErrors,
  ContactSubmissionReceipt,
  EngagementModalityId,
  EngagementModalityOption
} from "@/types/portfolio";

export interface ContactAdvisorySectionProps {
  domain: string;
  modalities: EngagementModalityOption[];
}

interface ContactApiResponse {
  ok: boolean;
  receipt?: ContactSubmissionReceipt;
  message?: string;
  errors?: ContactFieldErrors;
  correlationId?: string;
}

export function ContactAdvisorySection({
  domain,
  modalities
}: ContactAdvisorySectionProps) {
  const [selectedModality, setSelectedModality] =
    useState<EngagementModalityId>(
      modalities[0]?.id ?? "end-to-end-implementation"
    );
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({});
  const [formErrorBanner, setFormErrorBanner] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ContactSubmissionReceipt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync aria-invalid with native :user-invalid / checkValidity() on blur and input
  function syncControlAriaInvalid(
    target: HTMLInputElement | HTMLTextAreaElement
  ) {
    const fieldName = target.name as keyof ContactFieldErrors;
    const isValid = target.checkValidity();

    if (!isValid) {
      target.setAttribute("aria-invalid", "true");
      target.classList.add("user-invalid-fallback");
      target.classList.remove("user-valid-fallback");
    } else {
      target.removeAttribute("aria-invalid");
      target.classList.remove("user-invalid-fallback");
      target.classList.add("user-valid-fallback");
      if (fieldErrors[fieldName]) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[fieldName];
          return next;
        });
      }
    }
  }

  function handleBlur(
    event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const target = event.currentTarget;
    if (target.value.length > 0 || target.hasAttribute("aria-invalid")) {
      syncControlAriaInvalid(target);
    }
  }

  function handleInput(
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const target = event.currentTarget;
    if (
      target.hasAttribute("aria-invalid") ||
      target.classList.contains("user-invalid-fallback")
    ) {
      syncControlAriaInvalid(target);
    }
    if (formErrorBanner) {
      setFormErrorBanner(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const controls = Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        "input[required], textarea[required]"
      )
    );

    let firstInvalidControl:
      | HTMLInputElement
      | HTMLTextAreaElement
      | null = null;
    for (const control of controls) {
      syncControlAriaInvalid(control);
      if (!control.checkValidity() && !firstInvalidControl) {
        firstInvalidControl = control;
      }
    }

    if (firstInvalidControl) {
      firstInvalidControl.focus();
      setFormErrorBanner(
        "Revisa los campos obligatorios marcados antes de enviar la solicitud."
      );
      return;
    }

    const formData = new FormData(form);
    const payload = {
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      organization: String(formData.get("organization") ?? ""),
      modality: String(formData.get("modality") ?? selectedModality),
      projectSummary: String(formData.get("projectSummary") ?? ""),
      websiteHoneypot: String(formData.get("websiteHoneypot") ?? "")
    };

    setIsSubmitting(true);
    setFormErrorBanner(null);
    setFieldErrors({});

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as ContactApiResponse;
      if (!response.ok || !data.ok) {
        setFieldErrors(data.errors ?? {});
        setFormErrorBanner(
          data.message ??
            "No se pudo procesar la solicitud. Verifica los datos e inténtalo de nuevo."
        );
        return;
      }

      if (data.receipt) {
        setReceipt(data.receipt);
        form.reset();
        controls.forEach((c) => {
          c.removeAttribute("aria-invalid");
          c.classList.remove("user-invalid-fallback", "user-valid-fallback");
        });
      }
    } catch {
      setFormErrorBanner(
        "Error de red al conectar con /api/contact. Inténtalo nuevamente en unos segundos."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      id="contacto"
      aria-labelledby="contact-advisory-heading"
      className="border-b border-[var(--outline-variant)] py-16 md:py-24 bg-[var(--surface-container-lowest)]"
    >
      <div className="swiss-container space-y-12">
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end border-b border-[var(--outline-variant)] pb-8">
          <div className="lg:col-span-8 space-y-3">
            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-[2px] border border-[var(--outline-variant)] bg-[var(--surface-container-low)] mono-label text-[var(--secondary)]">
              04 // CONTRATACIÓN DIRECTA &amp; TECHNICAL ADVISORY
            </span>
            <h2
              id="contact-advisory-heading"
              className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-[var(--primary)]"
            >
              Inicia un Proyecto o Agenda una Sesión de Arquitectura
            </h2>
            <p className="text-base text-[var(--on-surface-variant)] max-w-3xl leading-relaxed">
              Disponible para contratos de implementación{" "}
              <strong className="text-[var(--primary)]">end-to-end</strong>,
              despliegue de sistemas de agentes autónomos con gobernanza{" "}
              <strong className="text-[var(--primary)]">100/100</strong> e
              infraestructura dedicada sobre Linux / Docker.
            </p>
          </div>

          <div className="lg:col-span-4 lg:text-right space-y-1">
            <p className="mono-label text-[var(--tertiary-fixed)]">
              ● DISPONIBILIDAD INMEDIATA · Q4 / Q1
            </p>
            <p className="font-mono-tech text-xs text-[var(--on-surface-variant)]">
              Canal directo verificado en {domain} (/api/contact)
            </p>
          </div>
        </div>

        {/* Main 12-Col Grid: 5 Cols Direct Engagement Specs + 7 Cols Validated Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left 5 Cols: Engagement Guarantees & Direct Channels */}
          <div className="lg:col-span-5 space-y-6">
            <div className="border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-6 rounded-[2px] space-y-4">
              <p className="mono-label text-[var(--secondary)]">
                GARANTÍAS DE ENTREGA // DEKOLABS.ORG
              </p>
              <h3 className="font-display text-xl font-semibold text-[var(--primary)]">
                Ingeniería sin Cajas Negras ni Deuda Oculta
              </h3>
              <ul className="space-y-3 text-sm text-[var(--on-surface-variant)]" role="list">
                <li className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="font-mono-tech text-[var(--tertiary-fixed)] font-bold"
                  >
                    01
                  </span>
                  <span>
                    <strong className="text-[var(--primary)]">
                      Arquitectura de 6 Capas Verificada:
                    </strong>{" "}
                    Código modular con fronteras estrictas y pruebas automatizadas desde el Día 1.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="font-mono-tech text-[var(--tertiary-fixed)] font-bold"
                  >
                    02
                  </span>
                  <span>
                    <strong className="text-[var(--primary)]">
                      Auditoría Maker-Checker Independiente:
                    </strong>{" "}
                    Cada entregable supera las 3 puertas deterministas antes de pasar a producción.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className="font-mono-tech text-[var(--tertiary-fixed)] font-bold"
                  >
                    03
                  </span>
                  <span>
                    <strong className="text-[var(--primary)]">
                      Propiedad Total del Código e Infraestructura:
                    </strong>{" "}
                    Contenedores Docker reproducibles sin vendor lock-in forzado.
                  </span>
                </li>
              </ul>
            </div>

            <div className="border border-[var(--outline-variant)] bg-[var(--background)] p-6 rounded-[2px] space-y-3">
              <p className="mono-label text-[var(--on-surface-variant)]">
                MODALIDADES COMERCIALES ACTIVAS
              </p>
              <div className="space-y-3">
                {modalities.map((mod) => (
                  <div
                    key={mod.id}
                    className="border-b border-[var(--outline-variant)] last:border-b-0 pb-3 last:pb-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="mono-label text-[var(--primary)]">
                        {mod.code}
                      </span>
                      <span className="mono-label text-[var(--tertiary-fixed)]">
                        SLA {mod.slaResponse} · {mod.typicalDuration}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--on-surface-variant)] mt-1">
                      {mod.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 7 Cols: Accessible Contact & Technical Session Form */}
          <div className="lg:col-span-7 border border-[var(--outline-variant)] bg-[var(--background)] p-6 md:p-8 rounded-[2px]">
            <form
              action="/api/contact"
              method="POST"
              noValidate
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Assertive Alert Banner for Submission Errors */}
              {formErrorBanner && (
                <div
                  role="alert"
                  className="p-4 rounded-[2px] border border-[var(--amber-notice)] bg-[var(--surface-container-low)] text-sm text-[var(--primary)] flex items-start gap-2.5"
                >
                  <span
                    aria-hidden="true"
                    className="font-mono-tech font-bold text-[var(--amber-notice)]"
                  >
                    [!]
                  </span>
                  <span>{formErrorBanner}</span>
                </div>
              )}

              {/* Polite Receipt Banner on Successful Submission */}
              {receipt && (
                <div
                  aria-live="polite"
                  className="p-5 rounded-[2px] border border-[var(--tertiary-fixed)] bg-[var(--surface-container-low)] space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="mono-label text-[var(--tertiary-fixed)]">
                      ✓ SOLICITUD REGISTRADA // RECEIPT {receipt.receiptId}
                    </span>
                    <span className="font-mono-tech text-xs text-[var(--on-surface-variant)]">
                      CORRELATION-ID: {receipt.correlationId}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--primary)] leading-relaxed">
                    {receipt.summaryMessage}
                  </p>
                </div>
              )}

              {/* Honeypot anti-spam field hidden with canonical .visually-hidden */}
              <div className="visually-hidden" aria-hidden="true">
                <label htmlFor="contact-website-honeypot">
                  No completar este campo (Honeypot)
                </label>
                <input
                  type="text"
                  id="contact-website-honeypot"
                  name="websiteHoneypot"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* Radio Group for < 6 Exclusive Engagement Modalities */}
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-[var(--primary)]">
                  1. Modalidad de Colaboración Requerida{" "}
                  <span aria-hidden="true" className="text-[var(--amber-notice)]">
                    *
                  </span>
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {modalities.map((mod) => {
                    const inputId = `modality-${mod.id}`;
                    const isChecked = selectedModality === mod.id;
                    return (
                      <label
                        key={mod.id}
                        htmlFor={inputId}
                        className={`flex items-start gap-3 p-3.5 rounded-[2px] border cursor-pointer transition-colors min-h-[52px] ${
                          isChecked
                            ? "border-[var(--secondary)] bg-[var(--surface-container-low)]"
                            : "border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] hover:bg-[var(--surface-container-low)]"
                        }`}
                      >
                        <input
                          type="radio"
                          id={inputId}
                          name="modality"
                          value={mod.id}
                          checked={isChecked}
                          onChange={() => setSelectedModality(mod.id)}
                          required
                          className="mt-1 w-4 h-4 accent-[var(--secondary)]"
                        />
                        <span className="space-y-0.5">
                          <span className="block mono-label text-[var(--secondary)]">
                            {mod.code}
                          </span>
                          <span className="block text-sm font-medium text-[var(--primary)]">
                            {mod.title}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* Single Full Name Field + Email Field */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label
                    htmlFor="contact-full-name"
                    className="block text-sm font-semibold text-[var(--primary)]"
                  >
                    2. Nombre Completo{" "}
                    <span aria-hidden="true" className="text-[var(--amber-notice)]">
                      *
                    </span>
                  </label>
                  <span
                    id="contact-full-name-hint"
                    className="block text-xs text-[var(--on-surface-variant)]"
                  >
                    Persona de contacto o líder técnico (2 a 100 caracteres).
                  </span>
                  <input
                    type="text"
                    id="contact-full-name"
                    name="fullName"
                    required
                    minLength={2}
                    maxLength={100}
                    autoComplete="name"
                    enterKeyHint="next"
                    aria-describedby="contact-full-name-hint"
                    aria-errormessage="contact-full-name-error"
                    onBlur={handleBlur}
                    onInput={handleInput}
                    className="atelier-input w-full px-3.5 py-3 min-h-[48px] text-base rounded-[2px] border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-[var(--secondary)] focus-visible:outline-offset-2"
                  />
                  <div
                    id="contact-full-name-error"
                    className="atelier-error-msg items-center gap-1.5 text-xs text-[var(--amber-notice)] font-medium pt-1"
                  >
                    <span aria-hidden="true">[!]</span>
                    <span>
                      {fieldErrors.fullName ??
                        "Ingresa tu nombre completo (mínimo 2 caracteres)."}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="contact-email"
                    className="block text-sm font-semibold text-[var(--primary)]"
                  >
                    3. Correo Electrónico{" "}
                    <span aria-hidden="true" className="text-[var(--amber-notice)]">
                      *
                    </span>
                  </label>
                  <span
                    id="contact-email-hint"
                    className="block text-xs text-[var(--on-surface-variant)]"
                  >
                    Formato: nombre@empresa.com (sin espacios).
                  </span>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    required
                    maxLength={160}
                    autoComplete="email"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    enterKeyHint="next"
                    aria-describedby="contact-email-hint"
                    aria-errormessage="contact-email-error"
                    onBlur={handleBlur}
                    onInput={handleInput}
                    className="atelier-input w-full px-3.5 py-3 min-h-[48px] text-base rounded-[2px] border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-[var(--secondary)] focus-visible:outline-offset-2"
                  />
                  <div
                    id="contact-email-error"
                    className="atelier-error-msg items-center gap-1.5 text-xs text-[var(--amber-notice)] font-medium pt-1"
                  >
                    <span aria-hidden="true">[!]</span>
                    <span>
                      {fieldErrors.email ??
                        "Ingresa una dirección de correo electrónico válida."}
                    </span>
                  </div>
                </div>
              </div>

              {/* Optional Organization Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="contact-organization"
                  className="block text-sm font-semibold text-[var(--primary)]"
                >
                  4. Empresa, Startup o Equipo{" "}
                  <span className="text-xs font-normal text-[var(--on-surface-variant)]">
                    (Opcional)
                  </span>
                </label>
                <span
                  id="contact-org-hint"
                  className="block text-xs text-[var(--on-surface-variant)]"
                >
                  Nombre de la organización o dominio del producto actual.
                </span>
                <input
                  type="text"
                  id="contact-organization"
                  name="organization"
                  maxLength={120}
                  autoComplete="organization"
                  enterKeyHint="next"
                  aria-describedby="contact-org-hint"
                  className="w-full px-3.5 py-3 min-h-[48px] text-base rounded-[2px] border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-[var(--secondary)] focus-visible:outline-offset-2"
                />
              </div>

              {/* Project Summary Textarea */}
              <div className="space-y-1.5">
                <label
                  htmlFor="contact-project-summary"
                  className="block text-sm font-semibold text-[var(--primary)]"
                >
                  5. Especificación Técnica o Contexto del Proyecto{" "}
                  <span aria-hidden="true" className="text-[var(--amber-notice)]">
                    *
                  </span>
                </label>
                <span
                  id="contact-summary-hint"
                  className="block text-xs text-[var(--on-surface-variant)]"
                >
                  Describe la arquitectura deseada, objetivos de negocio o plazos estimados (mínimo 20 caracteres).
                </span>
                <textarea
                  id="contact-project-summary"
                  name="projectSummary"
                  required
                  minLength={20}
                  maxLength={2000}
                  rows={4}
                  aria-describedby="contact-summary-hint"
                  aria-errormessage="contact-summary-error"
                  onBlur={handleBlur}
                  onInput={handleInput}
                  className="atelier-input w-full px-3.5 py-3 text-base rounded-[2px] border border-[var(--outline-variant)] bg-[var(--surface-container-lowest)] text-[var(--primary)] focus-visible:outline-2 focus-visible:outline-[var(--secondary)] focus-visible:outline-offset-2 resize-y"
                />
                <div
                  id="contact-summary-error"
                  className="atelier-error-msg items-center gap-1.5 text-xs text-[var(--amber-notice)] font-medium pt-1"
                >
                  <span aria-hidden="true">[!]</span>
                  <span>
                    {fieldErrors.projectSummary ??
                      "Describe el alcance técnico con al menos 20 caracteres."}
                  </span>
                </div>
              </div>

              {/* Submit Button (Enabled prior to submission; disabled only while submitting) */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="mono-label text-[var(--on-surface-variant)]">
                  PROTEGIDO POR VALIDACIÓN DETERMINISTA &amp; REDACCIÓN DE SECRETOS
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] rounded-[2px] bg-[var(--primary)] text-[var(--background)] font-display text-sm font-semibold tracking-tight hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting
                    ? "Procesando Solicitud..."
                    : "Enviar Solicitud Técnica ->"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
