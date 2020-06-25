import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ILivechatMessage, ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { IMessageAction, IMessageAttachment, MessageActionType } from '@rocket.chat/apps-engine/definition/messages';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { AppSetting } from '../config/Settings';
import { IDialogflowMessage, IDialogflowQuickReply } from '../enum/Dialogflow';
import { Dialogflow } from '../lib/Dialogflow/Dialogflow';
import { createMessage } from '../lib/Message';
import { getAppSettingValue } from '../lib/Settings';
import { SynchronousHandover } from '../lib/SynchronousHandover';

export class PostMessageSentHandler {
    constructor(private readonly message: ILivechatMessage,
                private readonly read: IRead,
                private readonly http: IHttp,
                private readonly persis: IPersistence,
                private readonly modify: IModify) {}

    public async run() {
        const { text, editedAt, room, token, sender } = this.message;
        const livechatRoom = room as ILivechatRoom;

        const { id: rid, type, servedBy, isOpen } = livechatRoom;

        const DialogflowBotUsername: string = await getAppSettingValue(this.read, AppSetting.DialogflowBotUsername);

        if (!type || type !== RoomType.LIVE_CHAT) {
            return;
        }

        if (!isOpen || !token || editedAt || !text) {
            return;
        }

        if (!servedBy || servedBy.username !== DialogflowBotUsername) {
            return;
        }

        if (sender.username === DialogflowBotUsername) {
            return;
        }

        if (!text || (text && text.trim().length === 0)) {
            return;
        }

        // session Id will be the same as Room_Id
        const sessionId: string = rid;

        const response: IDialogflowMessage = await Dialogflow.sendMessage(this.http, this.read, this.persis, sessionId, text);

        const responseMessage: { text: string, attachment?: Array<IMessageAttachment> } = {
            text: response.message,
        };
        if (response.quickReplies) {
            const { quickReplies } = response;

            const attachment: Array<IMessageAttachment> = [];
            quickReplies.forEach((quickReply: IDialogflowQuickReply) => {
                const action: IMessageAction = {
                    type: MessageActionType.BUTTON,
                    text: quickReply.payload,
                    msg: quickReply.payload,
                    msg_in_chat_window: true,
                };
                attachment.push(action);
            });

            responseMessage.attachment = attachment;
        }

        await createMessage(rid, this.read, this.modify, responseMessage);

        // synchronous handover check
        if (response.isFallback) {
            await SynchronousHandover.processFallbackIntent(this.read, this.persis, this.modify, sessionId);
        } else {
            await SynchronousHandover.resetFallbackIntentCounter(this.read, this.persis, sessionId);
        }
    }
}
