import { ILivechatEventContext, ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';

import { IHttp, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { AppSetting } from '../config/Settings';
import { Persistence } from '../lib/Persistence';
import { getAppSettingValue } from '../lib/Settings';

export class PostLivechatAgentAssignedHandler {
    constructor(private readonly context: ILivechatEventContext,
                private readonly read: IRead,
                private readonly http: IHttp,
                private readonly persis: IPersistence) {}

    public async run() {
        const SettingBotUsername: string = await getAppSettingValue(this.read, AppSetting.DialogflowBotUsername);
        const { agent, room: { id: rid, visitor: { token: visitorToken } } } = this.context;
        if (SettingBotUsername !== agent.username) {
            return;
        }
        await this.saveVisitorSession(rid, visitorToken);
    }

    /**
     *
     * @description - save visitor.token and session id.
     *   - This will provide a mapping between visitor.token n session id.
     *   - This is required for implementing `perform-handover` webhooks since it requires a Visitor object
     *     which can be obtained from using visitor.token we save here in Persistant storage
     *   - Note: Session Id is the same as Room Id
     */
    private async saveVisitorSession(sessionId, visitorToken) {
        await Persistence.connectVisitorTokenToSessionId(this.persis, sessionId, visitorToken);
    }
}
