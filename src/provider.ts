import {
	getGitHubCopilotBaseUrl,
	loginGitHubCopilot,
	refreshGitHubCopilotToken,
} from "@oh-my-pi/pi-ai/utils/oauth/github-copilot";
import type { Api, Model } from "@oh-my-pi/pi-ai/types";
import type { OAuthCredentials, OAuthPrompt } from "@oh-my-pi/pi-ai/utils/oauth/types";
import type { ProviderConfig } from "@oh-my-pi/pi-coding-agent/extensibility/extensions/types";
import { COPILOT_PLUGIN_API, OPENCODE_PLUGIN_NAME } from "./constants";
import { createGitHubCopilotModels } from "./models";
import { streamGitHubCopilotOverride } from "./stream";

export function serializeGitHubCopilotCredentials(credentials: OAuthCredentials): string {
	return JSON.stringify({
		token: credentials.access,
		enterpriseUrl: credentials.enterpriseUrl,
		refreshToken: credentials.refresh,
		expiresAt: credentials.expires,
		email: credentials.email,
		accountId: credentials.accountId,
	});
}

export function applyGitHubCopilotEnterpriseBaseUrl(models: Model<Api>[], enterpriseUrl?: string): Model<Api>[] {
	const baseUrl = getGitHubCopilotBaseUrl(enterpriseUrl);
	return models.map(model => ({
		...model,
		baseUrl,
	}));
}

export function createGitHubCopilotProviderConfig(): ProviderConfig {
	return {
		baseUrl: getGitHubCopilotBaseUrl(),
		api: COPILOT_PLUGIN_API,
		streamSimple: streamGitHubCopilotOverride,
		models: createGitHubCopilotModels(),
		oauth: {
			name: OPENCODE_PLUGIN_NAME,
			login(callbacks) {
				return loginGitHubCopilot({
					onAuth: (url, instructions) => callbacks.onAuth({ url, instructions }),
					onPrompt: (prompt: OAuthPrompt) => callbacks.onPrompt(prompt),
					onProgress: callbacks.onProgress,
					signal: callbacks.signal,
				});
			},
			refreshToken(credentials) {
				return Promise.resolve(refreshGitHubCopilotToken(credentials.refresh, credentials.enterpriseUrl));
			},
			getApiKey(credentials) {
				return serializeGitHubCopilotCredentials(credentials);
			},
			modifyModels(models, credentials) {
				return applyGitHubCopilotEnterpriseBaseUrl(models, credentials.enterpriseUrl);
			},
		},
	};
}
