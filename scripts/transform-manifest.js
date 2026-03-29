/**
 * Transforms the manifest.json file for the given browser.
 * @param {string} browser - The browser to transform the manifest.json for.
 * @returns {function} - A function that transforms the manifest.json file.
 */
function transform(browser) {
    /**
     * Transforms the manifest.json file for the given browser.
     * @param {Buffer} buffer - The buffer to transform.
     * @returns {string} - The transformed manifest.json file.
     */
    return (buffer) => {
        const manifest = JSON.parse(buffer.toString());

        transformObject(manifest, browser);

        return JSON.stringify(manifest, null, 2);
    };
}

const browserKeyPattern = /^__(.+?)__(.+)$/;

/**
 * Recursively traverses the object and transforms the browser-specific keys.
 * @param {object} obj - The object to transform.
 * @param {string} browser - The browser to transform the object for.
 */
function transformObject(obj, browser) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
        return;
    }

    const keysToProcess = Object.keys(obj);
    const keysToAdd = {};
    const keysToDelete = [];

    for (const key of keysToProcess) {
        const match = key.match(browserKeyPattern);
        if (match) {
            const [, keyBrowser, actualKey] = match;
            
            if (keyBrowser === browser) {
                keysToAdd[actualKey] = obj[key];
                keysToDelete.push(key);
            } else {
                keysToDelete.push(key);
            }
        } else {
            transformObject(obj[key], browser);
        }
    }

    for (const [newKey, value] of Object.entries(keysToAdd)) {
        obj[newKey] = value;
    }
    
    for (const keyToDelete of keysToDelete) {
        delete obj[keyToDelete];
    }
}

module.exports = {
    transform,
};
