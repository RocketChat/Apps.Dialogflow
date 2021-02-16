import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { ILivechatEventContext, ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { AppSetting, DefaultMessage } from '../config/Settings';
import { createMessage, sendCloseChatButton } from '../lib/Message';
import { getAppSettingValue } from '../lib/Settings';

export class OnAgentUnassignedHandler {
    constructor(private readonly app: IApp,
                private readonly context: ILivechatEventContext,
                private readonly read: IRead,
                private readonly http: IHttp,
                private readonly persist: IPersistence,
                private readonly modify: IModify) {}

    public async run() {
        const livechatRoom: ILivechatRoom = this.context.room as ILivechatRoom;
        const DialogflowBotUsername: string = await getAppSettingValue(this.read, AppSetting.DialogflowBotUsername);
        const { isChatBotFunctional: allowChatBotSession } = this.context.room.customFields as any;

        if (!livechatRoom.servedBy) {
            return;
        }
        if (livechatRoom.servedBy.username === DialogflowBotUsername && allowChatBotSession === false) {
                const offlineMessage: string = await getAppSettingValue(this.read, AppSetting.DialogflowServiceUnavailableMessage);

                await createMessage(livechatRoom.id, this.read, this.modify,
                    { text: offlineMessage ? offlineMessage : DefaultMessage.DEFAULT_DialogflowServiceUnavailableMessage });

                await sendCloseChatButton (this.read, this.modify, livechatRoom.id);
            }

        return;
    }
}
