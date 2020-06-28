import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { AppSetting } from '../config/Settings';
import { Persistence } from './Persistence';
import { RocketChat } from './RocketChat';
import { getAppSettingValue } from './Settings';

export const incFallbackIntent = async (read: IRead, persis: IPersistence, modify: IModify, sessionId: string) => {
    const fallbackThreshold = (await getAppSettingValue(read, AppSetting.DialogflowFallbackResponsesLimit)) as number;

    const oldFallbackCount = await Persistence.getFallbackCount(read.getPersistenceReader(), sessionId);
    const newFallbackCount: number = oldFallbackCount ? oldFallbackCount + 1 : 1;

    Persistence.updateFallbackCounter(persis, sessionId, newFallbackCount);

    if (newFallbackCount === fallbackThreshold) {
        // perform handover
        const visitorToken: string = (await Persistence.getConnectedVisitorToken(read.getPersistenceReader(), sessionId)) as string;
        if (!visitorToken) { throw new Error('Error: No visitor Token found for sessionId. Session Id must be invalid'); }

        const targetDepartmentName: string | undefined = await getAppSettingValue(read, AppSetting.FallbackTargetDepartment);

        // Session Id from Dialogflow will be the same as Room id
        await RocketChat.performHandover(modify, read, sessionId, visitorToken, targetDepartmentName);
    }
};

export const resetFallbackIntent = async (read: IRead, persis: IPersistence, sessionId: string) => {
    const fallbackCount = await Persistence.getFallbackCount(read.getPersistenceReader(), sessionId);
    return fallbackCount && Persistence.updateFallbackCounter(persis, sessionId, 0);
};
