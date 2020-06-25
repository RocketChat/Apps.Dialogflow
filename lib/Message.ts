import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';

import { AppSetting } from '../config/Settings';
import { getAppSettingValue } from './Settings';

export const createMessage = async (rid: string, read: IRead,  modify: IModify, message: any ): Promise<any> => {
    if (!message) {
        return;
    }

    const botUserName = await getAppSettingValue(read, AppSetting.DialogflowBotUsername);
    if (!botUserName) {
        this.app.getLogger().error('The Bot Username setting is not defined.');
        return;
    }

    const sender = await read.getUserReader().getByUsername(botUserName);
    if (!sender) {
        this.app.getLogger().error('The Bot User does not exist.');
        return;
    }

    const room = await read.getRoomReader().getById(rid);
    if (!room) {
        this.app.getLogger().error(`Invalid room id ${rid}`);
        return;
    }

    const msg = modify.getCreator().startMessage().setRoom(room).setSender(sender);
    const { text, attachment } = message;

    if (text) {
        msg.setText(text);
    }

    if (attachment) {
        msg.addAttachment(attachment);
    }

    return new Promise(async (resolve) => {
        modify.getCreator().finish(msg)
        .then((result) => resolve(result))
        .catch((error) => console.error(error));
    });
};
