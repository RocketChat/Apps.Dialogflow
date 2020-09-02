import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { BlockElementType, ButtonStyle, ConditionalBlockFiltersEngine, IButtonElement, TextObjectType } from '@rocket.chat/apps-engine/definition/uikit';
import { AppSetting } from '../config/Settings';
import { IDialogflowMessage, IDialogflowQuickReplies } from '../enum/Dialogflow';
import { Logs } from '../enum/Logs';
import { getAppSettingValue } from './Settings';

export const createDialogflowMessage = async (rid: string, read: IRead,  modify: IModify, dialogflowMessage: IDialogflowMessage): Promise<any> => {
    const { messages = [] } = dialogflowMessage;

    for (const message of messages) {
        const { text, options, blockId } = message as IDialogflowQuickReplies;

        if (text && options) {
            // message is instanceof IDialogflowQuickReplies
            const actions: Array<IButtonElement> = options.map((payload: any) => ({
                type: BlockElementType.BUTTON,
                text: {
                    type: TextObjectType.PLAINTEXT,
                    text: payload.text,
                },
                actionId: payload.actionId ? payload.actionId : undefined,
                value: payload.value ? payload.value : undefined,
                style: payload.buttonStyle === 'danger' ? ButtonStyle.DANGER : undefined || payload.buttonStyle === 'primary' ? ButtonStyle.PRIMARY : undefined,
            } as IButtonElement));

            const blocks = modify.getCreator().getBlockBuilder();
            const innerBlocks = modify.getCreator().getBlockBuilder();

            blocks.addConditionalBlock(
                innerBlocks.addActionsBlock({
                    blockId: blockId ? blockId : undefined,
                    elements: actions,
                }),
                { engine: [ConditionalBlockFiltersEngine.LIVECHAT] },
            );

            await createMessage(rid, read, modify, { text, blocks });
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
    const { text, blocks } = message;

    if (text) {
        msg.setText(text);
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
