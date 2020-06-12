import { IPersistence, IPersistenceRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';

export class AppPersistence {
    constructor(private readonly persistence: IPersistence, private readonly persistenceRead: IPersistenceRead) {}

    public async connectVisitorSessionToRoom(roomId: string, sessionId: string): Promise<void> {
        const sessionAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, sessionId);
        await this.persistence.updateByAssociations([sessionAssociation], {
            roomId,
            sessionId,
        }, true);
    }

    public async getConnectedRoomId(sessionId: string): Promise<string | undefined> {
        const sessionAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, sessionId);

        const [result] = await this.persistenceRead.readByAssociations([sessionAssociation]);
        return result && (result as any).roomId ? (result as any).roomId : undefined;
    }
}
