import {
	streamOpenAICompletions,
	type OpenAICompletionsOptions,
} from "@oh-my-pi/pi-ai/providers/openai-completions";
import type { Api, AssistantMessageEventStream, Context, Model, SimpleStreamOptions } from "@oh-my-pi/pi-ai/types";
import {
	streamOpenAIResponses as streamOpenAIResponsesProvider,
	type OpenAIResponsesOptions,
} from "@oh-my-pi/pi-ai/providers/openai-responses";
import { streamAnthropic as streamAnthropicProvider, type AnthropicOptions } from "@oh-my-pi/pi-ai/providers/anthropic";
import { COPILOT_PROVIDER_ID } from "./constants";
import { getUpstreamGitHubCopilotModel } from "./models";

export function streamGitHubCopilotOverride(
	model: Model<Api>,
	context: Context,
	options?: SimpleStreamOptions,
): AssistantMessageEventStream {
	const upstreamModel = getUpstreamGitHubCopilotModel(model.id);

	switch (upstreamModel.api) {
		case "anthropic-messages":
			return streamAnthropicProvider(
				{
					...upstreamModel,
					provider: COPILOT_PROVIDER_ID,
					baseUrl: model.baseUrl,
					headers: model.headers ?? upstreamModel.headers,
				} as Model<"anthropic-messages">,
				context,
				options as AnthropicOptions,
			);
		case "openai-completions":
			return streamOpenAICompletions(
				{
					...upstreamModel,
					provider: COPILOT_PROVIDER_ID,
					baseUrl: model.baseUrl,
					headers: model.headers ?? upstreamModel.headers,
				} as Model<"openai-completions">,
				context,
				options as OpenAICompletionsOptions,
			);
		case "openai-responses":
			return streamOpenAIResponsesProvider(
				{
					...upstreamModel,
					provider: COPILOT_PROVIDER_ID,
					baseUrl: model.baseUrl,
					headers: model.headers ?? upstreamModel.headers,
				} as Model<"openai-responses">,
				context,
				options as OpenAIResponsesOptions,
			);
		default:
			throw new Error(`Unsupported GitHub Copilot transport API: ${upstreamModel.api}`);
	}
}
