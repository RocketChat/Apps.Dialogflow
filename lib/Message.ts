import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IMessageAction, IMessageAttachment, MessageActionType, MessageProcessingType } from '@rocket.chat/apps-engine/definition/messages';
import { AppSetting } from '../config/Settings';
import { IDialogflowMessage, IDialogflowQuickReplies } from '../enum/Dialogflow';
import { getAppSettingValue } from './Settings';

export const createDialogflowMessage = async (rid: string, read: IRead,  modify: IModify, dialogflowMessage: IDialogflowMessage): Promise<any> => {
    const { messages = [] } = dialogflowMessage;

    for (const message of messages) {
        const { title, quickReplies } = message as IDialogflowQuickReplies;

        if (title && quickReplies) {
            // message is instanceof IDialogflowQuickReplies
            const actions: Array<IMessageAction> = quickReplies.map((payload: string) => ({
                type: MessageActionType.BUTTON,
                text: payload,
                msg: payload,
                msg_in_chat_window: true,
                msg_processing_type: MessageProcessingType.SendMessage,
            } as IMessageAction));
            const attachment: IMessageAttachment = { actions };
            await createMessage(rid, read, modify, { text: title, attachment });
        } else {
            // message is instanceof string
            await createMessage(rid, read, modify, { text: message });
        }
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
