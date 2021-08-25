import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { IUIKitResponse, UIKitBlockInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { AppSetting } from '../config/Settings';
import { ActionIds } from '../enum/ActionIds';
import { createDirectMessage, deleteAllActionBlocks } from '../lib/Message';
import { getAppSettingValue } from '../lib/Settings';

export class ExecuteBlockActionHandler {
    constructor(private readonly app: IApp,
                private context: UIKitBlockInteractionContext,
                private read: IRead,
                private http: IHttp,
                private persistence: IPersistence,
                private modify: IModify) {}

    public async run(): Promise<IUIKitResponse> {
        try {
            const interactionData = this.context.getInteractionData();
            const { room, container: { id, type }, value, actionId, message } = interactionData;

            if (type !== UIKitIncomingInteractionContainerType.MESSAGE || !room || !message) {
                return this.context.getInteractionResponder().successResponse();
            }

            const { type: roomType, userIds, id: rid } = room;

            if (!roomType || roomType !== RoomType.DIRECT_MESSAGE) {
                return this.context.getInteractionResponder().successResponse();
            }

            const directMessageAllowed = await getAppSettingValue(this.read, AppSetting.DialogflowAllowDirectMessage);
            if (!directMessageAllowed) {
                return this.context.getInteractionResponder().successResponse();
            }

            // check if the DM is of the bot
            if (!userIds) {
                return this.context.getInteractionResponder().successResponse();
            }
            if (!userIds.some((userId) => message.sender.id === userId)) {
                return this.context.getInteractionResponder().successResponse();
            }

            const appUser = await this.read.getUserReader().getAppUser(this.app.getID()) as IUser;
            switch (actionId) {
                case ActionIds.PERFORM_HANDOVER:
                    break;

                case ActionIds.CLOSE_CHAT:
                    break;
                default: {
                    const otherUserId = (userIds as any).find((userId) => userId !== message.sender.id);
                    if (!otherUserId) {
                        return this.context.getInteractionResponder().errorResponse();
                    }

                    const otherUser = await this.read.getUserReader().getById(otherUserId);
                    if (!otherUser) {
                        return this.context.getInteractionResponder().errorResponse();
                    }

                    await createDirectMessage(this.app, rid, this.read, this.modify, { text: value }, otherUser);
                    break;
                }
            }

            const { value: hideQuickRepliesSetting } = await this.read.getEnvironmentReader().getSettings().getById(AppSetting.DialogflowHideQuickReplies);
            if (hideQuickRepliesSetting) {
                await deleteAllActionBlocks(this.modify, appUser, id);
            }

            return this.context.getInteractionResponder().successResponse();
        } catch (error) {
            this.app.getLogger().error(error);
            return this.context.getInteractionResponder().errorResponse();
        }
    }
}
