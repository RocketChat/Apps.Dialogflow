import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IMessageAction, IMessageAttachment, MessageActionType, MessageProcessingType } from '@rocket.chat/apps-engine/definition/messages';
import { IUploadDescriptor } from '@rocket.chat/apps-engine/definition/uploads/IUploadDescriptor';
import { Buffer } from 'buffer';
import { AppSetting } from '../config/Settings';
import { DialogflowJWT, IDialogflowMessage, IDialogflowQuickReplies } from '../enum/Dialogflow';
import { Logs } from '../enum/Logs';
import { getAppSettingValue } from './Settings';

export const createDialogflowMessage = async (rid: string, read: IRead,  modify: IModify, dialogflowMessage: IDialogflowMessage): Promise<any> => {
    const { messages = [], audio } = dialogflowMessage;

    const room = await read.getRoomReader().getById(rid);
    if (!room) {
        throw new Error(`${Logs.INVALID_ROOM_ID} ${rid}`);
    }
    const botUserName = await getAppSettingValue(read, AppSetting.DialogflowBotUsername);
    if (!botUserName) {
        throw new Error(Logs.EMPTY_BOT_USERNAME_SETTING);
    }
    const sender = await read.getUserReader().getByUsername(botUserName);
    if (!sender) {
        throw new Error(Logs.INVALID_BOT_USERNAME_SETTING);
    }
    if (audio) {
        const buffer = Buffer.from(audio, DialogflowJWT.BASE_64);
        const uploadDescriptor: IUploadDescriptor = {
            filename: 'audio.wav',
            room,
            user: sender,
        };
        await modify.getCreator().getUploadCreator().uploadBuffer(buffer, uploadDescriptor);
    }

    for (const message of messages) {
        const { text, options } = message as IDialogflowQuickReplies;

        if (text && options) {
            // message is instanceof IDialogflowQuickReplies
            const actions: Array<IMessageAction> = options.map((payload: string) => ({
                type: MessageActionType.BUTTON,
                text: payload,
                msg: payload,
                msg_in_chat_window: true,
                msg_processing_type: MessageProcessingType.SendMessage,
            } as IMessageAction));
            const attachment: IMessageAttachment = { actions };
            await createMessage(rid, read, modify, { text, attachment });
        } else {
            // message is instanceof string
            if ((message as string).trim().length > 0) {
                await createMessage(rid, read, modify, { text: message });
            }
        }
    }
};

export const createMessage = async (rid: string, read: IRead,  modify: IModify, message: any ): Promise<any> => {
    if (!message) {
        return;
    }

    const botUserName = await getAppSettingValue(read, AppSetting.DialogflowBotUsername);
    if (!botUserName) {
        this.app.getLogger().error(Logs.EMPTY_BOT_USERNAME_SETTING);
        return;
    }

    const sender = await read.getUserReader().getByUsername(botUserName);
    if (!sender) {
        this.app.getLogger().error(Logs.INVALID_BOT_USERNAME_SETTING);
        return;
    }

    const room = await read.getRoomReader().getById(rid);
    if (!room) {
        this.app.getLogger().error(`${Logs.INVALID_ROOM_ID} ${rid}`);
        return;
    }

    const msg = modify.getCreator().startLivechatMessage().setRoom(room).setSender(sender);
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
