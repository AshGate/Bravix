export default {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`🤖 Bot connecté en tant que ${client.user.tag}!`);
        client.user.setPresence({
            activities: [{
                name: 'les tickets | /ticket',
                type: 3 // WATCHING
            }],
            status: 'online'
        });
    }
};