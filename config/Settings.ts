import {
	ISetting,
	SettingType,
} from '@rocket.chat/apps-engine/definition/settings';

export enum AppSetting {
	DialogflowBotUsername = 'dialogflow_bot_username',
	DialogflowProjectId = 'dialogflow_project_id',
	DialogflowClientEmail = 'dialogflow_client_email',
	DialogFlowPrivateKey = 'dialogflow_private_key',
	DialogflowFallbackResponsesLimit = 'dialogflow_fallback_responses_limit',
	FallbackTargetDepartment = 'fallback_target_department',
	DialogflowHandoverMessage = 'dialogflow_handover_message',
	DialogflowServiceUnavailableMessage = 'dialogflow_service_unavailable_message',
	DialogflowHandoverFailedMessage = 'dialogflow_no_agents_online_for_handover',
	DialogflowCloseChatMessage = 'dialogflow_close_chat_message',
	DialogflowHideQuickReplies = 'dialogflow_hide_quick_replies',
}

export enum ServerSetting {
	SITE_URL = 'Site_Url',
}

export enum DefaultMessage {
	DEFAULT_DialogflowServiceUnavailableMessage = "Sorry, I'm having trouble answering your question.",
	DEFAULT_DialogflowRequestFailedMessage = 'Sorry, something went wrong.',
	DEFAULT_DialogflowHandoverMessage = 'Transferring to an online agent',
	DEFAULT_DialogflowCloseChatMessage = 'Closing the chat, Goodbye',
}

export const settings: Array<ISetting> = [
	{
		id: AppSetting.DialogflowBotUsername,
		public: true,
		type: SettingType.STRING,
		packageValue: '',
		i18nLabel: 'bot_username',
		required: true,
	},
	{
		id: AppSetting.DialogflowProjectId,
		public: true,
		type: SettingType.STRING,
		packageValue: '',
		i18nLabel: 'dialogflow_project_id',
		required: true,
	},
	{
		id: AppSetting.DialogflowClientEmail,
		public: true,
		type: SettingType.STRING,
		packageValue: '',
		i18nLabel: 'dialogflow_client_email',
		required: true,
	},
	{
		id: AppSetting.DialogFlowPrivateKey,
		public: true,
		type: SettingType.STRING,
		packageValue: '',
		i18nLabel: 'dialogflow_private_key',
		required: true,
	},
	{
		id: AppSetting.DialogflowFallbackResponsesLimit,
		public: true,
		type: SettingType.NUMBER,
		packageValue: 0,
		value: 0,
		i18nLabel: 'dialogflow_fallback_responses_limit',
		i18nDescription: 'dialogflow_fallback_responses_limit_description',
		required: false,
	},
	{
		id: AppSetting.FallbackTargetDepartment,
		public: true,
		type: SettingType.STRING,
		packageValue: '',
		i18nLabel: 'target_department_for_handover',
		i18nDescription: 'target_department_for_handover_description',
		required: false,
	},
	{
		id: AppSetting.DialogflowHandoverMessage,
		public: true,
		type: SettingType.STRING,
		packageValue: '',
		i18nLabel: 'dialogflow_handover_message',
		i18nDescription: 'dialogflow_handover_message_description',
		required: false,
	},
	{
		id: AppSetting.DialogflowHandoverFailedMessage,
		public: true,
		type: SettingType.STRING,
		packageValue: '',
		i18nLabel: 'dialogflow_handover_failed_message',
		i18nDescription: 'dialogflow_handover_failed_message_description',
		required: false,
	},
	{
		id: AppSetting.DialogflowServiceUnavailableMessage,
		public: true,
		type: SettingType.STRING,
		packageValue: '',
		i18nLabel: 'dialogflow_service_unavailable_message',
		i18nDescription: 'dialogflow_service_unavailable_message_description',
		required: false,
	},
	{
		id: AppSetting.DialogflowCloseChatMessage,
		public: true,
		type: SettingType.STRING,
		packageValue: '',
		i18nLabel: 'dialogflow_close_chat_message',
		i18nDescription: 'dialogflow_close_chat_message_description',
		required: false,
	},
	{
		id: AppSetting.DialogflowHideQuickReplies,
		public: true,
		type: SettingType.BOOLEAN,
		packageValue: true,
		value: true,
		i18nLabel: 'dialogflow_hide_quick_replies',
		i18nDescription: 'dialogflow_hide_quick_replies_description',
		required: true,
	},
];
