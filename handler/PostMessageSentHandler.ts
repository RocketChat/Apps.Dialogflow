import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { ILivechatMessage, ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { IMessageAction, IMessageAttachment, MessageActionType } from '@rocket.chat/apps-engine/definition/messages';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { AppSetting } from '../config/Settings';
import { IDialogflowMessage, IDialogflowQuickReply } from '../enum/Dialogflow';
import { Dialogflow } from '../lib/Dialogflow';
import { createMessage } from '../lib/Message';
import { RocketChat } from '../lib/RocketChat';
import { getAppSettingValue } from '../lib/Settings';
import { incFallbackIntent, resetFallbackIntent } from '../lib/SynchronousHandover';

export class PostMessageSentHandler {
    constructor(private readonly app: IApp,
                private readonly message: ILivechatMessage,
                private readonly read: IRead,
                private readonly http: IHttp,
                private readonly persis: IPersistence,
                private readonly modify: IModify) {}

    public async run() {
        const { text, editedAt, room, token, sender } = this.message;
        const livechatRoom = room as ILivechatRoom;

        const { id: rid, type, servedBy, isOpen, visitor } = livechatRoom;

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

        let response: IDialogflowMessage;
        try {
            response = (await Dialogflow.sendMessage(this.http, this.read, this.persis, rid, text));
        } catch (error) {
            this.app.getLogger().error(`Error occured while using Dialogflow Rest API. Details:- ${error.message}`);

            const handoverMessage: string = await getAppSettingValue(this.read, AppSetting.DialogflowHandoverMessage);

            await createMessage(rid, this.read, this.modify, { text: handoverMessage ? handoverMessage : '' });

            // transfer to a live agent
            await RocketChat.performHandover(this.modify, this.read, rid, visitor.token);
            return;
        }

        const { message, quickReplies = [], isFallback } = response;
        const attachment = quickReplies.map(({ payload }: IDialogflowQuickReply) => ({
            type: MessageActionType.BUTTON,
            text: payload,
            msg: payload,
            msg_in_chat_window: true,
        } as IMessageAction));

        await createMessage(rid, this.read, this.modify, { text: message, attachment });

        // synchronous handover check
        if (isFallback) {
            return incFallbackIntent(this.read, this.persis, this.modify, rid);
        } else {
            await resetFallbackIntent(this.read, this.persis, rid);
        }
    }
}
