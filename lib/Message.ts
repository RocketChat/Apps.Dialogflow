import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { BlockElementType, BlockType, ButtonStyle, IActionsBlock, IButtonElement, IImageBlock, ITextObject, TextObjectType } from '@rocket.chat/apps-engine/definition/uikit';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { AppSetting } from '../config/Settings';
import { ActionIds } from '../enum/ActionIds';
import { IDialogflowMessage, IDialogflowQuickReplies, IDialogflowQuickReplyOptions } from '../enum/Dialogflow';
import { Logs } from '../enum/Logs';
import { uuid } from './Helper';
import { getAppSettingValue } from './Settings';

export const createDialogflowMessage = async (rid: string, read: IRead,  modify: IModify, dialogflowMessage: IDialogflowMessage): Promise<any> => {
    const { messages = [] } = dialogflowMessage;

    for (const message of messages) {
        const { text, options, customFields = null, imagecards } = message as IDialogflowQuickReplies;
        const data: any = { customFields };

        if (text && text.trim().length > 0) {
            data.text = text;
        } else if (typeof message === 'string') {
            data.text = message;
        }

        if (options) {
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
                    buttonElement.value = payload.salesforceButtonId ? payload.salesforceButtonId : undefined;
                }

                return buttonElement;
            });

            data.actionsBlock = { type: BlockType.ACTIONS, elements };
        }

        await createMessage(rid, read, modify, data);

        if (imagecards) {
            const imageCardBlock: Array<any> = imagecards.map((payload) => {
                const imageBlock: IImageBlock = {
                    type: BlockType.IMAGE,
                    altText: payload.image_url,
                    imageUrl: payload.image_url,
                    ...payload.subtitle && { title: { text: payload.subtitle, type: TextObjectType.MARKDOWN } as ITextObject },
                };

                if (payload.buttons) {
                    const cardElements: Array<IButtonElement> = payload.buttons.map((cardElementPayload: IDialogflowQuickReplyOptions) => {
                        const buttonElement: IButtonElement = {
                            type: BlockElementType.BUTTON,
                            actionId: cardElementPayload.actionId || uuid(),
                            text: {
                                text: cardElementPayload.text,
                                type: TextObjectType.PLAINTEXT,
                            },
                            value: cardElementPayload.text,
                            ...cardElementPayload.buttonStyle && { style: cardElementPayload.buttonStyle },
                        };

                        if (cardElementPayload.actionId && cardElementPayload.actionId === ActionIds.PERFORM_HANDOVER) {
                            buttonElement.value = cardElementPayload.salesforceButtonId ? cardElementPayload.salesforceButtonId : undefined;
                        }

                        return buttonElement;
                    });

                    const cardActionsBlock: IActionsBlock = { type: BlockType.ACTIONS, elements: cardElements };

                    return {
                        ...payload.title && { title: payload.title },
                        imageBlock,
                        cardActionsBlock,
                    };
                }

                return {
                    ...payload.title && { title: payload.title },
                    imageBlock,
                };
            });

            imageCardBlock.forEach(async (i) => {
                await createMessage(rid, read, modify, {
                    imageCardBlock: i.imageBlock,
                    ...i.title && { text: i.title },
                    ...i.cardActionsBlock && { actionsBlock: i.cardActionsBlock },
                });
            });
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

    const { text, actionsBlock, attachment, customFields, imageCardBlock } = message;
    let data = { room, sender };

    if (customFields) {
        data = Object.assign(data, { customFields });
    }

    const msg = modify.getCreator().startMessage(data);

    if (text) {
        msg.setText(text);
    }

    if (attachment) {
        msg.addAttachment(attachment);
    }

    if (imageCardBlock) {
        msg.addBlocks(modify.getCreator().getBlockBuilder().addImageBlock(imageCardBlock));
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
        this.app.getLogger().error(`${ Logs.INVALID_ROOM_ID } ${ rid }`);
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

export const sendCloseChatButton = async (read: IRead, modify: IModify, rid: string) => {
    const elements: Array<IButtonElement> = [{
        type: BlockElementType.BUTTON,
        actionId: ActionIds.CLOSE_CHAT,
        text: {
            text: 'Close Chat',
            type: TextObjectType.PLAINTEXT,
        },
        value: 'Close Chat',
        style: ButtonStyle.DANGER,
    }];

    const actionsBlock: IActionsBlock = { type: BlockType.ACTIONS, elements };
    await createMessage(rid, read, modify, { actionsBlock });
};
