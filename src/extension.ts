import type {
	ExtensionAPI,
	ExtensionContext,
} from "@oh-my-pi/pi-coding-agent/extensibility/extensions/types";
import {
	COPILOT_PROVIDER_ID,
	LOGIN_COMMAND,
	LOGOUT_COMMAND,
	OPENCODE_PLUGIN_NAME,
} from "./constants";
import { runGitHubCopilotLogin, runGitHubCopilotLogout } from "./login";
import { createGitHubCopilotProviderConfig } from "./provider";

export default function registerGitHubCopilotOpenCodePlugin(pi: ExtensionAPI): void {
	pi.registerProvider(COPILOT_PROVIDER_ID, createGitHubCopilotProviderConfig());

	pi.registerCommand(LOGIN_COMMAND, {
		description: "Authenticate GitHub Copilot with the OpenCode OAuth app",
		handler: async (args, ctx) => {
			await runGitHubCopilotLogin(ctx, args);
		},
	});

	pi.registerCommand(LOGOUT_COMMAND, {
		description: "Remove the stored GitHub Copilot credential installed by the OpenCode OAuth plugin",
		handler: async (_args, ctx) => {
			await runGitHubCopilotLogout(ctx);
		},
	});

	pi.on("session_start", (_event, ctx) => {
		const credential = ctx.modelRegistry.authStorage.getOAuthCredential(COPILOT_PROVIDER_ID);
		if (!credential) {
			return;
		}
		if (credential.access === credential.refresh) {
			return;
		}
		ctx.ui.notify(
			`${OPENCODE_PLUGIN_NAME} detected a legacy GitHub Copilot credential. Re-run /${LOGIN_COMMAND} once.`,
			"warning",
		);
	});
}
