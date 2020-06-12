import { ISetting, SettingType} from '@rocket.chat/apps-engine/definition/settings';

export enum AppSettingId {
    DialogflowBotUsername = 'dialogflow_bot_username',
    DialogflowProjectId = 'dialogflow_project_id',
    DialogflowClientEmail = 'dialogflow_client_email',
    DialogFlowPrivateKey = 'dialogflow_private_key',
}

export const AppSettings: Array<ISetting> = [
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
];
