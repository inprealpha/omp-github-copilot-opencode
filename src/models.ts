import { getBundledModels } from "@oh-my-pi/pi-ai/models";
import type { Api, Model } from "@oh-my-pi/pi-ai/types";
import type { ProviderModelConfig } from "@oh-my-pi/pi-coding-agent/extensibility/extensions/types";
import { COPILOT_PROVIDER_ID } from "./constants";

const bundledCopilotModels = getBundledModels(COPILOT_PROVIDER_ID);
const bundledCopilotModelMap = new Map(bundledCopilotModels.map(model => [model.id, model]));

export function createGitHubCopilotModels(): ProviderModelConfig[] {
	return bundledCopilotModels.map(model => ({
		id: model.id,
		name: model.name,
		reasoning: model.reasoning,
		thinking: model.thinking,
		input: model.input,
		cost: model.cost,
		premiumMultiplier: model.premiumMultiplier,
		contextWindow: model.contextWindow,
		maxTokens: model.maxTokens,
		headers: model.headers,
		compat: model.compat,
		contextPromotionTarget: model.contextPromotionTarget,
	}));
}

export function getUpstreamGitHubCopilotModel(modelId: string): Model<Api> {
	const model = bundledCopilotModelMap.get(modelId);
	if (!model) {
		throw new Error(`Unknown GitHub Copilot model: ${modelId}`);
	}
	return model;
}
