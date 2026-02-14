# AFeeree Certification Program

A mobile app for dancers and teachers participating in the AFeeree Dance Certification Program. This app supports in-class sessions, allows participants to submit assignments, and track their certification progress.

## Access Control

This app uses an **access code system** instead of app store payments. Users must enter a valid access code to use the app.

### How it works:
1. You (the admin) generate unique access codes in the app
2. You share a code with each participant when they pay/register
3. They enter the code on the access screen when first opening the app
4. Once verified, they can complete onboarding and use all app features

### Admin Panel:
Access the Admin Panel from the **Profile** screen to:
- **Generate new codes** - One tap creates a unique code (format: AF-XXXXXX)
- **Copy codes** - Instantly copy to clipboard
- **Share codes** - Share directly via text/email
- **Track usage** - See which codes are used and which are available
- **Delete unused codes** - Remove codes you no longer need

**Admin Password:** `BAKARI2024` (you can change this in `src/lib/accessCodeStore.ts`)

### Workflow:
1. Go to Profile > Admin Panel
2. Enter the admin password
3. Tap "Generate New Code" for each new participant
4. Share the code with them (copy/paste or share button)
5. They enter the code in the app to register

Each code can only be used once.

## Features

### Home Dashboard
- Welcome screen with personalized greeting
- Overall certification progress overview
- Quick stats (pending assignments)
- Continue learning section with current module
- Upcoming assignments preview
- Director & Legacy Keeper biography section for BaKari IfaSegun Lindsay
- Pull-to-refresh functionality
- Haptic feedback on all interactions

### Onboarding
- Beautiful two-step welcome flow for new users
- Collects name and email
- Sets enrollment date automatically
- Animated transitions between steps

### Access Code Screen
- Secure entry point for program participants
- Validates access codes against approved list
- Shake animation and haptic feedback on invalid codes
- Redirects to onboarding after successful verification

### Syllabus
- Browse all certification modules
- Filter by category (Technique, Theory, Teaching Practice, Research)
- Track progress for each module
- Locked/unlocked module states
- Video demonstration links
- View full syllabus PDF
- **Mandinka Terms** - Vocabulary reference with pronunciation
- **Practice Timer** - Track your practice sessions
- Pull-to-refresh and haptic feedback

### Module Detail
- View full module description and notation references
- **Mark lessons as complete** with persistent progress tracking
- **Notes feature** - Take personal notes for each module
- **Confetti celebration** when completing all lessons
- View PDF resources
- Progress bar showing completion status

### Assignments
- View all assignments with status filters
- Submit teaching practice videos
- Upload documents and reflections
- View grades and instructor feedback
- Multiple submission types (video, document, reflection)
- Pull-to-refresh and haptic feedback

### Profile
- View certification progress based on completed lessons
- Account information (name, email, enrollment date)
- Upload/change profile photo
- **Dark mode toggle** - Switch between light and dark themes
- Achievement stats (lessons completed, modules finished, assignments graded)
- **Achievements system** with progress tracking:
  - First Steps - Complete your first lesson
  - Dedicated Learner - Complete 10 lessons
  - Module Master - Complete your first module
  - Assignment Ace - Submit 5 assignments
  - On Fire - Study 7 days in a row
  - Certification Ready - Complete all requirements
- Pull-to-refresh and haptic feedback

### Feedback
- Two-way messaging between instructor and participants
- View all participants with their progress
- Send personalized feedback to each participant
- Participants can respond to feedback
- Message history with timestamps
- Real-time conversation view

## UX Enhancements

- **Haptic Feedback**: Light vibrations on all button taps for native feel
- **Pull-to-Refresh**: Swipe down on any screen to refresh content
- **Micro-interactions**: Button press animations with scale effects
- **Smooth Animations**: Fade-in and slide animations throughout
- **Confetti Celebration**: Animated confetti when completing a module
- **Skeleton Loading**: Placeholder UI while content loads
- **Persistent State**: All progress saved locally with Zustand & AsyncStorage

## Tech Stack

- Expo SDK 53 with React Native
- NativeWind (Tailwind CSS for React Native)
- React Native Reanimated for animations
- Expo Haptics for tactile feedback
- Expo Router for navigation
- Zustand for state management
- AsyncStorage for data persistence
- Lucide icons
- Playfair Display & DM Sans fonts
- RevenueCat for payments (Premium features)

## Color Palette

