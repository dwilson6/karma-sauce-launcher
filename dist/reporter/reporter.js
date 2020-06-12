"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaucelabsReporter = void 0;
const saucelabs_1 = require("saucelabs");
/**
 * Karma browser reported that updates corresponding Saucelabs jobs whenever a given
 * browser finishes.
 */
function SaucelabsReporter(logger, browserMap) {
    const log = logger.create('reporter.sauce');
    let pendingUpdates = [];
    // This fires whenever any browser completes. This is when we want to report results
    // to the Saucelabs API, so that people can create coverage banners for their project.
    this.onBrowserComplete = function (browser) {
        const result = browser.lastResult;
        const browserId = browser.id;
        if (result.disconnected) {
            log.error('✖ Browser disconnected');
        }
        if (result.error) {
            log.error('✖ Tests errored');
        }
        const browserData = browserMap.get(browserId);
        // Do nothing if the current browser has not been launched through the Saucelabs
        // launcher.
        if (!browserData) {
            return;
        }
        const { sessionId } = browserData;
        const api = new saucelabs_1.default({
            user: browserData.username,
            key: browserData.accessKey,
            region: browserData.region,
            headless: browserData.headless
        });
        const hasPassed = !result.failed && !result.error && !result.disconnected;
        // Update the job by reporting the test results. Also we need to store the promise here
        // because in case "onExit" is being called, we want to wait for the API calls to finish.
        pendingUpdates.push(api.updateJob(browserData.username, sessionId, {
            id: sessionId,
            passed: hasPassed,
            'custom-data': result
        }));
    };
    // Whenever this method is being called, we just need to wait for all API calls to finish,
    // and then we can notify Karma about proceeding with the exit.
    this.onExit = (doneFn) => Promise.all(pendingUpdates).then(doneFn, (error) => {
        log.error('Could not report results to Saucelabs: %s', error);
        doneFn();
    });
}
exports.SaucelabsReporter = SaucelabsReporter;
//# sourceMappingURL=reporter.js.map