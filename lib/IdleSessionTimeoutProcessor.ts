import { IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat/ILivechatRoom';
import { IJobContext, IProcessor } from '@rocket.chat/apps-engine/definition/scheduler';
import { DialogflowRequestType, IDialogflowMessage } from '../enum/Dialogflow';
import { removeBotTypingListener } from './BotTyping';
import { Dialogflow } from './Dialogflow';
import { createDialogflowMessage } from './Message';
import { handlePayloadActions } from './payloadAction';
import { resetFallbackIntent } from './SynchronousHandover';

export class IdleSessionTimeoutProcessor implements IProcessor {
    public id: string;

    constructor(id: string) {
        this.id = id;
    }

    public async processor(jobContext: IJobContext, read: IRead, modify: IModify, http: IHttp, persis: IPersistence): Promise<void> {

        const event = { name: 'Close_Session', languageCode: 'en', parameters: {} };
        const response: IDialogflowMessage = await Dialogflow.sendRequest(http,
            read,
            modify,
            persis,
            jobContext.rid,
            event,
            DialogflowRequestType.EVENT);

        const createResponseMessage = async () => await createDialogflowMessage(jobContext.rid, read, modify, response);

        await createResponseMessage();

        await removeBotTypingListener(jobContext.rid);

        const room = await read.getRoomReader().getById(jobContext.rid);
        const { visitor: { token: visitorToken } } = room as ILivechatRoom;

        handlePayloadActions(read, modify, http, persis, jobContext.rid, visitorToken, response);

        return resetFallbackIntent(read, modify, jobContext.rid);
    }
}
