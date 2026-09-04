import type { ResolutionContext } from "../types/variableResolution.types";

export interface IVariableResolver {
  resolveMap(context: ResolutionContext): Promise<Record<string, string>>;
}
