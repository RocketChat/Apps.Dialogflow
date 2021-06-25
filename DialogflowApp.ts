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
import { ILivechatEventContext, ILivechatMessage, ILivechatRoom, IPostLivechatAgentAssigned, IPostLivechatAgentUnassigned, IPostLivechatRoomClosed } from '@rocket.chat/apps-engine/definition/livechat';
import { IPostMessageSent } from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { IUIKitLivechatInteractionHandler, IUIKitResponse, UIKitLivechatBlockInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { settings } from './config/Settings';
import { FulfillmentsEndpoint } from './endpoints/FulfillmentsEndpoint';
import { IncomingEndpoint } from './endpoints/IncomingEndpoint';
import { ExecuteLivechatBlockActionHandler } from './handler/ExecuteLivechatBlockActionHandler';
import { LivechatRoomClosedHandler } from './handler/LivechatRoomClosedHandler';
import { OnAgentAssignedHandler } from './handler/OnAgentAssignedHandler';
import { OnAgentUnassignedHandler } from './handler/OnAgentUnassignedHandler';
import { OnSettingUpdatedHandler } from './handler/OnSettingUpdatedHandler';
import { PostMessageSentHandler } from './handler/PostMessageSentHandler';
import { EventScheduler } from './lib/EventTimeoutProcessor';
import { SessionMaintenanceProcessor } from './lib/sessionMaintenance/SessionMaintenanceProcessor';

export class DialogflowApp extends App implements IPostMessageSent, IPostLivechatAgentAssigned, IPostLivechatAgentUnassigned, IPostLivechatRoomClosed, IUIKitLivechatInteractionHandler {
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

    public async executePostMessageSent(message: ILivechatMessage,
                                        read: IRead,
                                        http: IHttp,
                                        persis: IPersistence,
                                        modify: IModify): Promise<void> {
        const handler = new PostMessageSentHandler(this, message, read, http, persis, modify);
        await handler.run();
    }

    public async executePostLivechatAgentUnassigned(context: ILivechatEventContext,
                                                    read: IRead,
                                                    http: IHttp,
                                                    persis: IPersistence,
                                                    modify: IModify): Promise<void> {
        const handler = new OnAgentUnassignedHandler(this, context, read, http, persis, modify);
        await handler.run();
    }

    public async executePostLivechatAgentAssigned(context: ILivechatEventContext,
                                                  read: IRead,
                                                  http: IHttp,
                                                  persis: IPersistence,
                                                  modify: IModify): Promise<void> {
        const handler = new OnAgentAssignedHandler(this, context, read, http, persis, modify);
        await handler.run();
    }

    public async executePostLivechatRoomClosed(room: ILivechatRoom, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void> {
        const livechatRoomClosedHandler = new LivechatRoomClosedHandler(this, room, read, http, persistence, modify);
        await livechatRoomClosedHandler.exec();
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

        await configuration.scheduler.registerProcessors([
                                                            new SessionMaintenanceProcessor('session-maintenance'),
                                                            new EventScheduler('event-scheduler'),
                                                        ]);

        await Promise.all(settings.map((setting) => configuration.settings.provideSetting(setting)));
    }
}
