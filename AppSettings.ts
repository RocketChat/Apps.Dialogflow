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
];
