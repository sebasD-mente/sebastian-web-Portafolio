import React from "react";
import type {
  OfficialFooterData,
  SocialPlatformId
} from "@/types/portfolio";

export interface OfficialFooterProps {
  footer: OfficialFooterData;
}

function renderSocialPlatformIcon(platform: SocialPlatformId): React.ReactNode {
  switch (platform) {
    case "linkedin":
      return (
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 24 24"
          className="w-4 h-4 shrink-0 fill-current"
        >
          <path d="M19 3A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H19ZM8.34 17.34V10.67H6.12V17.34H8.34ZM7.23 9.76C7.97 9.76 8.43 9.27 8.43 8.65C8.42 8.02 7.97 7.54 7.25 7.54C6.52 7.54 6.05 8.02 6.05 8.65C6.05 9.27 6.51 9.76 7.22 9.76H7.23ZM17.88 17.34V13.52C17.88 11.47 16.79 10.52 15.33 10.52C14.15 10.52 13.63 11.17 13.33 11.62V10.67H11.11C11.14 11.3 11.11 17.34 11.11 17.34H13.33V13.62C13.33 13.42 13.35 13.22 13.41 13.08C13.57 12.68 13.93 12.27 14.54 12.27C15.34 12.27 15.66 12.88 15.66 13.77V17.34H17.88Z" />
        </svg>
      );
    case "facebook":
      return (
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 24 24"
          className="w-4 h-4 shrink-0 fill-current"
        >
          <path d="M22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 16.84 5.44 20.87 10 21.8V15H8V12H10V9.5C10 7.57 11.57 6 13.5 6H16V9H14C13.45 9 13 9.45 13 10V12H16V15H13V21.95C18.05 21.45 22 17.19 22 12Z" />
        </svg>
      );
    case "instagram":
      return (
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 24 24"
          className="w-4 h-4 shrink-0 fill-current"
        >
          <path d="M7.8 2H16.2C19.4 2 22 4.6 22 7.8V16.2A5.8 5.8 0 0 1 16.2 22H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2ZM7.6 4A3.6 3.6 0 0 0 4 7.6V16.4C4 18.39 5.61 20 7.6 20H16.4A3.6 3.6 0 0 0 20 16.4V7.6C20 5.61 18.39 4 16.4 4H7.6ZM17.25 5.5A1.25 1.25 0 0 1 18.5 6.75A1.25 1.25 0 0 1 17.25 8A1.25 1.25 0 0 1 16 6.75A1.25 1.25 0 0 1 17.25 5.5ZM12 7A5 5 0 0 1 17 12A5 5 0 0 1 12 17A5 5 0 0 1 7 12A5 5 0 0 1 12 7ZM12 9A3 3 0 0 0 9 12A3 3 0 0 0 12 15A3 3 0 0 0 15 12A3 3 0 0 0 12 9Z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 24 24"
          className="w-4 h-4 shrink-0 fill-current"
        >
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67ZM8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7 8.5 7 9.71C7 10.93 7.89 12.1 8 12.27C8.14 12.44 9.76 14.94 12.25 16C12.84 16.27 13.3 16.42 13.66 16.53C14.25 16.72 14.79 16.69 15.22 16.63C15.7 16.56 16.68 16.03 16.89 15.45C17.1 14.87 17.1 14.38 17.04 14.27C16.97 14.17 16.81 14.11 16.56 14C16.31 13.86 15.09 13.26 14.87 13.18C14.64 13.1 14.5 13.06 14.31 13.3C14.15 13.55 13.67 14.11 13.53 14.27C13.38 14.44 13.24 14.46 13 14.34C12.74 14.21 11.94 13.95 11 13.11C10.26 12.45 9.77 11.64 9.62 11.39C9.5 11.15 9.61 11 9.73 10.89C9.84 10.78 10 10.6 10.1 10.45C10.23 10.31 10.27 10.2 10.35 10.04C10.43 9.87 10.39 9.73 10.33 9.61C10.27 9.5 9.77 8.26 9.56 7.77C9.36 7.29 9.16 7.35 9 7.34C8.86 7.34 8.7 7.33 8.53 7.33Z" />
        </svg>
      );
  }
}

export function OfficialFooter({ footer }: OfficialFooterProps) {
  return (
    <footer
      id="contacto"
      className="w-full border-t border-[#E5E7EB] bg-white text-[#0A0A0A]"
    >
      {/* Subtle Atelier Monolith Divider Band */}
      <div
        aria-hidden="true"
        className="w-full h-3.5 bg-[#EAECEF] border-b border-[#E5E7EB]"
      />

      {/* Social Channels & Direct Contact Section */}
      <div className="swiss-container py-10 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-5 space-y-2.5">
          <p className="mono-label text-[#2563EB]">
            DEKOLABS.ORG // CONTACTO &amp; REDES OFICIALES
          </p>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0A0A0A]">
            {footer.sectionTitle}
          </h2>
          <p className="text-sm text-[#4B5563] leading-relaxed max-w-xl">
            {footer.sectionSubtitle}
          </p>
        </div>

        <div className="lg:col-span-7 flex lg:justify-end">
          <nav
            aria-label="Redes sociales y contacto directo"
            className="w-full lg:w-auto"
          >
            <ul className="grid grid-cols-2 sm:flex sm:flex-wrap items-center lg:justify-end gap-3">
              {footer.socialLinks.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-social-platform={link.id}
                    className="group inline-flex items-center justify-center sm:justify-start gap-2.5 w-full sm:w-auto min-h-11 min-w-11 px-4 py-2.5 bg-[#F8F9FA] hover:bg-[#0A0A0A] text-[#111827] hover:text-white border border-[#D1D5DB] hover:border-[#0A0A0A] rounded-[8px] mono-nav text-xs font-semibold tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
                  >
                    {renderSocialPlatformIcon(link.id)}
                    <span>{link.label}</span>
                    <span className="visually-hidden">
                      {" "}
                      (abre en nueva pestaña)
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-[11px] text-[#4B5563] group-hover:text-[#D1D5DB] transition-colors"
                    >
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Institutional Copyright Strip */}
      <div className="border-t border-[#E5E7EB] bg-[#F8F9FA] py-4">
        <div className="swiss-container relative flex items-center justify-center text-center">
          <p className="mono-code text-xs sm:text-[13px] font-semibold text-[#111827]">
            {footer.copyrightNotice}
          </p>
          <div className="absolute right-4 sm:right-6 flex items-center">
            <a
              href="/admin/login"
              aria-label="Acceso de administrador"
              data-admin-login-trigger="true"
              className="inline-flex items-center justify-center p-1 rounded-[4px] text-[#9CA3AF] hover:text-[#4B5563] opacity-60 hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
            >
              <svg
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5 shrink-0"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
