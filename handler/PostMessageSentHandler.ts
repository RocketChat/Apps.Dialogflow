import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { ILivechatMessage, ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { AppSetting, DefaultMessage } from '../config/Settings';
import { DialogflowRequestType, IDialogflowMessage, IDialogflowQuickReplies, LanguageCode, Message } from '../enum/Dialogflow';

import { Logs } from '../enum/Logs';
import { botTypingListener, removeBotTypingListener } from '../lib//BotTyping';
import { Dialogflow } from '../lib/Dialogflow';
import { createDialogflowMessage, createMessage } from '../lib/Message';
import { handlePayloadActions } from '../lib/payloadAction';
import { handleParameters } from '../lib/responseParameters';
import { closeChat, performHandover, updateRoomCustomFields } from '../lib/Room';
import { getAppSettingValue } from '../lib/Settings';
import { incFallbackIntentAndSendResponse, resetFallbackIntent } from '../lib/SynchronousHandover';
import { handleTimeout } from '../lib/Timeout';

export class PostMessageSentHandler {
    constructor(private readonly app: IApp,
                private readonly message: ILivechatMessage,
                private readonly read: IRead,
                private readonly http: IHttp,
                private readonly persistence: IPersistence,
                private readonly modify: IModify) { }

    public async run() {
        const { text, editedAt, room, token, sender, customFields } = this.message;
        const livechatRoom = room as ILivechatRoom;

        const { id: rid, type, servedBy, isOpen, customFields: roomCustomFields } = livechatRoom;

        const DialogflowBotUsername: string = await getAppSettingValue(this.read, AppSetting.DialogflowBotUsername);

        if (text === Message.CLOSED_BY_VISITOR) {
            if (roomCustomFields && roomCustomFields.isHandedOverFromDialogFlow === true) {
                return;
            }
            await this.modify.getScheduler().cancelJobByDataQuery({ sessionId: rid });
            await this.handleClosedByVisitor(rid);
        }

        if (text === Message.CUSTOMER_IDEL_TIMEOUT) {
            if (roomCustomFields && roomCustomFields.isHandedOverFromDialogFlow === true) {
                return;
            }
            await this.handleClosedByVisitor(rid);
            await closeChat(this.modify, this.read, rid, this.persistence);
            return;
        }

        if (!type || type !== RoomType.LIVE_CHAT) {
            return;
        }

        if (!isOpen) {
            return;
        }

        if (customFields) {
            const { disableInput, displayTyping } = customFields;
            if (disableInput === true && displayTyping !== true) {
                await removeBotTypingListener(this.modify, rid, DialogflowBotUsername);
            }
        }

        if (!text || editedAt) {
            return;
        }

        if (!servedBy || servedBy.username !== DialogflowBotUsername) {
            return;
        }

        if (!text || (text && text.trim().length === 0)) {
            return;
        }

        await handleTimeout(this.app, this.message, this.read, this.http, this.persistence, this.modify);

        if (sender.username === DialogflowBotUsername) {
            return;
        }

        let response: IDialogflowMessage;
        const { visitor: { token: visitorToken } } = room as ILivechatRoom;

        try {
            await botTypingListener(this.modify, rid, DialogflowBotUsername);
            response = (await Dialogflow.sendRequest(this.http, this.read, this.modify, this.persistence, rid, text, DialogflowRequestType.MESSAGE));
        } catch (error) {
            this.app.getLogger().error(`${Logs.DIALOGFLOW_REST_API_ERROR} ${error.message}`);

            const serviceUnavailable: string = await getAppSettingValue(this.read, AppSetting.DialogflowServiceUnavailableMessage);
            await createMessage(rid,
                this.read,
                this.modify,
                { text: serviceUnavailable ? serviceUnavailable : DefaultMessage.DEFAULT_DialogflowServiceUnavailableMessage });

            updateRoomCustomFields(rid, { isChatBotFunctional: false }, this.read, this.modify);
            const targetDepartment: string = await getAppSettingValue(this.read, AppSetting.FallbackTargetDepartment);
            await performHandover(this.modify, this.read, rid, visitorToken, targetDepartment);

            return;
        }

        const createResponseMessage = async () => await createDialogflowMessage(rid, this.read, this.modify, response);

        // synchronous handover check
        const { isFallback } = response;
        if (isFallback) {
            await removeBotTypingListener(this.modify, rid, DialogflowBotUsername);
            return incFallbackIntentAndSendResponse(this.read, this.modify, rid, createResponseMessage);
        }

        await createResponseMessage();
        await handlePayloadActions(this.read, this.modify, this.http, this.persistence, rid, visitorToken, response);
        await handleParameters(this.read, this.modify, this.persistence, this.http, rid, visitorToken, response);
        await this.handleBotTyping(rid, response);

        return resetFallbackIntent(this.read, this.modify, rid);
    }

    private async handleBotTyping(rid: string, dialogflowMessage: IDialogflowMessage) {
        const { messages = [] } = dialogflowMessage;
        let removeTypingIndicator = true;

        for (const message of messages) {
            const { customFields = null } = message as IDialogflowQuickReplies;

            if (customFields) {
                const { disableInput, displayTyping } = customFields;
                if (disableInput === true && displayTyping === true) {
                    removeTypingIndicator = false;
                }
            }
        }

        if (removeTypingIndicator) {
            await this.removeBotTypingListener(rid);
        }
    }

    private async handleClosedByVisitor(rid: string) {
        const DialogflowEnableChatClosedByVisitorEvent: boolean = await getAppSettingValue(this.read, AppSetting.DialogflowEnableChatClosedByVisitorEvent);
        const DialogflowChatClosedByVisitorEventName: string = await getAppSettingValue(this.read, AppSetting.DialogflowChatClosedByVisitorEventName);
        await this.removeBotTypingListener(rid);
        if (DialogflowEnableChatClosedByVisitorEvent) {
            try {
                let res: IDialogflowMessage;
                res = (await Dialogflow.sendRequest(this.http, this.read, this.modify, this.persistence, rid, {
                    name: DialogflowChatClosedByVisitorEventName,
                    languageCode: LanguageCode.EN,
                }, DialogflowRequestType.EVENT));
            } catch (error) {
                this.app.getLogger().error(`${Logs.DIALOGFLOW_REST_API_ERROR} ${error.message}`);
            }
        }
    }

    private async removeBotTypingListener(rid: string) {
        const DialogflowBotUsername: string = await getAppSettingValue(this.read, AppSetting.DialogflowBotUsername);
        await removeBotTypingListener(this.modify, rid, DialogflowBotUsername);
    }
}
