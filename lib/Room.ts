import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { AppSetting } from '../config/Settings';
import { getAppSettingValue } from '../lib/Settings';

export const updateRoomCustomFields = async (rid: string, data: any, read: IRead,  modify: IModify): Promise<any> => {
    if (!rid) {
        return;
    }
    const room = await read.getRoomReader().getById(rid);
    if (!room) { throw new Error(`Invalid room id ${rid}`); }

    const botUserName = await getAppSettingValue(read, AppSetting.DialogflowBotUsername);
    if (!botUserName) { throw new Error('The Bot Username setting is not defined.'); }

    const user = await read.getUserReader().getByUsername(botUserName);
    if (!user) { throw new Error('The Bot User does not exist.'); }

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
