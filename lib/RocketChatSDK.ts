import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
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

}
