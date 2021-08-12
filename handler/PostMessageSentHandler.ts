import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { ILivechatMessage, ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { AppSetting, DefaultMessage } from '../config/Settings';
import { DialogflowRequestType, IDialogflowMessage, LanguageCode, Message } from '../enum/Dialogflow';
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

        const { id: rid, type, servedBy, isOpen } = livechatRoom;

        const DialogflowBotUsername: string = await getAppSettingValue(this.read, AppSetting.DialogflowBotUsername);

        if (text === Message.CLOSED_BY_VISITOR) {
            this.handleClosedByVisitor(rid);
        }

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

    private async handleClosedByVisitor(rid: string) {
        const DialogflowEnableChatClosedByVisitorEvent: boolean = await getAppSettingValue(this.read, AppSetting.DialogflowEnableChatClosedByVisitorEvent);
        const DialogflowChatClosedByVisitorEventName: string = await getAppSettingValue(this.read, AppSetting.DialogflowChatClosedByVisitorEventName);
        if (DialogflowEnableChatClosedByVisitorEvent) {
            try {
                let res: IDialogflowMessage;
                res = (await Dialogflow.sendRequest(this.http, this.read, this.modify, rid, {
                    name: DialogflowChatClosedByVisitorEventName,
                    languageCode: LanguageCode.EN,
                }, DialogflowRequestType.EVENT));
            } catch (error) {
                this.app.getLogger().error(`${Logs.DIALOGFLOW_REST_API_ERROR} ${error.message}`);
            }
        }
    }
}
