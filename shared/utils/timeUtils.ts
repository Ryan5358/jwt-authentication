export function toLocalTime(timestamp: number = (Date.now() / 1000)) {
    const datetime = new Date(timestamp * 1000);
    return datetime.toLocaleString(undefined, {
        timeZoneName: 'short'
    }).replace(/am|pm/i, (match) => match.toUpperCase());
}