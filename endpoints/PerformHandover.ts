import { HttpStatusCode, IHttp, IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ApiEndpoint, IApiEndpointInfo, IApiRequest, IApiResponse } from '@rocket.chat/apps-engine/definition/api';
import { AppPersistence } from '../lib/persistence';
import { RocketChatSDK } from '../lib/RocketChatSDK';

/**
 *
 * Description: Endpoint to perform a handover asynchronously
 *
 * Input:
 *      1. Session Id from Dialogflow (required)
 *      2. Name of the Target Department (required)
 *
 * Input Format Type: JSON
 *
 * Input Format: {
 *      sessionId: { The Session Id },
 *      targetDepartmentName: { Name of the Target Department }
 * }
 *
 * Output: {
 *      result: { Result of operation. Success or Error },
 * }
 */
export class PerformHandover extends ApiEndpoint {
    public path = 'perform-handover';

    public async post(request: IApiRequest,
                      endpoint: IApiEndpointInfo,
                      read: IRead,
                      modify: IModify,
                      http: IHttp,
                      persis: IPersistence): Promise<IApiResponse> {
        this.app.getLogger().info('Request recieved to close chat');

        const sessionId = request.content.sessionId;
        if (!sessionId) { return this.sendResponse(HttpStatusCode.BAD_REQUEST, 'Error: Session Id not present in request'); }
        const targetDepartmentName: string = request.content.targetDepartmentName;
        if (!targetDepartmentName) { return this.sendResponse(HttpStatusCode.BAD_REQUEST, 'Error: Target Department not present in request'); }

        try {
            await this.processHandoverRequest(read, modify, persis, sessionId, targetDepartmentName);
            this.app.getLogger().info('Perform Handover request handled successfully');
            return this.sendResponse(HttpStatusCode.OK, 'Success');
        } catch (error) {
            this.app.getLogger().error('Error occured while processing close-chat. Details:- ', error);
            return this.sendResponse(HttpStatusCode.INTERNAL_SERVER_ERROR, error.message);
        }
    }

    private async processHandoverRequest(read: IRead, modify: IModify, persis: IPersistence, sessionId: string, targetDepartmentName: string) {
        const persistence = new AppPersistence(persis, read.getPersistenceReader());
        const serverSDK: RocketChatSDK = new RocketChatSDK(modify, read);

        const visitorToken: string = (await persistence.getConnectedVisitorToken(sessionId)) as string;
        if (!visitorToken) { throw Error('Error: No Token found for sessionId. Session Id must be invalid'); }

        const roomId: string = sessionId;       // Session Id from Dialogflow will be the same as Room id

        await serverSDK.performHandover(roomId, visitorToken, targetDepartmentName);
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
