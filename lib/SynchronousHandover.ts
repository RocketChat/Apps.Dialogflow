import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { AppSetting } from '../config/Settings';
import { performHandover, updateRoomCustomFields } from './Room';
import { getAppSettingValue } from './Settings';

export const incFallbackIntent = async (read: IRead, persis: IPersistence, modify: IModify, sessionId: string) => {
    const fallbackThreshold = (await getAppSettingValue(read, AppSetting.DialogflowFallbackResponsesLimit)) as number;

    if (!fallbackThreshold || (fallbackThreshold && fallbackThreshold === 0)) { return; }

    const room: ILivechatRoom = await read.getRoomReader().getById(sessionId) as ILivechatRoom;
    if (!room) { throw new Error('Error! Room Id not valid'); }

    const { fallbackCount: oldFallbackCount } = room.customFields as any;
    const newFallbackCount: number = oldFallbackCount ? oldFallbackCount + 1 : 1;

    await updateRoomCustomFields(sessionId, { fallbackCount: newFallbackCount }, read, modify);

    if (newFallbackCount === fallbackThreshold) {
        // perform handover
        const { visitor: { token: visitorToken } } = room;
        if (!visitorToken) { throw new Error('Error: No visitor Token found for sessionId. Session Id must be invalid'); }

        const targetDepartmentName: string | undefined = await getAppSettingValue(read, AppSetting.FallbackTargetDepartment);

        // Session Id from Dialogflow will be the same as Room id
        await performHandover(modify, read, sessionId, visitorToken, targetDepartmentName);
    }
};

export const resetFallbackIntent = async (read: IRead, persis: IPersistence, modify: IModify, sessionId: string) => {
    await updateRoomCustomFields(sessionId, { fallbackCount: 0 }, read, modify);
};
