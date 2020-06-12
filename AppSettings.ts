import { ISetting, SettingType} from '@rocket.chat/apps-engine/definition/settings';

export const AppSettings: Array<ISetting> = [
    {
        id: 'Lc-Bot-Username',
        public: true,
        type: SettingType.STRING,
        packageValue: '',
        i18nLabel: 'Livechat Bot Username',
        required: true,
    },
    {
        id: 'Rocket-Chat-Server-URL',
        public: true,
        type: SettingType.STRING,
        packageValue: '',
        i18nLabel: 'Rocket Chat Server URL',
        i18nDescription: 'You can find this at `Setting -> General -> Site URL`. Please note, Do not include a backslash at the end of url',
        required: true,
    },
    {
        id: 'Dialogflow-Project-Id',
        public: true,
        type: SettingType.STRING,
        packageValue: '',
        i18nLabel: 'Dialogflow Project Id',
        required: true,
    },
    {
        id: 'Dialogflow-Client-Email',
        public: true,
        type: SettingType.STRING,
        packageValue: '',
        i18nLabel: 'Dialogflow Client Email',
        required: true,
    },
    {
        id: 'Dialogflow-Private-Key',
        public: true,
        type: SettingType.STRING,
        packageValue: '',
        i18nLabel: 'Dialogflow Private Key',
        required: true,
    },
];
