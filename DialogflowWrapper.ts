import { createSign } from 'crypto';
import { base64urlEncode } from './helper';

export class DialogflowWrapper {

    private privateId: string;
    private privateKeyId: string;
    private clientEmail: string;
    private clientId: string;
    private privateKey: string;

    constructor(privateId: string, privateKeyId: string,
                clientEmail: string, clientId: string,
                privateKey: string) {
        this.privateId = privateId;
        this.privateKeyId = privateKeyId;
        this.clientEmail = clientEmail;
        this.clientId = clientId;
        this.privateKey = privateKey;
    }

    public getJWT() {
        // request format
        // {Base64url encoded header}.{Base64url encoded claim set}.{Base64url encoded signature}

        const header = this.getJWTHeader();
        const claimSet = this.getClaimSet();
        const signature = this.getSignature(header, claimSet);
        // combining all together to form jwt
        const jwt = header + '.' + claimSet + '.' + signature;
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
