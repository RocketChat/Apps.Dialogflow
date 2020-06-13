import { IHttp, IHttpRequest, ILogger, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { getAppSetting } from '../helper';
import { AppSettingId } from '../AppSettings';

// A helper class to interact with RocketChat's REST API
export class RocketChatSDK {

    constructor(private http: IHttp, private read: IRead, private logger: ILogger) { }

    /**
     *
     * @param rid {string}
     * @param visitorToken {string}
     *
     */
    public async closeChat(rid: string, visitorToken: string) {
        const httpRequest: IHttpRequest = this.buildHttpRequest({ rid, token: visitorToken });
        const RocketChatServerUrl = await this.getServerUrl();

        await this.http.post(`${RocketChatServerUrl}/api/v1/livechat/room.close`, httpRequest)
            .then(() => {
                this.logger.info('Closed Livechat room with Room id ' + rid);
            })
            .catch((error) => {
                this.logger.error(error);
                throw Error('Error: Error occured while using Rocket.Chat Rest Api. See App Logs for more detail');
            });
    }

    private buildHttpRequest(data: any): IHttpRequest {
        return {
            headers: {
                'Content-Type': 'application/json',
            },
            data: {
                ...data,
            },
        };
    }

    private async getServerUrl() {
        const RocketChatServerUrl: string = await getAppSetting(this.read, AppSettingId.RocketChatServerURL);
        if (!RocketChatServerUrl.startsWith('http')) {
            throw Error('Error: Invalid Rocket Chat Server URL');
        }
        return RocketChatServerUrl;
    }

}
