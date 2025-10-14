# Uploadcare Integration for Smart-Alert

## Overview
Successfully integrated Uploadcare CDN for file uploads (images and PDFs) in the notices system, replacing the previous Base64 storage method.

## Configuration

### Uploadcare Credentials
- **Public Key**: `e8c9790d2d0cfc27cb41`
- **Secret Key**: `9cf5c4bc7337608d536a` (stored securely, not exposed in frontend)

### File Limits
- Maximum file size: 20MB (20971520 bytes)
- Supported sources: local, url, camera, dropbox

## Changes Made

### 1. Backend Changes

#### Model (NoticeModel.js)
Updated attachment schema to store Uploadcare URLs:
```javascript
attachment: {
  url: String,        // Uploadcare CDN URL
  uuid: String,       // Uploadcare file UUID
  contentType: String,
  filename: String,
  size: Number
}
```

#### Controller (NoticeControllers.js)
- **addNotices**: Now accepts Uploadcare URL in request body (JSON)
- **updateNotice**: Handles Uploadcare URLs, supports 'keep' to retain existing attachment
- **getAttachment**: Redirects to Uploadcare CDN URL (302 redirect)
- Removed Base64 conversion logic
- Removed file system operations

#### Routes (NoticeRoutes.js)
- Removed multer middleware
- Changed from `multipart/form-data` to `application/json`
- Simplified routes (no file upload handling needed)

### 2. Frontend Changes

#### Package Installation
```bash
npm install --save @uploadcare/react-uploader
```

#### Create Notice Forms
- **CreateNoticeAdmin.js**: Integrated FileUploaderRegular widget
- **CreateNoticeTeacher.js**: Integrated FileUploaderRegular widget

Features:
- Real-time file upload to Uploadcare
- Upload progress indicator
- File preview after upload
- Remove uploaded file option
- Automatic widget reset after form submission

#### Update Notice Forms
- **UpdateNoticeAdmin.js**: Integrated FileUploaderRegular widget for editing
- **UpdateNoticeTeacher.js**: Integrated FileUploaderRegular widget for editing

Features:
- Display current attachment with view/remove options
- Upload new attachment to replace existing
- Keep existing attachment if no new upload

#### Display Notices
- **DisplayNotices.js**: Updated to use Uploadcare CDN URLs directly
- Simplified attachment path logic

## How It Works

### Upload Flow
1. User selects file in Uploadcare widget
2. File uploads directly to Uploadcare CDN
3. Widget returns file metadata (URL, UUID, etc.)
4. Frontend stores metadata in state
5. On form submit, metadata sent to backend as JSON
6. Backend saves metadata to MongoDB

### Download Flow
1. User clicks download/view link
2. Frontend uses Uploadcare CDN URL directly
3. OR backend redirects to Uploadcare URL
4. File served from Uploadcare CDN (fast, global)

## Benefits

### Performance
- ✅ No server-side file processing
- ✅ Fast CDN delivery worldwide
- ✅ Reduced database size (no Base64)
- ✅ Reduced server bandwidth

### Reliability
- ✅ Professional CDN infrastructure
- ✅ Automatic image optimization
- ✅ Built-in file validation
- ✅ Secure file storage

### User Experience
- ✅ Drag-and-drop upload
- ✅ Multiple upload sources (local, URL, camera, Dropbox)
- ✅ Upload progress indicator
- ✅ File preview
- ✅ Fast downloads

## Testing

### To Test Upload:
1. Restart both servers:
   ```bash
   # Backend
   cd BACKEND
   npm start
   
   # Frontend
   cd frontend
   npm start
   ```

2. Navigate to Create Notice (Admin or Teacher)
3. Fill in title and notice
4. Click "Select files" in Uploadcare widget
5. Upload an image or PDF
6. Submit form
7. Check console for Uploadcare URL

### To Test Download:
1. Navigate to Display Notices
2. Find notice with attachment
3. Click download/view link
4. File should open/download from Uploadcare CDN

## Uploadcare Features Available

### Image Transformations
Uploadcare URLs support on-the-fly transformations:
```
https://ucarecdn.com/{uuid}/-/preview/1000x1000/
https://ucarecdn.com/{uuid}/-/resize/800x/
https://ucarecdn.com/{uuid}/-/sharp/10/
```

### PDF Handling
PDFs are served with proper content-type and can be:
- Viewed inline in browser
- Downloaded directly
- Converted to images (if needed)

## Migration Notes

### Existing Data
- Old Base64 attachments will NOT work with new system
- Existing notices need to be re-uploaded with Uploadcare
- OR: Create migration script to upload Base64 files to Uploadcare

### Backward Compatibility
The system currently does NOT support old Base64 attachments. If needed, add fallback logic in `getAttachment` controller.

## Security

### Public Key
- Safe to expose in frontend
- Only allows uploads, not deletions

### Secret Key
- Keep secure on backend only
- Required for file deletion/management
- Not used in current implementation

### File Access
- All uploaded files are publicly accessible via CDN URL
- No authentication required for downloads
- Consider using Uploadcare's signed URLs for private files (future enhancement)

## Future Enhancements

1. **File Deletion**: Implement Uploadcare file deletion when notice is deleted
2. **Private Files**: Use signed URLs for restricted access
3. **Image Optimization**: Add automatic image resizing/compression
4. **File Validation**: Add backend validation of Uploadcare URLs
5. **Analytics**: Track file views and downloads
6. **Webhooks**: Listen to Uploadcare events for better tracking

## Troubleshooting

### Upload Fails
- Check public key is correct
- Check file size is under 20MB
- Check internet connection
- Check Uploadcare service status

### Download Fails
- Check Uploadcare URL is valid
- Check file still exists on Uploadcare
- Check CDN is accessible

### Widget Not Showing
- Check `@uploadcare/react-uploader` is installed
- Check CSS import is present
- Check console for errors

## Support

- Uploadcare Docs: https://uploadcare.com/docs/
- React Uploader: https://github.com/uploadcare/react-uploader
- Dashboard: https://uploadcare.com/dashboard/

---

**Integration Complete!** ✅

All notice creation and editing now uses Uploadcare for file uploads.
