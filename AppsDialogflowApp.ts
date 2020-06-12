import {
    IAppAccessors,
    IConfigurationExtend,
    IConfigurationModify,
    IEnvironmentRead,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IMessage, IPostMessageSent } from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { AppSettingId, AppSettings } from './AppSettings';
import { DialogflowWrapper } from './DialogflowWrapper';
import { PostMessageSentHandler } from './handler/PostMessageSentHandler';
import { getAppSetting } from './helper';

export class AppsDialogflowApp extends App implements IPostMessageSent {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async initialize(configurationExtend: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
        await this.extendConfiguration(configurationExtend);
        this.getLogger().log('Apps.Dialogflow App Initialized');
    }

    public async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        AppSettings.forEach((setting) => configuration.settings.provideSetting(setting));
    }

    public async executePostMessageSent(message: IMessage,
                                        read: IRead,
                                        http: IHttp,
                                        persistence: IPersistence,
                                        modify: IModify): Promise<void> {
        const handler = new PostMessageSentHandler(this, message, read, http, persistence, modify);
        await handler.run();

    }

    public async onSettingUpdated(setting: ISetting, configurationModify: IConfigurationModify, read: IRead, http: IHttp): Promise<void> {
        const clientEmail: string = await getAppSetting(read, AppSettingId.DialogflowClientEmail);
        const privateKey: string = await getAppSetting(read, AppSettingId.DialogFlowPrivateKey);

        if (clientEmail.length === 0 || privateKey.length === 0) {
            this.getLogger().error('Client Email or Private Key Field cannot be empty');
            return;
        }

        const dialogflowWrapper: DialogflowWrapper = new DialogflowWrapper(clientEmail, privateKey);

        try {
            this.getLogger().info('------------------ Google Credentials validation Success ----------------');
        } catch (error) {
            this.getLogger().error(error.message);
        }
    }
}
