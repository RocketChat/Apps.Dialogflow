import { IPersistence, IPersistenceRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IDialogflowAccessToken } from '../enum/Dialogflow';

export class PersistenceClass {
    public async connectVisitorTokenToSessionId(persistence: IPersistence, sessionId: string, visitorToken: string): Promise<void> {
        const sessionAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, sessionId);
        const visitorTokenAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'visitor-token');

        await persistence.updateByAssociations([sessionAssociation, visitorTokenAssociation], {
            visitorToken,
        }, true);
    }

    public async getConnectedVisitorToken(persistenceRead: IPersistenceRead, sessionId: string): Promise<string | undefined> {
        const sessionAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, sessionId);
        const visitorTokenAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'visitor-token');

        const [result] = await persistenceRead.readByAssociations([sessionAssociation, visitorTokenAssociation]);
        return result && (result as any).visitorToken ? (result as any).visitorToken : undefined;
    }

    public async updateFallbackCounter(persistence: IPersistence, sessionId: string, fallbackCounter: number): Promise<void> {
        const sessionAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, sessionId);
        const fallbackAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'fallback-counter');

        await persistence.updateByAssociations([sessionAssociation, fallbackAssociation], {
            fallbackCounter,
        }, true);
    }

    public async getFallbackCount(persistenceRead: IPersistenceRead, sessionId: string): Promise<number | undefined> {
        const sessionAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, sessionId);
        const fallbackAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'fallback-counter');

        const [result] = await persistenceRead.readByAssociations([sessionAssociation, fallbackAssociation]);
        return result && (result as any).fallbackCounter ? (result as any).fallbackCounter : undefined;
    }

    public async connectAccessTokenToSessionId(persistence: IPersistence, sessionId: string, accessToken: IDialogflowAccessToken) {
        const sessionAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, sessionId);
        const accessTokenAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'access-token');
        await persistence.updateByAssociations([sessionAssociation, accessTokenAssociation], {
            ...accessToken,
        }, true);
    }

    public async getConnectedAccessToken(persistenceRead: IPersistenceRead, sessionId: string) {
        const sessionAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, sessionId);
        const accessTokenAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'access-token');

        const [result] = await persistenceRead.readByAssociations([sessionAssociation, accessTokenAssociation]);
        return result && (result as IDialogflowAccessToken) ? result as IDialogflowAccessToken : undefined;
    }
}

export const Persistence = new PersistenceClass();
