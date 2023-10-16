import emojis from "../helpers/files/emojis.json";

export function getEmojisToReactWith(text: string): Array<string> {
    const lowerCaseText = text.toLowerCase();

    // search for each keyword in the text
    return findMatchingEmojiKeywords(lowerCaseText, emojis);
}

export function findMatchingEmojiKeywords(
    lowerCaseText: string,
    emojis: Record<string, string[]>
) {
    const matchingEmojis = new Set<string>();
    for (const emoji in emojis) {
        const keywords = emojis[emoji];
        for (const keyword of keywords) {
            if (lowerCaseText.includes(keyword)) {
                matchingEmojis.add(emoji);
            }
        }
    }
    return Array.from(matchingEmojis);
}
