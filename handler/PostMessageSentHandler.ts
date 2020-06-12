import { IMessage } from '@rocket.chat/apps-engine/definition/messages';

import { IHttp, IHttpRequest, ILogger, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { ILivechatMessage, ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { AppSettingId } from '../AppSettings';
import { DialogflowWrapper } from '../DialogflowWrapper';
import { buildDialogflowHTTPRequest, getAppSetting } from '../helper';

export class PostMessageSentHandler {
    constructor(private app: IApp,
                private message: IMessage,
                private read: IRead,
                private http: IHttp,
                private persistence: IPersistence,
                private modify: IModify) {}

    public async run() {
        const SettingBotUsername: string = await getAppSetting(this.read, AppSettingId.DialogflowBotUsername);
        if (this.message.sender.username === SettingBotUsername) {
            // this msg was sent by the Bot itself, so no need to respond back
            return;
        } else if (this.message.room.type !== RoomType.LIVE_CHAT) {
            // check whether this is a Livechat message
            return;
        }

        const lmessage: ILivechatMessage = this.message;
        const lroom: ILivechatRoom = lmessage.room as ILivechatRoom;
        const LcAgent: IUser = lroom.servedBy ? lroom.servedBy : this.message.sender;

        // check whether the bot is currently handling the Visitor, if not then return back
        if (SettingBotUsername !== LcAgent.username) {
            return;
        }

        const clientEmail = await getAppSetting(this.read, AppSettingId.DialogflowClientEmail);
        const privateKey = await getAppSetting(this.read, AppSettingId.DialogFlowPrivateKey);
        const projectId = await getAppSetting(this.read, AppSettingId.DialogflowProjectId);
        const sessionId = 'test2';  // TODO: Handle session

        const dialogflowWrapper: DialogflowWrapper = new DialogflowWrapper(clientEmail, privateKey);

        let accessToken;
        try {
            // get the access token
            accessToken =  await dialogflowWrapper.getAccessToken(this.http);
        } catch (error) {
            this.app.getLogger().error('Error getting Access Token', error);
            return;
        }

        const dfRequestUrl = `https://dialogflow.googleapis.com/v2/projects/${projectId}/agent/environments/draft/users/-/sessions/${sessionId}:detectIntent?access_token=${accessToken}`;

        const httpRequestContent: IHttpRequest = buildDialogflowHTTPRequest(this.message.text);

        try {
            const response = await this.http.post(dfRequestUrl, httpRequestContent);
            const responseJSON = JSON.parse((response.content || '{}'));

            if (responseJSON.queryResult) {
                const BotResponse = responseJSON.queryResult.fulfillmentText;

                // build the message for LC widget
                const builder = this.modify.getNotifier().getMessageBuilder();
                builder.setRoom(this.message.room).setText(BotResponse).setSender(LcAgent);
                await this.modify.getCreator().finish(builder);
            } else {
                // some error occured
                throw Error(`An Error occured while connecting to Dialogflows REST API\
                Error Details:-
                    message:- ${responseJSON.error.message}\
                    status:- ${responseJSON.error.message}\
                Try rechecking the google credentials and your internet connection`);
            }
        } catch (error) {
            this.app.getLogger().error(error.message);
        }
    }
}
