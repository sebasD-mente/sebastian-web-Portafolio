import { handleTelemetryGet } from "@/runtime/telemetry.handler";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return handleTelemetryGet(request);
}
