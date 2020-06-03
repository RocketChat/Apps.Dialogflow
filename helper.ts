export const base64urlEncode = (str: any) => {
    const utf8str = unescape(encodeURIComponent(str));
    const b64u = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';   // base64url dictionary
    const b64pad = '=';
    return base64EncodeData(utf8str, utf8str.length, b64u, b64pad);
};

export const base64EncodeData = (data: string, len: number, b64x: string, b64pad: string) => {
    let dst = '';
    let i: number;

    // tslint:disable:no-bitwise
    for (i = 0; i <= len - 3; i += 3) {

        dst += b64x.charAt(data.charCodeAt(i) >>> 2);
        dst += b64x.charAt(((data.charCodeAt(i) & 3) << 4) | (data.charCodeAt(i + 1) >>> 4));
        dst += b64x.charAt(((data.charCodeAt(i + 1) & 15) << 2) | (data.charCodeAt(i + 2) >>> 6));
        dst += b64x.charAt(data.charCodeAt(i + 2) & 63);

    }

    if (len % 3 === 2) {
        dst += b64x.charAt(data.charCodeAt(i) >>> 2);
        dst += b64x.charAt(((data.charCodeAt(i) & 3) << 4) | (data.charCodeAt(i + 1) >>> 4));
        dst += b64x.charAt(((data.charCodeAt(i + 1) & 15) << 2));
        dst += b64pad;
    } else if (len % 3 === 1) {
        dst += b64x.charAt(data.charCodeAt(i) >>> 2);
        dst += b64x.charAt(((data.charCodeAt(i) & 3) << 4));
        dst += b64pad;
        dst += b64pad;
    }
    // tslint:enable:no-bitwise

    return dst;
};
