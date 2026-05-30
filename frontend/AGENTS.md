<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:security-notes -->
# Security Notes

## JWT Storage

This project stores JWT access tokens in `localStorage`. This is a known security trade-off:

- **Vulnerability**: XSS attacks can steal the token
- **Mitigation**: The app uses `Content-Security-Policy` headers and sanitizes all user input
- **Recommendation**: If you control the backend, migrate to `httpOnly` cookies for production

## API Error Handling

All API errors go through the `ApiError` class in `lib/api.ts` which includes HTTP status codes. 401 responses automatically clear the token and redirect to login.
<!-- END:security-notes -->
