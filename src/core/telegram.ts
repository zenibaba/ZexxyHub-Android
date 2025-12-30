export const sendTelegramMessage = async (botToken: string, chatId: string, message: string): Promise<boolean> => {
    if (!botToken || !chatId) return false;
    try {
        console.log(`Sending Telegram Alert to CHAT ${chatId}`);
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        return response.ok;
    } catch (e) {
        console.error("Telegram Send Error", e);
        return false;
    }
};

export const formatAccountForTelegram = (acc: any, rarity: number) => {
    return `🚨 *RARE ACCOUNT FOUND* 🚨\n\n` +
           `🔰 *Rarity Score:* ${rarity}\n` +
           `🆔 *ID:* \`${acc.account_id}\`\n` +
           `👤 *Name:* ${acc.name}\n` +
           `🌍 *Region:* ${acc.region}\n` +
           `🔑 *Pass:* \`${acc.password}\`\n` +
           `🎟 *Token:* \`${acc.jwt_token}\``;
};
