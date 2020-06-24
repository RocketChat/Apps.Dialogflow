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
import { ApiSecurity, ApiVisibility } from '@rocket.chat/apps-engine/definition/api';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { ILivechatEventContext, IPostLivechatAgentAssigned } from '@rocket.chat/apps-engine/definition/livechat';
import { IMessage, IPostMessageSent } from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { CloseChat } from './endpoints/CloseChat';
import { PerformHandover } from './endpoints/PerformHandover';
import { OnSettingUpdatedHandler } from './handler/OnSettingUpdatedHandler';
import { PostLivechatAgentAssignedHandler } from './handler/PostLivechatAgentAssignedHandler';
import { PostMessageSentHandler } from './handler/PostMessageSentHandler';
import { settings } from './Settings';

export class DialogflowApp extends App implements IPostMessageSent, IPostLivechatAgentAssigned {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async initialize(configurationExtend: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
        settings.forEach((setting) => configurationExtend.settings.provideSetting(setting));
        configurationExtend.api.provideApi({
            visibility: ApiVisibility.PUBLIC,
            security: ApiSecurity.UNSECURE,
            endpoints: [
                new CloseChat(this),
                new PerformHandover(this),
            ],
        });
        this.getLogger().log('Apps.Dialogflow App Initialized');
    }

    public async executePostMessageSent(message: IMessage,
                                        read: IRead,
                                        http: IHttp,
                                        persis: IPersistence,
                                        modify: IModify): Promise<void> {
        const handler = new PostMessageSentHandler(this, message, read, http, persis, modify);
        try {
            await handler.run();
        } catch (error) {
            this.getLogger().error(error.message);
        }
    }

    public async onSettingUpdated(setting: ISetting, configurationModify: IConfigurationModify, read: IRead, http: IHttp): Promise<void> {
        const onSettingUpdatedHandler: OnSettingUpdatedHandler = new OnSettingUpdatedHandler(this, read, http);
        await onSettingUpdatedHandler.run();
    }

    public async executePostLivechatAgentAssigned(context: ILivechatEventContext, read: IRead, http: IHttp, persistence: IPersistence): Promise<void> {
        const postLivechatAgentAssignedHandler = new PostLivechatAgentAssignedHandler(context, read, http, persistence);
        await postLivechatAgentAssignedHandler.run();
    }
}
