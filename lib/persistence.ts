import { IPersistence, IPersistenceRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';

export class AppPersistence {
    constructor(private readonly persistence: IPersistence, private readonly persistenceRead: IPersistenceRead) {}

    public async connectRepoToRoom(repoName: string, room: IRoom): Promise<void> {
        const roomAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, room.id);
        const repoAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `repo:${repoName}`);

        await this.persistence.updateByAssociations([roomAssociation, repoAssociation], {
            repoName,
            room: room.id,
        }, true);
    }

    public async connectVisitorSessionToRoom(roomId: string, sessionId: string): Promise<void> {
        const sessionAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, sessionId);
        console.log('------------------------here -------------------------');
        await this.persistence.updateByAssociations([sessionAssociation], {
            roomId,
            sessionId,
        }, true).then((result) => {
            console.log('------ connectVisitorSessionToRoom ----', result);
        }).catch((error) => {
            console.log('------ connectVisitorSessionToRoom ----', error);
        });
    }

    public async getConnectedRoomId(sessionId: string): Promise<string | undefined> {
        const sessionAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, sessionId);

        const [result] = await this.persistenceRead.readByAssociations([sessionAssociation]);
        console.log('---- Result getConnectedRoomId ----', result);
        return result ? (result as any) : undefined;
    }

    public async setUserAccessToken(accessToken: string, user: IUser): Promise<void> {
        const userAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, user.id);
        const typeAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'github-key');

        await this.persistence.updateByAssociations([userAssociation, typeAssociation], { accessToken }, true);
    }

    public async setRoomIdToken(roomId: string, sessionId: string): Promise<void> {
        const userAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'session-id');
        const roomAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'room-id');

        await this.persistence.updateByAssociations([userAssociation, roomAssociation], {
            roomId,
            sessionId,
        }, true);
    }

    // public async getRoomIdToken(): Promise<void> {
    //     const userAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, user.token);
    //     const roomAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.ROOM, roomId);

    //     await this.persistence.updateByAssociations([userAssociation, roomAssociation], { roomId }, true);
    // }

    // public async getConnectedRoomId(repoName: string): Promise<string | undefined> {
    //     const repoAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, `repo:${repoName}`);

    //     const [result] = await this.persistenceRead.readByAssociations([repoAssociation]);

    //     return result ? (result as any).room : undefined;
    // }

    public async getUserAccessToken(user: IUser): Promise<string | undefined> {
        const userAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.USER, user.id);
        const typeAssociation = new RocketChatAssociationRecord(RocketChatAssociationModel.MISC, 'github-key');

        const [result] = await this.persistenceRead.readByAssociations([userAssociation, typeAssociation]);

        return result ? (result as any).accessToken : undefined;
    }
}
