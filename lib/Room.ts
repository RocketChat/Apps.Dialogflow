import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IDepartment, ILivechatRoom, ILivechatTransferData, IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { AppSetting, DefaultMessage } from '../config/Settings';
import { Logs } from '../enum/Logs';
import { removeBotTypingListener } from '../lib//BotTyping';
import { getAppSettingValue } from '../lib/Settings';
import { createMessage } from './Message';
import { SessionMaintenanceOnceSchedule } from './sessionMaintenance/SessionMaintenanceOnceSchedule';

export const updateRoomCustomFields = async (rid: string, data: any, read: IRead,  modify: IModify): Promise<any> => {
    if (!rid) {
        return;
    }
    const room = await read.getRoomReader().getById(rid);
    if (!room) { throw new Error(`${Logs.INVALID_ROOM_ID} ${rid}`); }

    const botUserName = await getAppSettingValue(read, AppSetting.DialogflowBotUsername);
    if (!botUserName) { throw new Error(Logs.EMPTY_BOT_USERNAME_SETTING); }

    const user = await read.getUserReader().getByUsername(botUserName);
    if (!user) { throw new Error(Logs.INVALID_BOT_USERNAME_SETTING); }

    let { customFields = {} } = room;
    customFields = Object.assign(customFields, data);
    const roomBuilder = await modify.getUpdater().room(rid, user);
    roomBuilder.setCustomFields(customFields);

    try {
        modify.getUpdater().finish(roomBuilder);
    } catch (error) {
        console.error(error);
    }
};

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

export const performHandover = async (modify: IModify, read: IRead, rid: string, visitorToken: string, targetDepartmentName?: string, dialogflowMessage?: () => any) => {

    const handoverMessage: string = await getAppSettingValue(read, AppSetting.DialogflowHandoverMessage);

    // Use handoverMessage if set
    if (handoverMessage) {
        await createMessage(rid, read, modify, { text: handoverMessage });
    } else if (dialogflowMessage)  {
        await dialogflowMessage();
    } else {
        await createMessage(rid, read, modify, { text: DefaultMessage.DEFAULT_DialogflowHandoverMessage });
    }

    const room: ILivechatRoom = (await read.getRoomReader().getById(rid)) as ILivechatRoom;
    if (!room) { throw new Error(Logs.INVALID_ROOM_ID); }

    const visitor: IVisitor = (await read.getLivechatReader().getLivechatVisitorByToken(visitorToken)) as IVisitor;
    if (!visitor) { throw new Error(Logs.INVALID_VISITOR_TOKEN); }

    const livechatTransferData: ILivechatTransferData = {
        currentRoom: room,
    };

    // Fill livechatTransferData.targetDepartment param if required
    if (targetDepartmentName) {
        const targetDepartment: IDepartment = (await read.getLivechatReader().getLivechatDepartmentByIdOrName(targetDepartmentName)) as IDepartment;
        if (!targetDepartment) { throw new Error(Logs.INVALID_DEPARTMENT_NAME); }
        livechatTransferData.targetDepartment = targetDepartment.id;
    }

    await updateRoomCustomFields(rid, {isHandedOverFromDialogFlow: true}, read, modify);

    const result = await modify.getUpdater().getLivechatUpdater().transferVisitor(visitor, livechatTransferData)
        .catch((error) => {
            throw new Error(`${Logs.HANDOVER_REQUEST_FAILED_ERROR} ${error}`);
        });

    await removeBotTypingListener(rid);

    if (!result) {
        const offlineMessage: string = await getAppSettingValue(read, AppSetting.DialogflowServiceUnavailableMessage),
        handoverFailure = {
            error: offlineMessage,
            errorMessage: 'Unable to reach Liveagent bot, it may be offline or disabled.',
            dialogflow_SessionID: rid,
            visitorDetails: (({ id, token }) => ({ id, token }))(visitor),
            targetDepartment: livechatTransferData.targetDepartment
        }

        console.log('Failed to handover', JSON.stringify(handoverFailure));

        await createMessage(rid, read, modify, { text: offlineMessage ? offlineMessage : DefaultMessage.DEFAULT_DialogflowHandoverFailedMessage });

        await closeChat(modify, read, rid);
        return;
    }

    // Viasat : Start maintaining session after handover
    const sessionMaintenanceInterval: string = await getAppSettingValue(read, AppSetting.DialogflowSessionMaintenanceInterval);

    if (!sessionMaintenanceInterval) {
        console.log('Session Maintenance Settings not configured');
    } else {
        await modify.getScheduler().scheduleOnce(new SessionMaintenanceOnceSchedule('session-maintenance', sessionMaintenanceInterval, {
            sessionId: room.id,
        }));
    }
};
