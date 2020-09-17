import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { AppSetting } from '../config/Settings';
import { Logs } from '../enum/Logs';
import { performHandover, updateRoomCustomFields } from './Room';
import { getAppSettingValue } from './Settings';

export const incFallbackIntentAndSendResponse = async (read: IRead, modify: IModify, sessionId: string, dialogflowMessage?: () => any) => {
    const fallbackThreshold = (await getAppSettingValue(read, AppSetting.DialogflowFallbackResponsesLimit)) as number;

    if (!fallbackThreshold || (fallbackThreshold && fallbackThreshold === 0)) { return; }

    const room: ILivechatRoom = await read.getRoomReader().getById(sessionId) as ILivechatRoom;
    if (!room) { throw new Error(Logs.INVALID_ROOM_ID); }

    const { fallbackCount: oldFallbackCount } = room.customFields as any;
    const newFallbackCount: number = oldFallbackCount ? oldFallbackCount + 1 : 1;

    await updateRoomCustomFields(sessionId, { fallbackCount: newFallbackCount }, read, modify);

    if (newFallbackCount === fallbackThreshold) {
        // perform handover
        const { visitor: { token: visitorToken } } = room;
        if (!visitorToken) { throw new Error(Logs.INVALID_VISITOR_TOKEN); }

        const targetDepartmentName: string | undefined = await getAppSettingValue(read, AppSetting.FallbackTargetDepartment);

        // Session Id from Dialogflow will be the same as Room id
        await performHandover(modify, read, sessionId, visitorToken, targetDepartmentName, dialogflowMessage);
    } else if (dialogflowMessage) {
        await dialogflowMessage();
    }
};

export const resetFallbackIntent = async (read: IRead, modify: IModify, sessionId: string) => {
    await updateRoomCustomFields(sessionId, { fallbackCount: 0 }, read, modify);
};
