import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { BlockElementType, BlockType, IActionsBlock, IButtonElement, TextObjectType } from '@rocket.chat/apps-engine/definition/uikit';
import { AppSetting } from '../config/Settings';
import { IDialogflowMessage, IDialogflowQuickReplies } from '../enum/Dialogflow';
import { Logs } from '../enum/Logs';
import { getAppSettingValue } from './Settings';

export const createDialogflowMessage = async (rid: string, read: IRead,  modify: IModify, dialogflowMessage: IDialogflowMessage): Promise<any> => {
    const { messages = [] } = dialogflowMessage;

    for (const message of messages) {
        const { text, options } = message as IDialogflowQuickReplies;

        if (text && options) {
            // message is instanceof IDialogflowQuickReplies
            const elements: Array<IButtonElement> = options.map((payload: string) => ({
                type: BlockElementType.BUTTON,
                text: {
                    type: TextObjectType.PLAINTEXT,
                    text: payload,
                },
                actionId: payload,
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

    const { text, actionsBlock } = message;

    if (text) {
        msg.setText(text);
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
