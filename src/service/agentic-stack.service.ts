import { defaultAgenticStackRepository } from "@/repo/agentic-stack.repo";
import { defaultSiteRepository } from "@/repo/site.repo";
import type {
  AgenticStackProvider,
  AgenticStackSnapshot,
  CommercialDeliveryBlueprint,
  HarnessVerificationGate,
  SiteConfigProvider,
  StackCapabilityCategoryId,
  StackCapabilityCategoryOption,
  StackCapabilityItem
} from "@/types/portfolio";

const CATEGORY_METADATA: ReadonlyArray<{
  id: StackCapabilityCategoryId;
  code: string;
  label: string;
}> = [
  { id: "all", code: "ALL", label: "Matriz Completa" },
  { id: "ai-agentic", code: "AI", label: "IA & Orquestación Agéntica" },
  {
    id: "distributed-backend",
    code: "BACKEND",
    label: "Backend Distribuido & APIs"
  },
  {
    id: "frontend-design",
    code: "UI",
    label: "Frontend Suizo & Sistemas UI"
  },
  {
    id: "cloud-homelab",
    code: "INFRA",
    label: "Infraestructura, Cloud & Home Lab"
  }
];

export function buildStackCategoryOptions(
  capabilities: StackCapabilityItem[]
): StackCapabilityCategoryOption[] {
  return CATEGORY_METADATA.map((category) => {
    const count =
      category.id === "all"
        ? capabilities.length
        : capabilities.filter((item) => item.category === category.id).length;

    return {
      id: category.id,
      code: category.code,
      label: category.label,
      count
    };
  });
}

export function getAgenticStackSnapshot(
  stackProvider: AgenticStackProvider = defaultAgenticStackRepository,
  siteProvider: SiteConfigProvider = defaultSiteRepository
): AgenticStackSnapshot {
  const architectureLayers = [...siteProvider.getArchitectureLayers()].sort(
    (a, b) => a.order - b.order
  );
  const makerCheckerSpec = stackProvider.getMakerCheckerSpec();
  const workflowNodes = stackProvider.getWorkflowNodes();
  const verificationGates = stackProvider.getVerificationGates();
  const mcpBridges = stackProvider.getMcpBridges();
  const stackCapabilities = stackProvider.getStackCapabilities();
  const stackCategories = buildStackCategoryOptions(stackCapabilities);
  const commercialBlueprints = stackProvider.getCommercialBlueprints();

  return {
    architectureLayers,
    makerCheckerSpec,
    workflowNodes,
    verificationGates,
    mcpBridges,
    stackCategories,
    stackCapabilities,
    commercialBlueprints
  };
}

export function getStackCapabilitiesByCategory(
  category: StackCapabilityCategoryId = "all",
  stackProvider: AgenticStackProvider = defaultAgenticStackRepository
): StackCapabilityItem[] {
  const allCapabilities = stackProvider.getStackCapabilities();
  if (category === "all") {
    return allCapabilities;
  }
  return allCapabilities.filter((item) => item.category === category);
}

export function getHarnessVerificationGates(
  stackProvider: AgenticStackProvider = defaultAgenticStackRepository
): HarnessVerificationGate[] {
  return stackProvider.getVerificationGates();
}

export function getCommercialDeliveryBlueprints(
  stackProvider: AgenticStackProvider = defaultAgenticStackRepository
): CommercialDeliveryBlueprint[] {
  return stackProvider.getCommercialBlueprints();
}
