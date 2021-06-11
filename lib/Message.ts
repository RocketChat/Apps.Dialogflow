import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { BlockElementType, IButtonElement, TextObjectType } from '@rocket.chat/apps-engine/definition/uikit';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { AppSetting } from '../config/Settings';
import { ActionIds } from '../enum/ActionIds';
import { IDialogflowMessage, IDialogflowQuickReplies, IDialogflowQuickReplyOptions } from '../enum/Dialogflow';
import { Logs } from '../enum/Logs';
import { uuid } from './Helper';
import { getAppSettingValue } from './Settings';

export const createDialogflowMessage = async (app: IApp, rid: string, read: IRead,  modify: IModify, dialogflowMessage: IDialogflowMessage): Promise<any> => {
    const { messages = [] } = dialogflowMessage;

    for (const message of messages) {
        const { text, options } = message as IDialogflowQuickReplies;
        if (text && options) {
            const elements: Array<IButtonElement> = options.map((payload: IDialogflowQuickReplyOptions) => {
                    const buttonElement: IButtonElement = {
                        type: BlockElementType.BUTTON,
                        actionId: payload.actionId || uuid(),
                        text: {
                            text: payload.text,
                            type: TextObjectType.PLAINTEXT,
                        },
                        value: payload.text,
                        ...payload.buttonStyle && { style: payload.buttonStyle },
                    };

                    if (payload.actionId && payload.actionId === ActionIds.PERFORM_HANDOVER) {
                        buttonElement.value = payload.data && payload.data.departmentName ? payload.data.departmentName : undefined;
                    }

                    return buttonElement;
            });

            const blocks = modify.getCreator().getBlockBuilder();

            blocks.addSectionBlock({ 
                text: blocks.newMarkdownTextObject(text)
            });

            blocks.addActionsBlock({
                elements,
            });

            await createMessage(app, rid, read, modify, { blocks });
        } else {
            // message is instanceof string
            if ((message as string).trim().length > 0) {
                await createMessage(app, rid, read, modify, { text: message });
            }
        }
    }
};

export const createMessage = async (app: IApp, rid: string, read: IRead,  modify: IModify, message: any ): Promise<any> => {
    if (!message) {
        return;
    }

    const botUserName = await getAppSettingValue(read, AppSetting.DialogflowBotUsername);
    if (!botUserName) {
        app.getLogger().error(Logs.EMPTY_BOT_USERNAME_SETTING);
        return;
    }

    const sender = await read.getUserReader().getByUsername(botUserName);
    if (!sender) {
        app.getLogger().error(Logs.INVALID_BOT_USERNAME_SETTING);
        return;
    }

    const room = await read.getRoomReader().getById(rid);
    if (!room) {
        app.getLogger().error(`${Logs.INVALID_ROOM_ID} ${rid}`);
        return;
    }

    const msg = modify.getCreator().startMessage().setRoom(room).setSender(sender);

    const { text, blocks, attachment } = message;

    if (text) {
        msg.setText(text);
    }

    if (attachment) {
        msg.addAttachment(attachment);
    }

    if (blocks) {
        msg.addBlocks(blocks);
    }

    return new Promise(async (resolve) => {
        modify.getCreator().finish(msg)
        .then((result) => resolve(result))
        .catch((error) => console.error(error));
    });
};

export const createLivechatMessage = async (app: IApp, rid: string, read: IRead,  modify: IModify, message: any, visitor: IVisitor ): Promise<any> => {
    if (!message) {
        return;
    }

    const botUserName = await getAppSettingValue(read, AppSetting.DialogflowBotUsername);
    if (!botUserName) {
        app.getLogger().error(Logs.EMPTY_BOT_USERNAME_SETTING);
        return;
    }

    const room = await read.getRoomReader().getById(rid);
    if (!room) {
        app.getLogger().error(`${ Logs.INVALID_ROOM_ID } ${ rid }`);
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

export const deleteAllActionBlocks = async (modify: IModify, appUser: IUser, msgId: string): Promise<void> => {
    const msgBuilder = await modify.getUpdater().message(msgId, appUser);
    msgBuilder.setEditor(appUser).setBlocks(modify.getCreator().getBlockBuilder().getBlocks());
    return modify.getUpdater().finish(msgBuilder);
};
