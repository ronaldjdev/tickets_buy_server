import type { ResolutionContext } from "../types/variableResolution.types.js";

export interface IVariableResolver {
  resolveMap(context: ResolutionContext): Promise<Record<string, string>>;
}
