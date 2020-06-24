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
        id: AppSetting.FallbackThreshold,
        public: true,
        type: SettingType.NUMBER,
        packageValue: 3,
        value: 3,
        i18nLabel: 'fallback_threshold_limit_for_handover',
        i18nDescription: 'fallback_threshold_limit_for_handover_description',
        required: true,
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
];
