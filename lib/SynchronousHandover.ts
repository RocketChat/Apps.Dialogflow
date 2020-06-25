import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { AppSetting } from '../config/Settings';
import { Persistence } from './persistence';
import { RocketChat } from './RocketChat';
import { getAppSettingValue } from './Settings';

class SynchronousHandoverClass {
    public async processFallbackIntent(read: IRead, persis: IPersistence, modify: IModify, sessionId: string) {
        const fallbackThreshold = (await getAppSettingValue(read, AppSetting.FallbackThreshold)) as number;

        const oldFallbackCount = await Persistence.getFallbackCount(read.getPersistenceReader(), sessionId);
        const newFallbackCount: number = oldFallbackCount ? oldFallbackCount + 1 : 1;

        Persistence.updateFallbackCounter(persis, sessionId, newFallbackCount);

        if (newFallbackCount === fallbackThreshold) {
            // perform handover
            const visitorToken: string = (await Persistence.getConnectedVisitorToken(read.getPersistenceReader(), sessionId)) as string;
            if (!visitorToken) { throw new Error('Error: No visitor Token found for sessionId. Session Id must be invalid'); }

            const targetDepartmentName: string | undefined = await getAppSettingValue(read, AppSetting.FallbackTargetDepartment);

            const roomId: string = sessionId;       // Session Id from Dialogflow will be the same as Room id

            await RocketChat.performHandover(modify, read, roomId, visitorToken, targetDepartmentName);
        }
    }

    public async resetFallbackIntentCounter(read: IRead, persis: IPersistence, sessionId: string) {
        const fallbackCount = await Persistence.getFallbackCount(read.getPersistenceReader(), sessionId);
        if (fallbackCount) {
            // if fallback count is present, then set it to 0
            Persistence.updateFallbackCounter(persis, sessionId, 0);
        }
    }
}

export const SynchronousHandover = new SynchronousHandoverClass();
