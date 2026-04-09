import type { OAuthCredential } from "@oh-my-pi/pi-ai/auth-storage";
import { loginGitHubCopilot } from "@oh-my-pi/pi-ai/utils/oauth/github-copilot";
import type { OAuthPrompt } from "@oh-my-pi/pi-ai/utils/oauth/types";
import type {
	ExtensionCommandContext,
	ExtensionContext,
} from "@oh-my-pi/pi-coding-agent/extensibility/extensions/types";
import {
	COPILOT_PROVIDER_ID,
	LOGIN_STATUS_KEY,
	LOGIN_WIDGET_KEY,
	OPENCODE_PLUGIN_NAME,
} from "./constants";
import { createGitHubCopilotProviderConfig } from "./provider";

type LoginContext = Pick<ExtensionContext, "hasUI" | "modelRegistry" | "ui">;

function buildLoginWidgetLines(url: string, instructions?: string): string[] {
	const lines = [
		`${OPENCODE_PLUGIN_NAME}`,
		"",
		`Open: ${url}`,
	];

	if (instructions) {
		lines.push(instructions);
	}

	lines.push("", "Keep this session open while GitHub finishes the device authorization.");
	return lines;
}

async function resolvePromptValue(
	ctx: LoginContext,
	prompt: OAuthPrompt,
	presetDomain: string | undefined,
	usedPreset: { value: boolean },
): Promise<string> {
	if (!usedPreset.value && presetDomain !== undefined) {
		usedPreset.value = true;
		return presetDomain;
	}

	const value = await ctx.ui.input(prompt.message, prompt.placeholder);
	if (value === undefined) {
		throw new Error("Login cancelled");
	}
	if (!prompt.allowEmpty && value.trim().length === 0) {
		throw new Error("Login cancelled");
	}
	return value;
}

export async function runGitHubCopilotLogin(ctx: LoginContext, rawArgs: string): Promise<void> {
	if (!ctx.hasUI) {
		throw new Error("GitHub Copilot OpenCode OAuth login requires interactive mode.");
	}

	const existingCredential = ctx.modelRegistry.authStorage.getOAuthCredential(COPILOT_PROVIDER_ID);
	if (existingCredential) {
		const confirmed = await ctx.ui.confirm(
			"Replace GitHub Copilot login?",
			"This will overwrite the stored GitHub Copilot credential.",
		);
		if (!confirmed) {
			return;
		}
	}

	const trimmedArgs = rawArgs.trim();
	const presetDomain = trimmedArgs.length > 0 ? trimmedArgs : undefined;
	const usedPreset = { value: false };

	try {
		ctx.ui.setWorkingMessage("Authenticating GitHub Copilot...");
		ctx.ui.setStatus(LOGIN_STATUS_KEY, "Waiting for GitHub device authorization...");

		const credentials = await loginGitHubCopilot({
			onAuth: (url, instructions) => {
				ctx.ui.setWidget(LOGIN_WIDGET_KEY, buildLoginWidgetLines(url, instructions), {
					placement: "aboveEditor",
				});
				ctx.ui.notify("GitHub Copilot device login started.", "info");
			},
			onPrompt: (prompt: OAuthPrompt) => resolvePromptValue(ctx, prompt, presetDomain, usedPreset),
			onProgress: message => ctx.ui.setStatus(LOGIN_STATUS_KEY, message),
		});

		const credential: OAuthCredential = {
			type: "oauth",
			...credentials,
		};
		await ctx.modelRegistry.authStorage.set(COPILOT_PROVIDER_ID, credential);
		ctx.modelRegistry.registerProvider(COPILOT_PROVIDER_ID, createGitHubCopilotProviderConfig());
		ctx.ui.notify(
			"GitHub Copilot authenticated via OpenCode OAuth. Continue using github-copilot/<model> as usual.",
			"info",
		);
	} finally {
		ctx.ui.setWidget(LOGIN_WIDGET_KEY, undefined);
		ctx.ui.setStatus(LOGIN_STATUS_KEY, undefined);
		ctx.ui.setWorkingMessage();
	}
}

export async function runGitHubCopilotLogout(ctx: ExtensionCommandContext): Promise<void> {
	await ctx.modelRegistry.authStorage.remove(COPILOT_PROVIDER_ID);
	ctx.modelRegistry.registerProvider(COPILOT_PROVIDER_ID, createGitHubCopilotProviderConfig());
	ctx.ui.notify("Removed the stored GitHub Copilot credential.", "info");
}
