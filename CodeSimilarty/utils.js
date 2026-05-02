

// 1. clean code
export const cleanCode = (code) => {
    return code
        .replace(/\/\/.*|\/\*[\s\S]*?\*\//g,"") 
        .replace(/\s+/g, " ") 
        .trim()
        .toLowerCase();
};

// 2. Levenshtein
export const getLevenshtein = (a, b) => {
    const matrix = [];
    for (let i = 0; i <= a.length; i++) matrix[i] = [i];
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    const distance = matrix[a.length][b.length];
    const maxLen = Math.max(a.length, b.length);
    return maxLen === 0 ? 100 : (1 - distance / maxLen) * 100;
};

// 3. Jaccard
export const getJaccard = (code1, code2) => {
    const tokens1 = new Set(code1.split(" "));
    const tokens2 = new Set(code2.split(" "));
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    return union.size === 0 ? 100 : (intersection.size / union.size) * 100;
};

// 4. Cosine Similarity
export const getCosine = (code1, code2) => {
    const tokenize = (text) => text.split(" ");
    const f1 = {}, f2 = {};
    tokenize(code1).forEach(t => f1[t] = (f1[t] || 0) + 1);
    tokenize(code2).forEach(t => f2[t] = (f2[t] || 0) + 1);

    const allWords = new Set([...Object.keys(f1), ...Object.keys(f2)]);
    let dot = 0, m1 = 0, m2 = 0;

    allWords.forEach(w => {
        const v1 = f1[w] || 0;
        const v2 = f2[w] || 0;
        dot += v1 * v2;
        m1 += v1 * v1;
        m2 += v2 * v2;
    });

    const magnitude = Math.sqrt(m1) * Math.sqrt(m2);
    return magnitude === 0 ? 100 : (dot / magnitude) * 100;
};