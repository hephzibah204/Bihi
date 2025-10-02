// This file could contain a non-AI based fallback for generating comments or other content.

export const generateFallbackComment = (studentName: string, performance: string): string => {
    if (performance.toLowerCase().includes('excellent')) {
        return `${studentName} is doing an excellent job. Keep up the great work!`;
    }
    if (performance.toLowerCase().includes('struggles')) {
        return `${studentName} is showing potential but needs to focus more on areas of difficulty.`;
    }
    return `${studentName} is making steady progress in class.`;
};
