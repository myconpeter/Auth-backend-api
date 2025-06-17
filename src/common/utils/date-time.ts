export const thirtyDaysFromNow = (): Date => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

export const fortyMinutesFromNow=():Date => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 45)
    return now
}