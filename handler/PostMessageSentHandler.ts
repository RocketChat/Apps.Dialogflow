import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { ILivechatMessage, ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { AppSettingId } from '../AppSettings';
import { getAppSetting } from '../helper';
import { DialogflowSDK } from '../lib/Dialogflow/DialogflowSDK';
import { AppPersistence } from '../lib/persistence';

export class PostMessageSentHandler {
    constructor(private app: IApp,
                private message: IMessage,
                private read: IRead,
                private http: IHttp,
                private persis: IPersistence,
                private modify: IModify) {}

    public async run() {
        const SettingBotUsername: string = await getAppSetting(this.read, AppSettingId.DialogflowBotUsername);
        if (this.message.sender.username === SettingBotUsername) {
            // this msg was sent by the Bot itself, so no need to respond back
            return;
        } else if (this.message.room.type !== RoomType.LIVE_CHAT) {
            // check whether this is a Livechat message
            return;
        } else if (SettingBotUsername !== this.getBotUser().username) {
            // check whether the bot is currently handling the Visitor, if not then return back
            return;
        }

        // send request to dialogflow
        if (!this.message.text) { return; }
        const messageText: string = this.message.text;

        const sessionId: string = this.getSessionId();

        const dialogflowSDK: DialogflowSDK  = new DialogflowSDK(this.http, this.read, sessionId, messageText);
        const response = await dialogflowSDK.sendMessage();

        // forward the recieved message to Visitor
        await this.sendMessageToVisitor(response);

        // save session in persistant storage
        await this.saveVisitorSession();

    }

    private async sendMessageToVisitor(message: string) {
        const sender: IUser = this.getBotUser();

        // build the message for Livechat widget
        const builder = this.modify.getNotifier().getMessageBuilder();
        builder.setRoom(this.message.room).setText(message).setSender(sender);
        await this.modify.getCreator().finish(builder);
    }

    private getBotUser(): IUser {
        const lroom: ILivechatRoom = this.getLivechatRoom();
        if (!lroom.servedBy) { throw Error('Error!! Room.servedBy field is undefined'); }
        return lroom.servedBy;
    }

    private getLivechatRoom(): ILivechatRoom {
        return ((this.message as ILivechatMessage).room as ILivechatRoom);
    }

    /**
     * @description: Returns a session Id. Session Id is used to maintain sessions of Dialogflow.
     *      Note that the Session Id is the same as Room Id
     */
    private getSessionId(): string {
        return this.getLivechatRoom().id;
    }

    /**
     *
     * @description - save visitor.token and session id.
     *   - This will provide a mapping between visitor.token n session id.
     *   - This is required for implementing webhooks since all webhook endpoints require `sessionId`
     *     which is the same as room.id. Using the `sessionId` we will be able to get the visitor.token
     */
    private async saveVisitorSession() {
        const persistence = new AppPersistence(this.persis, this.read.getPersistenceReader());

        const sessionId = this.getSessionId();
        const visitorToken = this.getLivechatRoom().visitor.token;
        console.log('------- Session Id in Main ---------', sessionId);
        await persistence.connectSessionIdToVisitorToken(sessionId, visitorToken);
    }
}
