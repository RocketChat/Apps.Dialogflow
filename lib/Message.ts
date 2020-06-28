import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IMessageAction, MessageActionType } from '@rocket.chat/apps-engine/definition/messages';
import { AppSetting } from '../config/Settings';
import { IDialogflowMessage } from '../enum/Dialogflow';
import { getAppSettingValue } from './Settings';

export const createDialogflowMessage = async (rid: string, read: IRead,  modify: IModify, dialogflowMessage: IDialogflowMessage): Promise<any> => {
    const { messages = [], quickReplies: { title: quickRepliesMessage = null, quickReplies = [] } = {} } = dialogflowMessage;

    for (const message of messages) {
        await createMessage(rid, read, modify, { text: message });
    }

    if (quickRepliesMessage && quickReplies.length > 0) {
        const attachment = quickReplies.map((payload: string) => ({
            type: MessageActionType.BUTTON,
            text: payload,
            msg: payload,
            msg_in_chat_window: true,
        } as IMessageAction));
        await createMessage(rid, read, modify, { text: quickRepliesMessage, attachment });
    }
};

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
