import { HttpStatusCode, IHttp, IHttpRequest, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import { AppPersistence } from '../lib/persistence';

export class WebhookEndpoint extends ApiEndpoint {
    public path = '/webhook';

    public async post(request: IApiRequest,
                      endpoint: IApiEndpointInfo,
                      read: IRead,
                      modify: IModify,
                      http: IHttp,
                      persis: IPersistence): Promise<IApiResponse> {
        console.log(request.content);
        try {
            console.log('---Content ---', request.content);
            // const responseJSON = JSON.parse((request.content || '{}'));
            const persistence = new AppPersistence(persis, read.getPersistenceReader());
            const session: string = request.content.session.split('/').pop();

            const detectedIntent: string = request.content.queryResult.intent.displayName;

            switch (detectedIntent) {
                case 'transfer_to_liveagent':
                    console.log('----------------- Transfer to Liveagent Request recieved ----------------------------');
                    break;
                case 'close_chat':
                    await this.closeChat(persistence, http, session);
                    break;
            }
        } catch (error) {
            console.log('----error----', error);
        }
        return {
            status: HttpStatusCode.OK,
            headers: {
                'Content-Type': 'application/json',
            },
            content: {

            },
        };
    }

    private async closeChat(persistence: AppPersistence, http: IHttp, session: string) {
        const result = (await persistence.getConnectedRoomId(session)) as any;
        console.log('----------- Result in webhook--------', result);
        if (result) {
            const roomId = result.roomId;
            const visitorToken = result.sessionId;
            console.log('-----------Room id from webhook--------', roomId);
            console.log('-----------Visitor token from webhook--------', visitorToken);
            const requestContent: IHttpRequest = {
                headers: {
                    'Content-Type': 'application/json',
                },
                data: {

                        rid: roomId,
                        token: visitorToken,
                },
            };
            // TODO: Change URL here - Possibly look at the endpoint variable or define a setting
            await http.post('https://1a97f6b85cde.ngrok.io/api/v1/livechat/room.close', requestContent)
                .then((response) => {
                    console.log('-----------close request----------', response);
                })
                .catch((error) => {
                    console.log('-----------close request error----------', error);
                });
        }
    }
}
