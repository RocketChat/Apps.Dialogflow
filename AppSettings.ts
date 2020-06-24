import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';

export enum AppSetting {
    DialogflowBotUsername = 'dialogflow_bot_username',
    DialogflowProjectId = 'dialogflow_project_id',
    DialogflowClientEmail = 'dialogflow_client_email',
    DialogFlowPrivateKey = 'dialogflow_private_key',
    FallbackThreshold = 'fallback_responses_limit',
    FallbackTargetDepartment = 'fallback_target_department',
}

export const settings: Array<ISetting> = [
    {
        id: AppSettingId.DialogflowBotUsername,
        public: true,
        type: SettingType.STRING,
        packageValue: '',
        i18nLabel: 'Bot Username',
        required: true,
    },
    {
        id: AppSettingId.DialogflowProjectId,
        public: true,
        type: SettingType.STRING,
        packageValue: '',
        i18nLabel: 'Dialogflow Project Id',
        required: true,
    },
    {
        id: AppSettingId.DialogflowClientEmail,
        public: true,
        type: SettingType.STRING,
        packageValue: '',
        i18nLabel: 'Dialogflow Client Email',
        required: true,
    },
    {
        id: AppSettingId.DialogFlowPrivateKey,
        public: true,
        type: SettingType.STRING,
        packageValue: '',
        i18nLabel: 'Dialogflow Private Key',
        required: true,
    },
    {
        id: AppSettingId.FallbackThreshold,
        public: true,
        type: SettingType.NUMBER,
        packageValue: 3,
        value: 3,
        i18nLabel: 'Fallback threshold for handover',
        i18nDescription: 'The app will automatically trigger handover, if consecutive `fallback` intents are triggerred `N` no of times. This setting defines this value `N`',
        required: true,
    },
    {
        id: AppSettingId.FallbackTargetDepartment,
        public: true,
        type: SettingType.STRING,
        packageValue: '',
        i18nLabel: 'Target Department for Handover',
        i18nDescription: 'Upon bot-to-liveagent handover, the visitor will be transferred to this Department',
        required: false,
    },
];
