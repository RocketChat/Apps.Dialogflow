const rooms = {};

export async function botTypingListener(rid: string, callback: any) {
    if (rooms[rid]) {
        (await rooms[rid])();
    }
    rooms[rid] = callback;
}

export async function removeBotTypingListener(rid: string) {
    if (rooms[rid]) {
        (await rooms[rid])();
        delete rooms[rid];
    }
}
