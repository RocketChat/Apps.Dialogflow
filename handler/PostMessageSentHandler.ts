import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { ILivechatMessage, ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { AppSetting, DefaultMessage } from '../config/Settings';
import { DialogflowRequestType, IDialogflowMessage } from '../enum/Dialogflow';
import { Logs } from '../enum/Logs';
import { Dialogflow } from '../lib/Dialogflow';
import { createDialogflowMessage, createMessage } from '../lib/Message';
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

        console.log('---room', room);

        const { id: rid, type, servedBy, isOpen, userIds } = livechatRoom;

        const DialogflowBotUsername: string = await getAppSettingValue(this.read, AppSetting.DialogflowBotUsername);

        if (!type) {
            return;
        }

        switch (type) {
            case RoomType.LIVE_CHAT: {
                if (!isOpen || !token) {
                    return;
                }
                if (!servedBy || servedBy.username !== DialogflowBotUsername) {
                    return;
                }
                break;
            }
            case RoomType.DIRECT_MESSAGE: {
                const directMessageAllowed = await getAppSettingValue(this.read, AppSetting.DialogflowAllowDirectMessage);
                if (!directMessageAllowed) {
                    return;
                }

                // check if the DM is of the bot
                if (!userIds) {
                    return;
                }
                if (!userIds.some((userId) => sender.id === userId)) {
                    return;
                }
                break;
            }
            default: {
                return;
            }
        }

        if (editedAt || !text) {
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
            response = (await Dialogflow.sendRequest(this.http, this.read, this.modify, rid, text, DialogflowRequestType.MESSAGE));
        } catch (error) {
            this.app.getLogger().error(`${Logs.DIALOGFLOW_REST_API_ERROR} ${error.message}`);

            const serviceUnavailable: string = await getAppSettingValue(this.read, AppSetting.DialogflowServiceUnavailableMessage);

            await createMessage(this.app,
                                rid,
                                this.read,
                                this.modify,
                                { text: serviceUnavailable ? serviceUnavailable : DefaultMessage.DEFAULT_DialogflowServiceUnavailableMessage });

            return;
        }

        await createDialogflowMessage(this.app, rid, this.read, this.modify, response);

        // synchronous handover check
        const { isFallback } = response;
        if (isFallback) {
            return incFallbackIntent(this.app, this.read, this.modify, rid);
        }
        return resetFallbackIntent(this.read, this.modify, rid);
    }
}
