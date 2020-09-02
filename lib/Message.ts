import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { BlockElementType, BlockType, IActionsBlock, IButtonElement, TextObjectType } from '@rocket.chat/apps-engine/definition/uikit';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { AppSetting } from '../config/Settings';
import { IDialogflowMessage, IDialogflowQuickReplies, IDialogflowQuickRepliesOptions } from '../enum/Dialogflow';
import { Logs } from '../enum/Logs';
import { getAppSettingValue } from './Settings';

export const createDialogflowMessage = async (rid: string, read: IRead,  modify: IModify, dialogflowMessage: IDialogflowMessage): Promise<any> => {
    const { messages = [] } = dialogflowMessage;

    for (const message of messages) {
        const { text, options } = message as IDialogflowQuickReplies;

        if (text && options) {
            // message is instanceof IDialogflowQuickReplies
            const elements: Array<IButtonElement> = options.map((payload: IDialogflowQuickRepliesOptions) => ({
                type: BlockElementType.BUTTON,
                text: {
                    type: TextObjectType.PLAINTEXT,
                    text: payload.text,
                },
                actionId: payload.actionId ? payload.actionId : payload.text,
                ...payload.buttonStyle && { style: payload.buttonStyle },
            } as IButtonElement));

            const actionsBlock: IActionsBlock = { type: BlockType.ACTIONS, elements };

            await createMessage(rid, read, modify, { text, actionsBlock });
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

    const msg = modify.getCreator().startMessage().setRoom(room).setSender(sender);

    const { text, actionsBlock, attachment } = message;

    if (text) {
        msg.setText(text);
    }

    if (attachment) {
        msg.addAttachment(attachment);
    }

    if (actionsBlock) {
        const { elements } = actionsBlock as IActionsBlock;
        msg.addBlocks(modify.getCreator().getBlockBuilder().addActionsBlock({ elements }));
    }

    return new Promise(async (resolve) => {
        modify.getCreator().finish(msg)
        .then((result) => resolve(result))
        .catch((error) => console.error(error));
    });
};

export const createLivechatMessage = async (rid: string, read: IRead,  modify: IModify, message: any, visitor: IVisitor ): Promise<any> => {
    if (!message) {
        return;
    }

    const botUserName = await getAppSettingValue(read, AppSetting.DialogflowBotUsername);
    if (!botUserName) {
        this.app.getLogger().error(Logs.EMPTY_BOT_USERNAME_SETTING);
        return;
    }

    const room = await read.getRoomReader().getById(rid);
    if (!room) {
        this.app.getLogger().error(`${Logs.INVALID_ROOM_ID} ${rid}`);
        return;
    }

    const msg = modify.getCreator().startLivechatMessage().setRoom(room).setVisitor(visitor);

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

export const deleteAllActionBlocks = async (modify: IModify, appUser: IUser, msgId: string) => {
    const msgBuilder = await modify.getUpdater().message(msgId, appUser);
    msgBuilder.setEditor(appUser);
    msgBuilder.setBlocks(modify.getCreator().getBlockBuilder().getBlocks());
    await modify.getUpdater().finish(msgBuilder);
};
