import { IPersistence, IPersistenceRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IDialogflowAccessToken } from '../definition/IDialogflowAccessToken';

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

    public async updateFallbackCounter(sessionId: string, fallbackCounter: number): Promise<void> {
        const sessionAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, sessionId);
        const fallbackAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'fallback-counter');

        await this.persistence.updateByAssociations([sessionAssociation, fallbackAssociation], {
            fallbackCounter,
        }, true);
    }

    public async getFallbackCount(sessionId: string): Promise<number | undefined> {
        const sessionAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, sessionId);
        const fallbackAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'fallback-counter');

        const [result] = await this.persistenceRead.readByAssociations([sessionAssociation, fallbackAssociation]);
        return result && (result as any).fallbackCounter ? (result as any).fallbackCounter : undefined;
    }

    public async connectAccessTokenToSessionId(sessionId: string, accessToken: IDialogflowAccessToken) {
        const sessionAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, sessionId);
        const accessTokenAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'access-token');
        await this.persistence.updateByAssociations([sessionAssociation, accessTokenAssociation], {
            ...accessToken,
        }, true);
    }

    public async getConnectedAccessToken(sessionId: string) {
        const sessionAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, sessionId);
        const accessTokenAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'access-token');

        const [result] = await this.persistenceRead.readByAssociations([sessionAssociation, accessTokenAssociation]);
        return result && (result as IDialogflowAccessToken) ? result as IDialogflowAccessToken : undefined;
    }

}
