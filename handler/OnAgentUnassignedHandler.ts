import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { ILivechatEventContext, ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { AppSetting, DefaultMessage } from '../config/Settings';
import { Logs } from '../enum/Logs';
import { removeBotTypingListener } from '../lib//BotTyping';
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
        const {id: rid} = livechatRoom;

        await removeBotTypingListener(rid);

        if (!livechatRoom.servedBy) {
            return;
        }
        if (livechatRoom.servedBy.username === DialogflowBotUsername && allowChatBotSession === false) {
                const offlineMessage: string = await getAppSettingValue(this.read, AppSetting.DialogflowServiceUnavailableMessage);

                await createMessage(livechatRoom.id, this.read, this.modify,
                    { text: offlineMessage ? offlineMessage : DefaultMessage.DEFAULT_DialogflowServiceUnavailableMessage });

                await closeChat(this.modify, this.read, rid);
            }

        return;
    }
}

export const closeChat = async (modify: IModify, read: IRead, rid: string) => {
    await modify.getScheduler().cancelJobByDataQuery({ sessionId: rid });
    const room: IRoom = (await read.getRoomReader().getById(rid)) as IRoom;
    if (!room) { throw new Error(Logs.INVALID_ROOM_ID); }

    await removeBotTypingListener(rid);

    const closeChatMessage = await getAppSettingValue(read, AppSetting.DialogflowCloseChatMessage);

    const result = await modify.getUpdater().getLivechatUpdater()
                                .closeRoom(room, closeChatMessage ? closeChatMessage : DefaultMessage.DEFAULT_DialogflowCloseChatMessage);
    if (!result) { throw new Error(Logs.CLOSE_CHAT_REQUEST_FAILED_ERROR); }
};
