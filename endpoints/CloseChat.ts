import { HttpStatusCode, IHttp, IHttpRequest, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import { AppPersistence } from '../lib/persistence';
import { RocketChatSDK } from '../lib/RocketChatSDK';

/**
 *
 * Description: Endpoint to close a chat
 *
 * Input: Session Id from Dialogflow (required)
 *
 * Input Format Type: JSON
 *
 * Input Format: {
 *      sessionId: { The Session Id },
 * }
 *
 * Output: {
 *      result: { Result of operation. Success or Error },
 * }
 */
export class CloseChat extends ApiEndpoint {
    public path = 'close-chat';

    public async post(request: IApiRequest,
                      endpoint: IApiEndpointInfo,
                      read: IRead,
                      modify: IModify,
                      http: IHttp,
                      persis: IPersistence): Promise<IApiResponse> {
        this.app.getLogger().info('Request recieved to close chat');

        const sessionId = request.content.sessionId;
        if (!sessionId) { return this.sendResponse(HttpStatusCode.BAD_REQUEST, 'Error: Session Id not present in request'); }

        try {
            await this.processCloseChatRequest(persis, read, http, sessionId);
            this.app.getLogger().info('Close chat request handled successfully');
            return this.sendResponse(HttpStatusCode.OK, 'Success');
        } catch (error) {
            this.app.getLogger().error('Error occured while processing close-chat. Details:- ', error);
            return this.sendResponse(HttpStatusCode.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    private async processCloseChatRequest(persis: IPersistence, read: IRead, http: IHttp, sessionId: string) {
        const persistence = new AppPersistence(persis, read.getPersistenceReader());
        const serverSDK: RocketChatSDK = new RocketChatSDK(http, read, this.app.getLogger());

        const roomId = await persistence.getConnectedRoomId(sessionId);
        const visitorToken = sessionId;     // Visitor token is the same as sessionId
        if (!roomId) { throw Error('Session Id not found in database'); }

        serverSDK.closeChat(roomId, visitorToken);
    }

    private sendResponse(status: HttpStatusCode, result: string): IApiResponse {
        return {
            status,
            headers: {
                'Content-Type': 'application/json',
            },
            content: {
                result,
            },
        };
    }
}
