import { IHttp, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { AppSetting } from '../config/Settings';
import { DialogflowAuth } from '../lib/Dialogflow/DialogflowAuth';
import { getAppSettingValue } from '../lib/Settings';

export class OnSettingUpdatedHandler {
    constructor(private readonly app: IApp, private readonly read: IRead, private readonly http: IHttp) {}

    public async run() {
        const clientEmail: string = await getAppSettingValue(this.read, AppSetting.DialogflowClientEmail);
        const privateKey: string = await getAppSettingValue(this.read, AppSetting.DialogFlowPrivateKey);

        if (clientEmail.length === 0 || privateKey.length === 0) {
            this.app.getLogger().error('Client Email or Private Key Field cannot be empty');
            return;
        }

        try {
            new DialogflowAuth(clientEmail, privateKey).getAccessToken(this.http);
            this.app.getLogger().info('------------------ Google Credentials validation Success ----------------');
        } catch (error) {
            this.app.getLogger().error(error.message);
        }
    }
}
