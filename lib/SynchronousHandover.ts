import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { AppSettingId } from '../AppSettings';
import { getAppSetting } from '../helper';
import { AppPersistence } from './persistence';
import { RocketChatSDK } from './RocketChatSDK';

export class SynchronousHandover {
    private persistence: AppPersistence;
    constructor(private read: IRead, private persis: IPersistence, private modify: IModify) {
        this.persistence = new AppPersistence(this.persis, this.read.getPersistenceReader());
    }

    public async processFallbackIntent(sessionId: string) {

        const fallbackThreshold = (await getAppSetting(this.read, AppSettingId.FallbackThreshold)) as number;

        const oldFallbackCount = await this.persistence.getFallbackCount(sessionId);
        const newFallbackCount: number = oldFallbackCount ? oldFallbackCount + 1 : 1;

        this.persistence.updateFallbackCounter(sessionId, newFallbackCount);

        if (newFallbackCount === fallbackThreshold) {
            // perform handover
            const visitorToken: string = (await this.persistence.getConnectedVisitorToken(sessionId)) as string;
            if (!visitorToken) { throw new Error('Error: No visitor Token found for sessionId. Session Id must be invalid'); }

            const targetDepartmentName: string | undefined = await getAppSetting(this.read, AppSettingId.FallbackTargetDepartment);

            const roomId: string = sessionId;       // Session Id from Dialogflow will be the same as Room id

            const serverSDK: RocketChatSDK = new RocketChatSDK(this.modify, this.read);
            await serverSDK.performHandover(roomId, visitorToken, targetDepartmentName);
        }
    }

    public async resetFallbackIntentCounter(sessionId: string) {
        const fallbackCount = await this.persistence.getFallbackCount(sessionId);
        if (fallbackCount) {
            // if fallback count is present, then set it to 0
            this.persistence.updateFallbackCounter(sessionId, 0);
        }
    }
}
