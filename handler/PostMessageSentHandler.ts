import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { ILivechatMessage, ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { IMessageFile } from '@rocket.chat/apps-engine/definition/messages';
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
        const { text, editedAt, room, token, sender, file } = this.message;

        const livechatRoom = room as ILivechatRoom;

        const { id: rid, type, servedBy, isOpen } = livechatRoom;

        const DialogflowBotUsername: string = await getAppSettingValue(this.read, AppSetting.DialogflowBotUsername);

        if (!type || type !== RoomType.LIVE_CHAT) {
            return;
        }

        if (!isOpen || !token || editedAt) {
            return;
        }

        if (!servedBy || servedBy.username !== DialogflowBotUsername) {
            return;
        }

        if (sender.username === DialogflowBotUsername) {
            return;
        }

        if (!text && !file) {
            return;
        }

        if ((text && text.trim().length === 0) || (file && !file.type.startsWith('audio'))) {
            return;
        }

        let response: IDialogflowMessage;
        try {
            const content = text || (await this.read.getUploadReader().getBufferById((file as IMessageFile)._id)).toString('base64');
            const contentType = text ? DialogflowRequestType.MESSAGE : DialogflowRequestType.AUDIO;

            response = (await Dialogflow.sendRequest(this.http, this.read, this.modify, rid, content, contentType));
        } catch (error) {
            this.app.getLogger().error(`${Logs.DIALOGFLOW_REST_API_ERROR} ${error.message}`);

            const serviceUnavailable: string = await getAppSettingValue(this.read, AppSetting.DialogflowServiceUnavailableMessage);

            await createMessage(rid,
                                this.read,
                                this.modify,
                                { text: serviceUnavailable ? serviceUnavailable : DefaultMessage.DEFAULT_DialogflowServiceUnavailableMessage });

            return;
        }

        await createDialogflowMessage(rid, this.read, this.modify, response);

        // synchronous handover check
        const { isFallback } = response;
        if (isFallback) {
            return incFallbackIntent(this.read, this.modify, rid);
        }
        return resetFallbackIntent(this.read, this.modify, rid);
    }
}
