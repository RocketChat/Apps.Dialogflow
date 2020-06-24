import { IHttp, IHttpRequest } from '@rocket.chat/apps-engine/definition/accessors';
import { createSign } from 'crypto';
import { IDialogflowAccessToken } from '../../definition/IDialogflowAccessToken';
import { base64urlEncode } from '../helper';

export class DialogflowAuth {

    private clientEmail: string;
    private privateKey: string;
    private jwtExpiration: Date;

    constructor(clientEmail: string, privateKey: string) {
        this.clientEmail = clientEmail;
        this.privateKey = privateKey.trim().replace(/\\n/gm, '\n');
    }

    public async getAccessToken(http: IHttp): Promise<IDialogflowAccessToken> {

        const authUrl = 'https://oauth2.googleapis.com/token';

        const jwt = this.getJWT();

        const httpRequestContent: IHttpRequest = {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            content: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
        };

        try {
            const response = await http.post(authUrl, httpRequestContent);

            const responseJSON = JSON.parse((response.content || '{}'));

            if (responseJSON.access_token) {
                const token = responseJSON.access_token;
                const accessToken: IDialogflowAccessToken = {
                    token,
                    expiration: this.jwtExpiration,
                };
                return accessToken;
            } else {
                if (responseJSON.error) {
                    throw Error(`\
                    ---------------------Error with Google Credentials-------------------\
                    Details:- \
                        Error Message:- ${responseJSON.error} \
                        Error Description:- ${responseJSON.error_description}`);
                }
                throw Error('Error retrieving access token');
            }

        } catch (error) {
            throw Error(error);
        }
    }

    public getAccessTokenExpiration(): Date {
        return this.jwtExpiration;
    }

    private getJWT() {
        // request format
        // {Base64url encoded header}.{Base64url encoded claim set}.{Base64url encoded signature}

        const header = this.getJWTHeader();
        const claimSet = this.getClaimSet();
        const signature = this.getSignature(header, claimSet);
        // combining all together to form jwt
        const jwt = `${ header }.${ claimSet }.${ signature }`;
        return jwt;
    }

    // Forming the JWT header
    private getJWTHeader() {
        const jwtHeader = '{"alg":"RS256","typ":"JWT"}';
        const b64uHeader = base64urlEncode(jwtHeader);
        return b64uHeader;
    }

    // Forming the jwt claim set
    private getClaimSet() {

        let currentUnixTime = Date.now();
        const hourInc = 1000 * 60 * 30; // an hour
        let oneHourInFuture = currentUnixTime + hourInc;
        // record the expiration date-time
        this.jwtExpiration = new Date(oneHourInFuture);

        // convert milliseconds to seconds
        currentUnixTime = Math.round(currentUnixTime / 1000);
        oneHourInFuture = Math.round(oneHourInFuture / 1000);

        const jwtClaimSet = `{\
            "iss": "${this.clientEmail}",\
            "scope": "https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/dialogflow",\
            "aud": "https://oauth2.googleapis.com/token",\
            "exp": ${oneHourInFuture},\
            "iat": ${currentUnixTime}\
          }`;
        const b64uClaimSet = base64urlEncode(jwtClaimSet);
        return b64uClaimSet;
    }

    private getSignature(b64uHeader: string, b64uClaimSetclaimset: string) {
        const signatureInput = b64uHeader + '.' + b64uClaimSetclaimset;
        const sign = createSign('SHA256');
        sign.update(signatureInput);
        const signaturebase64 = sign.sign(this.privateKey, 'base64');
        // replace + with -    |    / with _
        let b64uSignature = signaturebase64.replace(/\+/g, '-');
        b64uSignature = b64uSignature.replace(/\//g, '_');
        return b64uSignature;
    }

}
