import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { ILivechatEventContext, ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { AppSetting, DefaultMessage } from '../config/Settings';
import { DialogflowRequestType, IDialogflowMessage } from '../enum/Dialogflow';
import { Logs } from '../enum/Logs';
import { Dialogflow } from '../lib/Dialogflow';
import { createDialogflowMessage, createMessage } from '../lib/Message';
import { updateRoomCustomFields } from '../lib/Room';
import { getAppSettingValue } from '../lib/Settings';

export class OnAgentAssignedHandler {
    constructor(private readonly app: IApp,
                private readonly context: ILivechatEventContext,
                private readonly read: IRead,
                private readonly http: IHttp,
                private readonly persis: IPersistence,
                private readonly modify: IModify) {}

    public async run() {
        const { room } = this.context;
        const livechatRoom = room as ILivechatRoom;

        const { id: rid, type, servedBy, isOpen, customFields = {}, visitor: { livechatData } } = livechatRoom;
        const { welcomeEventSent = false } = customFields;

        const DialogflowBotUsername: string = await getAppSettingValue(this.read, AppSetting.DialogflowBotUsername);
        const { value: sendWelcomeEvent } = await this.read.getEnvironmentReader().getSettings().getById(AppSetting.DialogflowWelcomeIntentOnStart);
        const { value: sendWelcomeMessage } = await this.read.getEnvironmentReader().getSettings().getById(AppSetting.DialogflowEnableWelcomeMessage);

        if (!type || type !== RoomType.LIVE_CHAT) {
            return;
        }

        if (!isOpen || !sendWelcomeEvent) {
            return;
        }

        if (!servedBy || servedBy.username !== DialogflowBotUsername) {
            return;
        }

        if (welcomeEventSent) {
            return;
        }

        if (sendWelcomeMessage) {
            const welcomeMessage: string = await getAppSettingValue(this.read, AppSetting.DialogflowWelcomeMessage);
            await createMessage(rid, this.read, this.modify, { text: welcomeMessage || DefaultMessage.DEFAULT_DialogflowWelcomeMessage });
        }

        await updateRoomCustomFields(rid, { welcomeEventSent: true }, this.read, this.modify);

        try {
            const event = { name: 'Welcome', languageCode: 'en', parameters: livechatData || {} };
            const response: IDialogflowMessage = await Dialogflow.sendRequest(this.http, this.read, this.modify, rid, event, DialogflowRequestType.EVENT);

            await createDialogflowMessage(rid, this.read, this.modify, response);
          } catch (error) {
            this.app.getLogger().error(`${Logs.DIALOGFLOW_REST_API_ERROR} ${error.message}`);

            const serviceUnavailable: string = await getAppSettingValue(this.read, AppSetting.DialogflowServiceUnavailableMessage);

            await createMessage(rid,
                                this.read,
                                this.modify,
                                { text: serviceUnavailable ? serviceUnavailable : DefaultMessage.DEFAULT_DialogflowServiceUnavailableMessage });

            return;
        }
    }
}
