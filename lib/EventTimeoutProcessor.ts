import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IJobContext, IProcessor } from '@rocket.chat/apps-engine/definition/scheduler';
import { DialogflowRequestType } from '../enum/Dialogflow';
import { createDialogflowMessage } from './Message';

export class EventScheduler implements IProcessor {
    public id: string;

    constructor(id: string) {
        this.id = id;
    }

    public async processor(jobContext: IJobContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {
        await createDialogflowMessage(jobContext.rid, read, modify, jobContext.response);
        return ;
    }
}
