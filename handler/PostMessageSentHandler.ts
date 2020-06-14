import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { AppSettingId } from '../AppSettings';
import { getAppSetting, getBotUser, getSessionId } from '../helper';
import { DialogflowSDK } from '../lib/Dialogflow/DialogflowSDK';

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
        } else if (SettingBotUsername !== getBotUser(this.message).username) {
            // check whether the bot is currently handling the Visitor, if not then return back
            return;
        }

        // send request to dialogflow
        if (!this.message.text || (this.message.text && this.message.text.trim().length === 0)) { return; }
        const messageText: string = this.message.text;

        const sessionId: string = getSessionId(this.message);
        console.log('------- Session Id in Main ---------', sessionId);

        const dialogflowSDK: DialogflowSDK  = new DialogflowSDK(this.http, this.read, sessionId, messageText);
        const response = await dialogflowSDK.sendMessage();

        // forward the recieved message to Visitor
        await this.sendMessageToVisitor(response);
    }

    private async sendMessageToVisitor(message: string) {
        const sender: IUser = getBotUser(this.message);

        // build the message for Livechat widget
        const builder = this.modify.getNotifier().getMessageBuilder();
        builder.setRoom(this.message.room).setText(message).setSender(sender);
        await this.modify.getCreator().finish(builder);
    }
}
