Cloudinary unsigned upload setup and local testing

What you must do before testing the registration flow:

1) Create a Cloudinary account (https://cloudinary.com/) if you don't have one.
2) In the Cloudinary Dashboard, note your cloud name.
3) Create an unsigned upload preset:
   - Go to Settings -> Upload -> Upload presets
   - Add a new upload preset and set 'Signing mode' to 'Unsigned'
   - Optionally set folder, transformations, size limits, and allowed formats
   - Save and note the preset name

4) Edit `register.html` and replace the placeholders at the top of the page:
   RegisterApp.CLOUDINARY_CLOUD_NAME = 'your_cloud_name_here';
   RegisterApp.CLOUDINARY_UPLOAD_PRESET = 'your_upload_preset_here';

5) Start your local server (XAMPP) and open http://localhost/<path-to-register.html>
   (Your workspace root is c:/xampp/htdocs/public, so use http://localhost/register.html)

6) Test the registration flow:
   - Fill the form and select a profile image (small JPEG/PNG)
   - When you submit the form, the browser will attempt to upload to Cloudinary first
   - Watch the Network tab to confirm a POST to `https://api.cloudinary.com/v1_1/<cloud-name>/upload`
   - On success, the returned `secure_url` will be included in the user registration data
   - Verify Firestore (user document) contains `profileImageUrl` with the Cloudinary URL

Troubleshooting:
- If upload fails with CORS or 401 errors, confirm your preset is actually unsigned.
- If you prefer server-side uploads for security, implement a server endpoint to accept the file and upload to Cloudinary with a signed request, then update `ns.uploadProfileImage` to POST to your endpoint instead.
- For production, consider restrictions on allowed file types and size, and add client-side validation and resizing to reduce upload size.

Security note:
- Unsigned uploads let any client upload to your Cloudinary account within the preset's restrictions. Keep presets restricted (allowed formats, maximum file size, destination folder) and monitor usage. For strict control, use signed server-side uploads.
