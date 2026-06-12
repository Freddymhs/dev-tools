const os = require('os');
const path = require('path');

const base = () => process.env.DEV_TOOLS_OUTPUT_BASE || path.join(os.homedir(), 'Documents', 'dev-tools');

module.exports = {
  get CODE_RAW()          { return path.join(base(), 'code', '1_raw'); },
  get CODE_PARTS()        { return path.join(base(), 'code', '2_parts'); },
  get MEDIA_DOWNLOADS()   { return path.join(base(), 'media', '1_downloads'); },
  get MEDIA_PARTS()       { return path.join(base(), 'media', '2_parts'); },
  get MEDIA_TRANSCRIPTS() { return path.join(base(), 'media', '3_transcripts'); },
  get LAST_VIDEO()        { return path.join(base(), 'media', '.last_video'); },
};
