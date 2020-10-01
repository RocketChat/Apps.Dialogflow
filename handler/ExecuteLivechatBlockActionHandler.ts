import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { IUIKitResponse, UIKitLivechatBlockInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { AppSetting, DefaultMessage } from '../config/Settings';
import { ActionIds } from '../enum/ActionIds';
import { createLivechatMessage, createMessage, deleteAllActionBlocks } from '../lib/Message';
<<<<<<< HEAD
import { closeChat, performHandover, updateRoomCustomFields } from '../lib/Room';
=======
import { closeChat, performHandover } from '../lib/Room';
>>>>>>> fixing handover button and adding optional param
import { getAppSettingValue } from '../lib/Settings';

export class ExecuteLivechatBlockActionHandler {
    constructor(private readonly app: IApp,
                private context: UIKitLivechatBlockInteractionContext,
                private read: IRead,
                private http: IHttp,
                private persistence: IPersistence,
                private modify: IModify) {}

    public async run(): Promise<IUIKitResponse> {
        try {
            const interactionData = this.context.getInteractionData();
            const { visitor, room, container: { id, type }, value, actionId } = interactionData;

            if (type !== UIKitIncomingInteractionContainerType.MESSAGE) {
                return this.context.getInteractionResponder().successResponse();
            }

            const DialogflowBotUsername: string = await getAppSettingValue(this.read, AppSetting.DialogflowBotUsername);
            const { servedBy: { username = null } = {}, id: rid } = room as ILivechatRoom;

            if (!username || DialogflowBotUsername !== username) {
                return this.context.getInteractionResponder().successResponse();
            }

            const appUser = await this.read.getUserReader().getAppUser(this.app.getID()) as IUser;

            switch (actionId) {
                case ActionIds.PERFORM_HANDOVER:
                    const targetDepartment: string = value || await getAppSettingValue(this.read, AppSetting.FallbackTargetDepartment);

                    if (!targetDepartment) {
                        await createMessage(rid, this.read, this.modify, { text: DefaultMessage.DEFAULT_DialogflowRequestFailedMessage });
                        break;
                    }
<<<<<<< HEAD

=======
>>>>>>> fixing handover button and adding optional param
                    await performHandover(this.modify, this.read, rid, visitor.token, targetDepartment);
                    break;

                case ActionIds.CLOSE_CHAT:
                    await closeChat(this.modify, this.read, rid);
                    break;

                default:
                    await createLivechatMessage(rid, this.read, this.modify, { text: value }, visitor);
                    break;
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
