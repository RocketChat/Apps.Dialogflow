import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IDialogflowResponse } from '../definition/IDialogflowResponse';
import { getAppSetting, getBotUser, getSessionId } from '../helper';
import { DialogflowSDK } from '../lib/Dialogflow/DialogflowSDK';
import { SynchronousHandover } from '../lib/SynchronousHandover';
import { AppSetting } from '../Settings';

export class PostMessageSentHandler {
    constructor(private app: IApp,
                private message: IMessage,
                private read: IRead,
                private http: IHttp,
                private persis: IPersistence,
                private modify: IModify) {}

    public async run() {
        const SettingBotUsername: string = await getAppSetting(this.read, AppSetting.DialogflowBotUsername);
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

        const dialogflowSDK: DialogflowSDK  = new DialogflowSDK(this.http, this.read, this.persis, sessionId, messageText);
        const response: IDialogflowResponse = await dialogflowSDK.sendMessage();

        // forward the recieved message to Visitor
        await this.sendMessageToVisitor(response.message);

        // synchronous handover check
        const syncHandover: SynchronousHandover = new SynchronousHandover(this.read, this.persis, this.modify);
        if (response.isFallback) {
            await syncHandover.processFallbackIntent(sessionId);
        } else {
            await syncHandover.resetFallbackIntentCounter(sessionId);
        }
    }

    private async sendMessageToVisitor(message: string) {
        const sender: IUser = getBotUser(this.message);

        // build the message for Livechat widget
        const builder = this.modify.getNotifier().getMessageBuilder();
        builder.setRoom(this.message.room).setText(message).setSender(sender);
        await this.modify.getCreator().finish(builder);
    }

}
