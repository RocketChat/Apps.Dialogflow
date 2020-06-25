import { ILivechatEventContext, ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';

import { IHttp, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { AppSetting } from '../config/Settings';
import { Persistence } from '../lib/persistence';
import { getAppSettingValue } from '../lib/Settings';

export class PostLivechatAgentAssignedHandler {
    constructor(private readonly context: ILivechatEventContext,
                private readonly read: IRead,
                private readonly http: IHttp,
                private readonly persis: IPersistence) {}

    public async run() {
        const SettingBotUsername: string = await getAppSettingValue(this.read, AppSetting.DialogflowBotUsername);
        if (SettingBotUsername !== this.context.agent.username) {
            return;
        }
        await this.saveVisitorSession();
    }

    /**
     *
     * @description - save visitor.token and session id.
     *   - This will provide a mapping between visitor.token n session id.
     *   - This is required for implementing `perform-handover` webhooks since it requires a Visitor object
     *     which can be obtained from using visitor.token we save here in Persistant storage
     */
    private async saveVisitorSession() {
        const lroom = this.context.room as ILivechatRoom;
        if (!lroom) { throw new Error('Error!! Could not create session. room object is undefined'); }

        // session Id for Dialogflow will be the same as Room Id
        const { id: sessionId, visitor: { token: visitorToken } } = lroom;
        await Persistence.connectVisitorTokenToSessionId(this.persis, sessionId, visitorToken);
    }
}
