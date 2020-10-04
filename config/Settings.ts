import {
	ISetting,
	SettingType,
} from '@rocket.chat/apps-engine/definition/settings';

export enum AppSetting {
	DialogflowBotUsername = 'dialogflow_bot_username',
	DialogflowProjectId = 'dialogflow_project_id',
	DialogflowEnvironment = 'dialogflow_environment',
	DialogflowClientEmail = 'dialogflow_client_email',
	DialogFlowPrivateKey = 'dialogflow_private_key',
	DialogflowFallbackResponsesLimit = 'dialogflow_fallback_responses_limit',
	FallbackTargetDepartment = 'fallback_target_department',
	DialogflowHandoverMessage = 'dialogflow_handover_message',
	DialogflowServiceUnavailableMessage = 'dialogflow_service_unavailable_message',
	DialogflowHandoverFailedMessage = 'dialogflow_no_agents_online_for_handover',
	DialogflowCloseChatMessage = 'dialogflow_close_chat_message',
	DialogflowHideQuickReplies = 'dialogflow_hide_quick_replies',
    DialogflowLanguage = 'dialogflow_language',
}

export enum ServerSetting {
	SITE_URL = 'Site_Url',
}

export enum DefaultMessage {
	DEFAULT_DialogflowServiceUnavailableMessage = `Sorry, I'm having trouble answering your question.`,
	DEFAULT_DialogflowRequestFailedMessage = 'Sorry, something went wrong.',
	DEFAULT_DialogflowHandoverMessage = 'Transferring to an online agent',
	DEFAULT_DialogflowCloseChatMessage = 'Closing the chat, Goodbye',
}

export const LanguageCode = [
    { key: 'zh-CN', i18nLabel: 'chinese_simplified' },
    { key: 'da', i18nLabel: 'danish' },
    { key: 'nl', i18nLabel: 'dutch' },
    { key: 'en', i18nLabel: 'english' },
    { key: 'en-AU', i18nLabel: 'english_australia' },
    { key: 'en-CA', i18nLabel: 'english_canada' },
    { key: 'en-GB', i18nLabel: 'english_great_britain' },
    { key: 'en-IN', i18nLabel: 'english_india' },
    { key: 'en-US', i18nLabel: 'english_us' },
    { key: 'fr-CA', i18nLabel: 'french_canada' },
    { key: 'fr-FR', i18nLabel: 'french_france' },
    { key: 'de', i18nLabel: 'german' },
    { key: 'hi', i18nLabel: 'hindi' },
    { key: 'id', i18nLabel: 'indonesian' },
    { key: 'it', i18nLabel: 'italian' },
    { key: 'ja', i18nLabel: 'japanese' },
    { key: 'ko', i18nLabel: 'korean' },
    { key: 'no', i18nLabel: 'norwegian' },
    { key: 'pl', i18nLabel: 'polish' },
    { key: 'pt-BR', i18nLabel: 'portuguese-brazil' },
    { key: 'pt', i18nLabel: 'portuguese-portugal' },
    { key: 'ru', i18nLabel: 'russian' },
    { key: 'es', i18nLabel: 'spanish' },
    { key: 'es-ES', i18nLabel: 'spanish-spain' },
    { key: 'sv', i18nLabel: 'swedish' },
    { key: 'tr', i18nLabel: 'turkish' },
    { key: 'uk', i18nLabel: 'ukrainian' },
];

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
		id: AppSetting.DialogflowEnvironment,
		public: true,
		type: SettingType.STRING,
		packageValue: 'draft',
		i18nLabel: 'dialogflow_environment',
		i18nDescription: 'dialogflow_environment_description',
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
        id: AppSetting.DialogflowLanguage,
        public: true,
        type: SettingType.SELECT,
        values: LanguageCode,
        packageValue: 'en',
        value: 'en',
        i18nLabel: 'dialogflow_language',
        required: false,
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
		required: false,
	},
];
