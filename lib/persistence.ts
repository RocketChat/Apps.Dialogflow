import { IPersistence, IPersistenceRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';

export class AppPersistence {
    constructor(private readonly persistence: IPersistence, private readonly persistenceRead: IPersistenceRead) {}

    public async connectVisitorTokenToSessionId(sessionId: string, visitorToken: string): Promise<void> {
        const sessionAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, sessionId);
        await this.persistence.updateByAssociations([sessionAssociation], {
            visitorToken,
        }, true);
    }

    public async getConnectedVisitorToken(sessionId: string): Promise<string | undefined> {
        const sessionAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, sessionId);

        const [result] = await this.persistenceRead.readByAssociations([sessionAssociation]);
        return result && (result as any).visitorToken ? (result as any).visitorToken : undefined;
    }
}
