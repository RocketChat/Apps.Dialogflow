import { IHttp, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { AppSettingId } from '../AppSettings';
import { DialogflowWrapper } from '../DialogflowWrapper';
import { getAppSetting } from '../helper';

export class OnSettingUpdatedHandler {
    constructor(private app: IApp, private read: IRead, private http: IHttp) {}

    public async run() {
        const clientEmail: string = await getAppSetting(this.read, AppSettingId.DialogflowClientEmail);
        const privateKey: string = await getAppSetting(this.read, AppSettingId.DialogFlowPrivateKey);

        if (clientEmail.length === 0 || privateKey.length === 0) {
            this.app.getLogger().error('Client Email or Private Key Field cannot be empty');
            return;
        }

        const dialogflowWrapper: DialogflowWrapper = new DialogflowWrapper(clientEmail, privateKey);

        try {
            const accessToken = dialogflowWrapper.getAccessToken(this.http);
            this.app.getLogger().info('------------------ Google Credentials validation Success ----------------');
        } catch (error) {
            this.app.getLogger().error(error.message);
        }
    }
}
