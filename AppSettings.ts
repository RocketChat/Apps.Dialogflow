import { ISetting, SettingType} from '@rocket.chat/apps-engine/definition/settings';

export enum AppSettingId {
    DialogflowBotUsername = 'dialogflow_bot_username',
    DialogflowProjectId = 'dialogflow_project_id',
    DialogflowClientEmail = 'dialogflow_client_email',
    DialogFlowPrivateKey = 'dialogflow_private_key',
    RocketChatServerURL = 'rocketchat_server_url',
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
        id: AppSettingId.RocketChatServerURL,
        public: true,
        type: SettingType.STRING,
        packageValue: '',
        i18nLabel: 'Rocket Chat Server URL',
        i18nDescription: 'You can find this at `Setting -> General -> Site URL`. Please note, Do not include a backslash at the end of url',
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
