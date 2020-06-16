import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IDepartment, ILivechatRoom, ILivechatTransferData, IVisitor } from '@rocket.chat/apps-engine/definition/livechat';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';

// A helper class to interact with RocketChat's REST API
export class RocketChatSDK {

    constructor(private modify: IModify, private read: IRead) { }

    /**
     *
     * @param rid {string}
     *
     */
    public async closeChat(rid: string) {
        const room: IRoom = (await this.read.getRoomReader().getById(rid)) as IRoom;
        if (!room) { throw Error('Error: Room Id not valid'); }

        const result = await this.modify.getUpdater().getLivechatUpdater().closeRoom(room, '');
        if (!result) { throw new Error('Error: Internal Server Error. Could not close the chat'); }
    }

    /**
     *
     * @param rid (required)
     * @param visitorToken (required)
     * @param targetDepartmentName (required)
     */
    public async performHandover(rid: string, visitorToken: string, targetDepartmentName: string) {
        const room: ILivechatRoom = (await this.read.getRoomReader().getById(rid)) as ILivechatRoom;
        if (!room) { throw Error('Error: Room Id not valid'); }

        const visitor: IVisitor = (await this.read.getLivechatReader().getLivechatVisitorByToken(visitorToken)) as IVisitor;
        if (!visitor) { throw Error('Error: Visitor Id not valid'); }

        const livechatTransferData: ILivechatTransferData = {
            currentRoom: room,
        };

        // Fill livechatTransferData.targetDepartment param
        const targetDepartment: IDepartment = (await this.read.getLivechatReader().getLivechatDepartmentByIdOrName(targetDepartmentName)) as IDepartment;
        if (!targetDepartment) { throw Error('Error: Department Name is not valid'); }
        livechatTransferData.targetDepartment = targetDepartment.id;

        const result = await this.modify.getUpdater().getLivechatUpdater().transferVisitor(visitor, livechatTransferData)
            .catch((error) => {
                throw new Error('Error occured while processing handover. Details' + error);
            });
        if (!result) { throw new Error('Error: Internal Server Error. Could not perform handover'); }
    }
}
