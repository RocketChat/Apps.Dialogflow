import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { RocketChatAssociationModel, RocketChatAssociationRecord } from '@rocket.chat/apps-engine/definition/metadata';
import { IJobContext, IProcessor } from '@rocket.chat/apps-engine/definition/scheduler';
import { closeChat } from './Room';
import { resetFallbackIntent } from './SynchronousHandover';

export class IdleSessionTimeoutProcessor implements IProcessor {
    public id: string;

    constructor(id: string) {
        this.id = id;
    }

    public async processor(jobContext: IJobContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {

        await closeChat(modify, read, jobContext.rid, persis);

        return resetFallbackIntent(read, modify, jobContext.rid);
    }
}
