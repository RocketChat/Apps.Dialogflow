import {
    IAppAccessors,
    IConfigurationExtend,
    IConfigurationModify,
    IEnvironmentRead,
    IHttp,
    IHttpRequest,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { ApiSecurity, ApiVisibility } from '@rocket.chat/apps-engine/definition/api';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { ILivechatMessage, ILivechatRoom, IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { IMessage, IPostMessageSent } from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { AppSettings } from './AppSettings';
import { DialogflowWrapper } from './DialogflowWrapper';
import { CloseChat } from './endpoints/CloseChat';
import { buildDialogflowHTTPRequest, getAppSetting } from './helper';
import { AppPersistence } from './lib/persistence';

export class AppsDialogflowApp extends App implements IPostMessageSent {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async initialize(configurationExtend: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
        await this.extendConfiguration(configurationExtend);
        configurationExtend.api.provideApi({
            visibility: ApiVisibility.PUBLIC,
            security: ApiSecurity.UNSECURE,
            endpoints: [
                new CloseChat(this),
            ],
        });
        this.getLogger().log('Apps.Dialogflow App Initialized');
    }

    public async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        AppSettings.forEach((setting) => configuration.settings.provideSetting(setting));
    }

    public async executePostMessageSent(message: IMessage,
                                        read: IRead,
                                        http: IHttp,
                                        persis: IPersistence,
                                        modify: IModify): Promise<void> {

        const SettingBotUsername: string = await getAppSetting(read, 'Lc-Bot-Username');
        if (message.sender.username === SettingBotUsername) {
            // this msg was sent by the Bot itself, so no need to respond back
            return;
        } else if (message.room.type !== RoomType.LIVE_CHAT) {
            // check whether this is a Livechat message
            return;
        }

        const lmessage: ILivechatMessage = message;
        const lroom: ILivechatRoom = lmessage.room as ILivechatRoom;
        const LcAgent: IUser = lroom.servedBy ? lroom.servedBy : message.sender;
        const visitor: IVisitor = lroom.visitor;

        // check whether the bot is currently handling the Visitor, if not then return back
        if (SettingBotUsername !== LcAgent.username) {
            return;
        }

        const clientEmail = await getAppSetting(read, 'Dialogflow-Client-Email');
        const privateKey = await getAppSetting(read, 'Dialogflow-Private-Key');
        const projectId = await getAppSetting(read, 'Dialogflow-Project-Id');
        const sessionId = visitor.token;
        this.saveVisitorSession(lroom, read, persis);

        const dialogflowWrapper: DialogflowWrapper = new DialogflowWrapper(clientEmail, privateKey);

        let accessToken;
        try {
            // get the access token
            accessToken =  await dialogflowWrapper.getAccessToken(http);
        } catch (error) {
            this.getLogger().error('Error getting Access Token', error);
            return;
        }

        const dfRequestUrl = `https://dialogflow.googleapis.com/v2/projects/${projectId}/agent/environments/draft/users/-/sessions/${sessionId}:detectIntent?access_token=${accessToken}`;

        const httpRequestContent: IHttpRequest = buildDialogflowHTTPRequest(message.text);

        try {
            const response = await http.post(dfRequestUrl, httpRequestContent);
            const responseJSON = JSON.parse((response.content || '{}'));

            if (responseJSON.queryResult) {
                const BotResponse = responseJSON.queryResult.fulfillmentText;

                // build the message for LC widget
                const builder = modify.getNotifier().getMessageBuilder();
                builder.setRoom(message.room).setText(BotResponse).setSender(LcAgent);
                await modify.getCreator().finish(builder);
            } else {
                // some error occured
                throw Error(`An Error occured while connecting to Dialogflows REST API\
                Error Details:-
                    message:- ${responseJSON.error.message}\
                    status:- ${responseJSON.error.message}\
                Try rechecking the google credentials and your internet connection`);
            }
        } catch (error) {
            this.getLogger().error(error.message);
        }
    }

    public async onSettingUpdated(setting: ISetting, configurationModify: IConfigurationModify, read: IRead, http: IHttp): Promise<void> {
        const clientEmail: string = await getAppSetting(read, 'Dialogflow-Client-Email');
        const privateKey: string = await getAppSetting(read, 'Dialogflow-Private-Key');

        if (clientEmail.length === 0 || privateKey.length === 0) {
            this.getLogger().error('Client Email or Private Key Field cannot be empty');
            return;
        }

        const dialogflowWrapper: DialogflowWrapper = new DialogflowWrapper(clientEmail, privateKey);

        try {
            // get the access token
            const accessToken =  await dialogflowWrapper.getAccessToken(http);
            this.getLogger().info('------------------ Google Credentials validation Success ----------------');
        } catch (error) {
            this.getLogger().error(error.message);
        }
    }

    /**
     *
     * @description - save visitor.token and room id.
     *   - This will provide a mapping between visitor.token n room id.
     *   - This is required for implementing webhooks since all webhook endpoints require `sessionId`
     *     which is the same as visitor.token. Using the `sessionId` we will be able to get the roomId
     */
    private async saveVisitorSession(room: ILivechatRoom, read: IRead, persis: IPersistence) {
        // Connect Room id with Visitor Token (Session Id for Dialogflow)
        const persistence = new AppPersistence(persis, read.getPersistenceReader());

        const lroom: ILivechatRoom = room as ILivechatRoom;
        const visitor: IVisitor = lroom.visitor;
        console.log('------- Session Id in Main ---------', visitor.token);
        await persistence.connectVisitorSessionToRoom(lroom.id, visitor.token);
    }
}
