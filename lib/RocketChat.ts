import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IDepartment, ILivechatRoom, ILivechatTransferData, IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { AppSetting } from '../config/Settings';
import { createMessage } from './Message';
import { getAppSettingValue } from './Settings';

// A helper class to perform RocketChat operations
class RocketChatSDK {
    /**
     *
     * @param modify {IModify}
     * @param read {IRead}
     * @param rid {string}
     *
     */
    public async closeChat(modify: IModify, read: IRead, rid: string) {
        const room: IRoom = (await read.getRoomReader().getById(rid)) as IRoom;
        if (!room) { throw new Error('Error: Room Id not valid'); }

        const closeChatMessage = await getAppSettingValue(read, AppSetting.DialogflowCloseChatMessage);

        const result = await modify.getUpdater().getLivechatUpdater().closeRoom(room, closeChatMessage ? closeChatMessage : '');
        if (!result) { throw new Error('Error: Internal Server Error. Could not close the chat'); }
    }

    /**
     *
     * @param modify {IModify}
     * @param read {IRead}
     * @param rid (required)
     * @param visitorToken (required)
     * @param targetDepartmentName (optional)
     */
    public async performHandover(modify: IModify, read: IRead, rid: string, visitorToken: string, targetDepartmentName?: string) {

        const handoverMessage: string = await getAppSettingValue(read, AppSetting.DialogflowHandoverMessage);
        await createMessage(rid, read, modify, { text: handoverMessage ? handoverMessage : '' });

        const room: ILivechatRoom = (await read.getRoomReader().getById(rid)) as ILivechatRoom;
        if (!room) { throw new Error('Error: Room Id not valid'); }

        const visitor: IVisitor = (await read.getLivechatReader().getLivechatVisitorByToken(visitorToken)) as IVisitor;
        if (!visitor) { throw new Error('Error: Visitor Id not valid'); }

        const livechatTransferData: ILivechatTransferData = {
            currentRoom: room,
        };

        // Fill livechatTransferData.targetDepartment param if required
        if (targetDepartmentName) {
            const targetDepartment: IDepartment = (await read.getLivechatReader().getLivechatDepartmentByIdOrName(targetDepartmentName)) as IDepartment;
            if (!targetDepartment) { throw new Error('Error: Department Name is not valid'); }
            livechatTransferData.targetDepartment = targetDepartment.id;
        }

        const result = await modify.getUpdater().getLivechatUpdater().transferVisitor(visitor, livechatTransferData)
            .catch((error) => {
                throw new Error('Error occured while processing handover. Details' + error);
            });
        if (!result) {
            const offlineMessage: string = await getAppSettingValue(read, AppSetting.DialogflowServiceUnavaliableMessage);

            await createMessage(rid, read, modify, { text: offlineMessage ? offlineMessage : '' });
        }
    }
}

export const RocketChat = new RocketChatSDK();
