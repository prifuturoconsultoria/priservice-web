# Email Configuration Setup

This application uses Resend for sending approval emails via Supabase Edge Functions.

## Setup Instructions

### 1. Create a Resend Account
1. Go to https://resend.com and sign up
2. Verify your domain or use the provided resend.dev domain for testing
3. Get your API key from the dashboard

### 2. Configure Supabase Environment Variables
In your Supabase project dashboard, go to Settings > Edge Functions and add these environment variables:

```
RESEND_API_KEY=re_xxxxxxxxx (your Resend API key)
FROM_EMAIL=noreply@yourdomain.com (verified email address)
SITE_URL=https://yourapp.com (your application URL)
```

### 3. Deploy the Edge Function
Install Supabase CLI and deploy the function:

```bash
npm install -g supabase
supabase login
supabase functions deploy send-approval-email
```

### 4. Test Email Functionality
- Create a new service sheet
- Check the Supabase Edge Function logs to see if emails are being sent
- Without RESEND_API_KEY, emails will be simulated (logged to console)
- With RESEND_API_KEY, real emails will be sent via Resend

## Email Features

### ✅ HTML Email Template
- Professional responsive design
- Service sheet details clearly displayed
- Prominent approval/rejection button
- Fallback text version included

### ✅ Automatic Sending
- Triggered when new service sheet is created
- Includes approval token for secure access
- Error handling and logging

### ✅ Fallback Mode
- Works without API key (simulation mode)
- Logs approval URLs to console for testing
- Graceful degradation

## Troubleshooting

### Common Issues:
1. **Emails not sending**: Check RESEND_API_KEY is set correctly
2. **Domain verification**: Use resend.dev domain for testing
3. **Function logs**: Check Supabase dashboard for error details
4. **CORS issues**: Ensure proper headers in edge function

### Testing:
- Use a test email address
- Check spam folder
- Monitor Supabase function logs
- Verify environment variables are set

## Security Notes
- Approval tokens are UUIDs for security
- Edge function validates required fields
- Email content is escaped to prevent injection
- API keys are stored securely in Supabase environment