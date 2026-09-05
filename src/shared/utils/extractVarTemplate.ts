export const extractVariables = (component: any) => {
	if (component.example?.body_text_named_params) {
		return component.example.body_text_named_params.map((param: any) => ({
			name: param.param_name,
			example: param.example,
		}));
	}

	if (component.example?.body_text?.[0]) {
		const exampleVars = new Set<string>();

		for (const line of component.example.body_text) {
			if (typeof line === "string") {
				for (const match of line.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)) {
					exampleVars.add(match[1].trim());
				}
			}
		}

		if (exampleVars.size > 0) {
			return [...exampleVars].map((name) => ({ name }));
		}

		return component.example.body_text[0].map((_: string, index: number) => ({
			name: String(index + 1),
		}));
	}

	const textSource =
		component.text || component.example?.body_text?.[0]?.join(" ");
	if (textSource) {
		const variables = new Set<string>();

		for (const match of textSource.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)) {
			variables.add(match[1].trim());
		}

		return [...variables].map((name) => ({ name }));
	}

	return [];
};
