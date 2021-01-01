import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { IJobContext, IProcessor } from '@rocket.chat/apps-engine/definition/scheduler';
import { AppSetting } from '../../config/Settings';
import { DialogflowRequestType, LanguageCode } from '../../enum/Dialogflow';
import { Dialogflow } from '../../lib/Dialogflow';
import { getAppSettingValue } from '../../lib/Settings';
import { SessionMaintenanceOnceSchedule } from './SessionMaintenanceOnceSchedule';

export class SessionMaintenanceProcessor implements IProcessor {
    public id: string;

    constructor(id: string) {
        this.id = id;
    }

    public async processor(jobContext: IJobContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {
        console.log('-----------------------------------JOB----------------------------');
        console.log(jobContext);

        const livechatRoom = await read.getRoomReader().getById(jobContext.sessionId) as ILivechatRoom;
        const { isOpen } = livechatRoom;

        if (!isOpen) {
            await modify.getScheduler().cancelJobByDataQuery({ sessionId: jobContext.sessionId });
            return;
        }

        const sessionMaintenanceInterval: string = await getAppSettingValue(read, AppSetting.DialogflowSessionMaintenanceInterval);
        const sessionMaintenanceEventName: string = await getAppSettingValue(read, AppSetting.DialogflowSessionMaintenanceEventName);

        if (!sessionMaintenanceEventName || !sessionMaintenanceInterval) {
            console.log('Session Maintenance Settings not configured');
            return;
        }

        try {
            const eventData = {
                name: sessionMaintenanceEventName,
                languageCode: LanguageCode.EN,
            };
            await Dialogflow.sendRequest(http, read, modify, jobContext.sessionId, eventData, DialogflowRequestType.EVENT);
        } catch (error) {
            // console.log(error);
        }

        await modify.getScheduler().scheduleOnce(new SessionMaintenanceOnceSchedule('session-maintenance', sessionMaintenanceInterval, {
            sessionId: jobContext.sessionId,
        }));

        return Promise.resolve(undefined);
    }
}