- **Primary**: Rich Chocolate Brown (#5C3D2E) - earthy, warm aesthetic from AFeeree logo
- **Accent**: Golden Amber (#C9963C) - sophisticated highlight color
- **Background**: Warm Cream (#FFF9F2) - inviting feel

## Project Structure

```
src/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Tab navigation
│   │   ├── index.tsx        # Home dashboard
│   │   ├── syllabus.tsx     # Curriculum modules
│   │   ├── assignments.tsx  # Assignment management
│   │   ├── profile.tsx      # User profile
│   │   └── feedback.tsx     # Two-way feedback messaging
│   ├── access-code.tsx      # Access code entry screen
│   ├── onboarding.tsx       # New user onboarding flow
│   ├── module/[id].tsx      # Module detail with lessons
│   └── _layout.tsx          # Root layout
├── components/
│   ├── HapticButton.tsx     # Reusable button with haptics & animations
│   ├── Skeleton.tsx         # Loading skeleton components
│   ├── ConfettiCelebration.tsx # Confetti celebration animation
│   ├── PracticeTimer.tsx    # Practice session timer
│   └── MandinkaTerms.tsx    # Mandinka vocabulary modal
└── lib/
    ├── theme.ts             # Color palette and styling constants
    ├── types.ts             # TypeScript interfaces
    ├── mockData.ts          # Course data and resources
    ├── userStore.ts         # Zustand store for user state
    └── cn.ts                # Tailwind class merge utility
```

## Web Distribution & Square Payments

This app supports web deployment with Square payment integration for self-managed distribution.

### New Web Pages
- **Landing Page** (`/landing`) - Marketing page for web visitors
- **Purchase Page** (`/purchase`) - Square payment integration with automatic access code generation
- **Access Code Page** (`/access-code`) - Where users enter their code after payment

### Setting Up Square Payments

1. **Create a Square Developer Account** at https://developer.squareup.com
2. **Create an Application** in the Square Developer Dashboard
3. **Get your credentials:**
   - Application ID (Sandbox for testing, Production for live)
   - Location ID (from your Square account)
4. **Add environment variables:**
   - `EXPO_PUBLIC_SQUARE_APP_ID` - Your Square Application ID
   - `EXPO_PUBLIC_SQUARE_LOCATION_ID` - Your Square Location ID

### Deploying to Your IONOS Domain

Since you're using Vibecode, you can deploy the web version using the **Share** button in the Vibecode app:

1. Click **Share** (top right corner of Vibecode app)
2. Select **Deploy to Web**
3. Follow the instructions to connect your IONOS domain

**Manual Deployment (Alternative):**

If you prefer to manually deploy:

**Step 1: Export for Web**
```bash
npx expo export --platform web
```

**Step 2: Upload to IONOS**
1. Log in to your IONOS account at https://my.ionos.com
2. Go to **Hosting** > **Webspace** > **File Manager** (or connect via FTP/SFTP)
3. Navigate to your website's root directory (usually `htdocs` or `public_html`)
4. Delete any existing files (backup first if needed)
5. Upload the entire contents of the `dist` folder

**Step 3: Upload .htaccess file**
The `.htaccess` file is already created in `public/.htaccess`. Upload it to your website root directory. This file:
- Enables SPA (Single Page Application) routing
- Allows Square payment integration
- Enables compression for faster loading
- Sets up caching for static assets

**Step 4: Configure Square in IONOS**
Add these environment variables to your IONOS hosting (if supported) or hardcode them in production:
- Replace sandbox URLs with production URLs in `purchase.web.tsx`
- Change `https://sandbox.web.squarecdn.com/v1/square.js` to `https://web.squarecdn.com/v1/square.js`

**IONOS FTP Settings (if needed):**
- Server: Your domain or ftp.your-domain.com
- Username: Your IONOS username
- Password: Your IONOS password
- Port: 21 (FTP) or 22 (SFTP)

### Payment Flow
1. Visitor lands on your website (landing page)
2. Clicks "Enroll Now" → goes to purchase page
3. Enters name/email, pays via Square
4. Receives access code automatically
5. Enters code to access the full program

### Customizing Price
Edit the `PROGRAM_PRICE` constant in `src/app/purchase.web.tsx` (currently set to $600).

### Important URLs
- `yourdomain.com/` → Landing page
- `yourdomain.com/purchase` → Payment page
- `yourdomain.com/access-code` → Access code entry

## Future Enhancements

- Backend integration for real data
- Video recording and upload functionality
- Push notifications for due dates
- Offline content caching
- Certificate generation upon completion
- Daily practice reminders
- Audio pronunciation for Mandinka terms (upload files via SOUNDS tab)
