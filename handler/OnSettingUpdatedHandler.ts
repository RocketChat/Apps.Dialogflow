import { IHttp, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { AppSetting } from '../config/Settings';
import { Logs } from '../enum/Logs';
import { Dialogflow } from '../lib/Dialogflow';
import { getAppSettingValue } from '../lib/Settings';

export class OnSettingUpdatedHandler {
	constructor(
		private readonly app: IApp,
		private readonly read: IRead,
		private readonly http: IHttp,
	) {}

	public async run() {
		const clientEmail: string = await getAppSettingValue(
			this.read,
			AppSetting.DialogflowClientEmail,
		);
		const privateKey: string = await getAppSettingValue(
			this.read,
			AppSetting.DialogFlowPrivateKey,
		);

		if (clientEmail.length === 0 || privateKey.length === 0) {
			this.app
				.getLogger()
				.error(Logs.EMPTY_CLIENT_EMAIL_OR_PRIVATE_KEY_SETTING);
			return;
		}

		try {
			await Dialogflow.generateNewAccessToken(
				this.http,
				clientEmail,
				privateKey,
			);
			this.app.getLogger().info(Logs.GOOGLE_AUTH_SUCCESS);
		} catch (error) {
			this.app.getLogger().error(error);
		}
	}
}
