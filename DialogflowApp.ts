import {
    IAppAccessors,
    IConfigurationExtend,
    IConfigurationModify,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { ApiSecurity, ApiVisibility } from '@rocket.chat/apps-engine/definition/api';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { ILivechatEventContext, ILivechatMessage, IPostLivechatAgentAssigned } from '@rocket.chat/apps-engine/definition/livechat';
import { IPostMessageSent } from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { settings } from './config/Settings';
import { ActionsEndpoint } from './endpoints/ActionsEndpoint';
import { OnSettingUpdatedHandler } from './handler/OnSettingUpdatedHandler';
import { PostLivechatAgentAssignedHandler } from './handler/PostLivechatAgentAssignedHandler';
import { PostMessageSentHandler } from './handler/PostMessageSentHandler';

export class DialogflowApp extends App implements IPostMessageSent, IPostLivechatAgentAssigned {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async executePostMessageSent(message: ILivechatMessage,
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

    protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        configuration.api.provideApi({
            visibility: ApiVisibility.PUBLIC,
            security: ApiSecurity.UNSECURE,
            endpoints: [
                new ActionsEndpoint(this),
            ],
        });
        await Promise.all(settings.map((setting) => configuration.settings.provideSetting(setting)));
    }
}
