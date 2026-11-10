"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import type { SiteIdentity } from "@/types/portfolio";

export interface AdminLoginViewProps {
  identity: SiteIdentity;
}

type LoginBannerState =
  | { type: "idle"; message: string }
  | { type: "loading"; message: string }
  | { type: "error"; message: string }
  | { type: "locked"; message: string }
  | { type: "success"; message: string };

export function AdminLoginView({ identity }: AdminLoginViewProps) {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [usernameTouched, setUsernameTouched] = useState<boolean>(false);
  const [passwordTouched, setPasswordTouched] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [banner, setBanner] = useState<LoginBannerState>({
    type: "idle",
    message: ""
  });

  const usernameInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  function handleUsernameChange(value: string): void {
    setUsername(value);
    if (fieldErrors.username && value.trim().length > 0) {
      setFieldErrors((prev) => ({ ...prev, username: undefined }));
    }
    if (banner.type === "error") {
      setBanner({ type: "idle", message: "" });
    }
  }

  function handlePasswordChange(value: string): void {
    setPassword(value);
    if (fieldErrors.password && value.length > 0) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }));
    }
    if (banner.type === "error") {
      setBanner({ type: "idle", message: "" });
    }
  }

  function handleUsernameBlur(): void {
    if (!usernameTouched) return;
    if (!username.trim()) {
      setFieldErrors((prev) => ({
        ...prev,
        username: "Ingresa tu usuario o correo de administrador."
      }));
    }
  }

  function handlePasswordBlur(): void {
    if (!passwordTouched) return;
    if (!password) {
      setFieldErrors((prev) => ({
        ...prev,
        password: "Ingresa tu contraseña de administrador."
      }));
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors: { username?: string; password?: string } = {};
    if (!username.trim()) {
      nextErrors.username = "Ingresa tu usuario o correo de administrador.";
    }
    if (!password) {
      nextErrors.password = "Ingresa tu contraseña de administrador.";
    }

    if (nextErrors.username || nextErrors.password) {
      setFieldErrors(nextErrors);
      setBanner({
        type: "error",
        message: "Revisa los campos obligatorios antes de continuar."
      });
      if (nextErrors.username) {
        usernameInputRef.current?.focus();
      } else if (nextErrors.password) {
        passwordInputRef.current?.focus();
      }
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    setBanner({
      type: "loading",
      message: "Verificando credenciales y estableciendo sesión segura..."
    });

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          username: username.trim(),
          password
        })
      });

      const payload = (await response.json()) as {
        ok: boolean;
        redirectTo?: string;
        message?: string;
        errors?: { username?: string; password?: string };
        remainingAttempts?: number;
        retryAfterSeconds?: number;
      };

      if (response.status === 429) {
        setIsSubmitting(false);
        setBanner({
          type: "locked",
          message:
            payload.message ||
            "Demasiados intentos fallidos. Espera unos minutos antes de reintentar."
        });
        return;
      }

      if (!response.ok || !payload.ok) {
        setIsSubmitting(false);
        if (payload.errors) {
          setFieldErrors(payload.errors);
        }
        setBanner({
          type: "error",
          message:
            payload.message ||
            "No fue posible iniciar sesión. Verifica tus credenciales."
        });
        passwordInputRef.current?.focus();
        return;
      }

      setBanner({
        type: "success",
        message: "Sesión verificada. Redirigiendo a /admin/proyectos..."
      });

      const targetPath = payload.redirectTo || "/admin/proyectos";
      if (typeof window !== "undefined") {
        window.location.assign(targetPath);
      }
    } catch {
      setIsSubmitting(false);
      setBanner({
        type: "error",
        message:
          "Error de conexión al comunicarse con /api/admin/auth/login. Intenta nuevamente."
      });
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#0A0A0A]">
      {/* Top Minimal Header */}
      <header className="w-full border-b border-[#E5E7EB] bg-white">
        <div className="swiss-container py-4 flex items-center justify-between gap-4">
          <Link
            href="/"
            aria-label={identity.logoAlt}
            className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded-[2px]"
          >
            <img
              src={identity.logoSrc}
              alt={identity.logoAlt}
              width={320}
              height={52}
              className="h-9 sm:h-11 w-auto object-contain select-none"
            />
          </Link>

          <Link
            href="/"
            className="font-mono text-xs font-semibold uppercase tracking-wider text-[#374151] hover:text-[#2563EB] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] rounded px-2 py-1"
          >
            ← Volver al Portafolio
          </Link>
        </div>
      </header>

      {/* Main Centered Sign-In Card */}
      <main
        id="contenido-principal"
        className="flex-1 flex items-start sm:items-center justify-center px-4 py-10 sm:py-16"
      >
        <section
          aria-labelledby="admin-login-heading"
          className="w-full max-w-[460px] bg-white border border-[#E5E7EB] rounded-[14px] p-6 sm:p-9 shadow-xs"
        >
          <div className="border-b border-[#E5E7EB] pb-5 mb-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#2563EB] font-semibold mb-1.5">
              DEKOLABS STUDIO // AUTH GATE (/admin/login)
            </p>
            <h1
              id="admin-login-heading"
              className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0A0A0A]"
            >
              Acceso Administrador
            </h1>
            <p className="mt-2 text-sm text-[#4B5563]">
              Inicia sesión con tus credenciales privadas para gestionar el
              catálogo de proyectos e imágenes en{" "}
              <code className="font-mono text-xs bg-[#F3F4F6] px-1.5 py-0.5 rounded">
                /admin/proyectos
              </code>
              .
            </p>
          </div>

          <form
            method="post"
            action="/api/admin/auth/login"
            onSubmit={handleSubmit}
            noValidate
            className="space-y-5"
          >
            {/* Username / Email Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-login-username"
                className="block font-mono text-xs font-semibold uppercase tracking-wider text-[#111827]"
              >
                Usuario o Email <span aria-hidden="true">*</span>
              </label>
              <input
                ref={usernameInputRef}
                id="admin-login-username"
                name="username"
                type="text"
                autoComplete="username"
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="none"
                enterKeyHint="next"
                required
                value={username}
                onChange={(e) => {
                  setUsernameTouched(true);
                  handleUsernameChange(e.target.value);
                }}
                onBlur={handleUsernameBlur}
                aria-invalid={Boolean(fieldErrors.username)}
                aria-describedby={
                  fieldErrors.username
                    ? "admin-login-username-error"
                    : "admin-login-username-hint"
                }
                placeholder="admin@dekolabs.org"
                className={`w-full min-h-[48px] px-3.5 py-2.5 bg-white border rounded-[8px] text-base text-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                  fieldErrors.username
                    ? "border-[#DC2626] bg-[#FEF2F2]/30"
                    : "border-[#9CA3AF]"
                }`}
              />
              {fieldErrors.username ? (
                <p
                  id="admin-login-username-error"
                  className="text-xs font-medium text-[#B91C1C]"
                >
                  {fieldErrors.username}
                </p>
              ) : (
                <p
                  id="admin-login-username-hint"
                  className="text-xs text-[#4B5563] font-mono"
                >
                  Identificador configurado en ADMIN_USERNAME.
                </p>
              )}
            </div>

            {/* Password Input + Accessible Show/Hide Toggle */}
            <div className="space-y-1.5">
              <label
                htmlFor="admin-login-password"
                className="block font-mono text-xs font-semibold uppercase tracking-wider text-[#111827]"
              >
                Contraseña <span aria-hidden="true">*</span>
              </label>
              <div className="flex items-stretch gap-2">
                <input
                  ref={passwordInputRef}
                  id="admin-login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  enterKeyHint="done"
                  required
                  value={password}
                  onChange={(e) => {
                    setPasswordTouched(true);
                    handlePasswordChange(e.target.value);
                  }}
                  onBlur={handlePasswordBlur}
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={
                    fieldErrors.password
                      ? "admin-login-password-error"
                      : undefined
                  }
                  placeholder="••••••••••••"
                  className={`flex-1 min-h-[48px] px-3.5 py-2.5 bg-white border rounded-[8px] text-base text-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] ${
                    fieldErrors.password
                      ? "border-[#DC2626] bg-[#FEF2F2]/30"
                      : "border-[#9CA3AF]"
                  }`}
                />
                <button
                  type="button"
                  aria-pressed={showPassword}
                  aria-label={
                    showPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  aria-describedby="admin-login-password-toggle-warning"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="min-h-[48px] px-3.5 py-2.5 bg-[#F8F9FA] hover:bg-[#E5E7EB] border border-[#9CA3AF] rounded-[8px] font-mono text-xs font-semibold text-[#111827] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]"
                >
                  {showPassword ? "OCULTAR" : "MOSTRAR"}
                </button>
              </div>
              <span
                id="admin-login-password-toggle-warning"
                className="sr-only"
              >
                Advertencia: activar esta opción mostrará tu contraseña en la
                pantalla.
              </span>
              {fieldErrors.password && (
                <p
                  id="admin-login-password-error"
                  className="text-xs font-medium text-[#B91C1C]"
                >
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Dynamic Status / Lockout / Error Feedback */}
            <div
              role="status"
              aria-live="polite"
              className={
                banner.type === "idle"
                  ? "sr-only"
                  : `p-3.5 rounded-[8px] border text-xs sm:text-sm font-medium ${
                      banner.type === "locked"
                        ? "bg-[#FFFBEB] border-[#F59E0B] text-[#92400E]"
                        : banner.type === "error"
                          ? "bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]"
                          : banner.type === "success"
                            ? "bg-[#ECFDF5] border-[#6EE7B7] text-[#065F46]"
                            : "bg-[#EFF6FF] border-[#93C5FD] text-[#1E40AF]"
                    }`
              }
            >
              {banner.message}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[48px] px-6 py-3 bg-[#0A0A0A] hover:bg-[#1F2937] disabled:opacity-60 text-white font-mono text-sm font-bold uppercase tracking-wider rounded-[10px] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2563EB]"
            >
              {isSubmitting ? "Verificando Credenciales..." : "Iniciar Sesión"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#E5E7EB] flex items-center justify-between gap-2 text-[11px] font-mono text-[#4B5563]">
            <span>SESIÓN HTTPONLY · SAMESITE=STRICT</span>
            <span>HMAC-SHA256</span>
          </div>
        </section>
      </main>
    </div>
  );
}
