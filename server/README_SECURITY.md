# Security Guidelines

Never commit `.env` files to the repository. Use `.env.example` as a template.

Required environment variables:

```
MONGODB_USERNAME=your_username
MONGODB_PASSWORD=your_password
MONGODB_HOST=your_host
MONGODB_PORT=27017
MONGODB_DB=dashboard
MONGODB_AUTH_SOURCE=admin
```

For production, use environment variables provided by your hosting platform (e.g., Vercel environment variables).
