export interface ResolutionContext {
	templateId?: string;
	templateName?: string;
	contactPhone?: string;
	contactId?: string;
	creditId?: string;
	campaignId?: string;
}

export type MissingVariableBehavior = "throw" | "empty" | "default";

export interface VariableResolutionConfig {
	onMissingVariable: MissingVariableBehavior;
	defaultValues?: Record<string, string>;
}

export interface VariableResult {
	variable: string;
	value: string | null;
	status: "resolved" | "missing_value" | "no_strategy" | "error";
	error?: string;
}
