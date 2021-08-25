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
import { ILivechatMessage } from '@rocket.chat/apps-engine/definition/livechat';
import { IPostMessageSent } from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { IUIKitInteractionHandler, IUIKitLivechatInteractionHandler, IUIKitResponse, UIKitBlockInteractionContext, UIKitLivechatBlockInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { settings } from './config/Settings';
import { FulfillmentsEndpoint } from './endpoints/FulfillmentsEndpoint';
import { IncomingEndpoint } from './endpoints/IncomingEndpoint';
import { ExecuteBlockActionHandler } from './handler/ExecuteBlockActionHandler';
import { ExecuteLivechatBlockActionHandler } from './handler/ExecuteLivechatBlockActionHandler';
import { OnSettingUpdatedHandler } from './handler/OnSettingUpdatedHandler';
import { PostMessageSentHandler } from './handler/PostMessageSentHandler';

export class DialogflowApp extends App implements IPostMessageSent, IUIKitLivechatInteractionHandler, IUIKitInteractionHandler {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async executeLivechatBlockActionHandler(context: UIKitLivechatBlockInteractionContext,
                                                   read: IRead,
                                                   http: IHttp,
                                                   persistence: IPersistence,
                                                   modify: IModify): Promise<IUIKitResponse> {
        const handler = new ExecuteLivechatBlockActionHandler(this, context, read, http, persistence, modify);
        return await handler.run();
    }

    public async executeBlockActionHandler(context: UIKitBlockInteractionContext,
                                           read: IRead,
                                           http: IHttp,
                                           persistence: IPersistence,
                                           modify: IModify): Promise<IUIKitResponse> {
        const handler = new ExecuteBlockActionHandler(this, context, read, http, persistence, modify);
        return await handler.run();
    }

    public async executePostMessageSent(message: ILivechatMessage,
                                        read: IRead,
                                        http: IHttp,
                                        persis: IPersistence,
                                        modify: IModify): Promise<void> {
        const handler = new PostMessageSentHandler(this, message, read, http, persis, modify);
        await handler.run();
    }

    public async onSettingUpdated(setting: ISetting, configurationModify: IConfigurationModify, read: IRead, http: IHttp): Promise<void> {
        const onSettingUpdatedHandler: OnSettingUpdatedHandler = new OnSettingUpdatedHandler(this, read, http);
        await onSettingUpdatedHandler.run();
    }

    protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        configuration.api.provideApi({
            visibility: ApiVisibility.PUBLIC,
            security: ApiSecurity.UNSECURE,
            endpoints: [
                new IncomingEndpoint(this),
                new FulfillmentsEndpoint(this),
            ],
        });
        await Promise.all(settings.map((setting) => configuration.settings.provideSetting(setting)));
    }
}
