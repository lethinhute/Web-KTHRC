const app = require('./server');
const { startSync } = require('./src/modules/syncService');

const PORT = process.env.PORT || 5000;
const enableExternalSync = process.env.ENABLE_EXTERNAL_SYNC === 'true';

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);

    if (enableExternalSync) {
        startSync();
    } else {
        console.log('[syncService] External sync disabled');
    }
});




