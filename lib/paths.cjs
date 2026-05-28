const os = require('os');
const path = require('path');

const BASE = process.env.DEV_TOOLS_OUTPUT_BASE || path.join(os.homedir(), 'Documents', 'dev-tools');

module.exports = {
  CODE_RAW:          path.join(BASE, 'code', '1_raw'),
  CODE_PARTS:        path.join(BASE, 'code', '2_parts'),
  MEDIA_DOWNLOADS:   path.join(BASE, 'media', '1_downloads'),
  MEDIA_PARTS:       path.join(BASE, 'media', '2_parts'),
  MEDIA_TRANSCRIPTS: path.join(BASE, 'media', '3_transcripts'),
  LAST_VIDEO:        path.join(BASE, 'media', '.last_video'),
};
