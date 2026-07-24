

# MindLock — AI-Powered Daily Mindset App

## Design System
- **Dark theme**: Charcoal (#0F1117) background, soft navy cards (#1A1F2E), gold accent (#D4AF37), soft blue accent (#6C8EBF)
- **Typography**: Inter for UI, Georgia/serif for quotes, bold large numbers for streaks
- **Mobile-only viewport**: max-width 430px, centered, full height (100dvh)
- **Animations**: Framer Motion for all transitions — slide-ups, fades, scale effects, celebration particles

## Screen 1: Splash / Welcome
- Dark full-screen with app name "MindLock" in elegant typography
- Tagline: "Your mind first. Then your phone."
- Subtle animated lock icon or gradient pulse
- "Get Started" button with gold accent

## Screen 2: Onboarding — Set Your Focus
- Two sections with tappable pill chips (multi-select)
- **Goals**: Career, Fitness, Relationships, Mental Health, Wealth, Creativity
- **Blockers**: Anxiety, Procrastination, Self-Doubt, Burnout, Lack of Focus, Fear
- Selected chips glow with gold border/shadow
- "Continue" button

## Screen 3: Onboarding — Lock Your Distractions
- 2x3 grid of app icons (Instagram, TikTok, X, YouTube, Reddit, Snapchat)
- Tap to toggle with checkmark overlay + scale animation
- "Start My Journey" button
- Preferences saved locally (and to DB once authenticated)

## Screen 4: Main Unlock Flow (Hero Screen)
- Full-screen dark experience
- **Mood slider**: Horizontal emoji slider (😔 😐 😊 😤 🔥) — drag/tap, no typing
- After selection: 1-second loading pulse animation
- **Card slides up** with:
  - Curated quote in serif typography (matched to mood + goals)
  - AI-generated personalized message (2-3 sentences via Lovable AI edge function)
  - Micro-action card at bottom
  - Bookmark/save icon
- **"Unlock 🔓" button**: Satisfying press animation (scale + glow + haptic feel)
- After unlock: Streak counter animates +1 with particle celebration effect

## Screen 5: Home Screen
- Large centered streak number (big bold typography with subtle glow)
- "X apps locked" indicator
- Today's quote card
- Mood sparkline chart (last 7 days) using Recharts
- Gear icon top-right for settings
- No tabs, no nav bars — single clean screen

## Screen 6: Settings (slide-in panel)
- Manage locked apps
- Change goals/blockers
- Subscription status
- Notification preferences
- Sign out

## Screen 7: Paywall
- Triggered after 3 unlocks
- Free vs Pro comparison
- Pricing: $6.99/mo | $39.99/yr (highlighted) | $79.99 lifetime
- "Start Free Trial" CTA
- Clean, non-aggressive design

## Backend (Lovable Cloud / Supabase)
- **Auth**: Email + Google social login
- **Tables**: users (via auth), profiles (goals, blockers, locked_apps), check_ins (feeling, quote, ai_message), quotes (text, author, categories, feeling_match), streaks (current, longest, last_date)
- **Edge Function**: `mindset-coach` — calls Lovable AI with system prompt, passes user context (goals, blockers, feeling, streak), returns personalized message
- **Seed data**: 100+ quotes tagged by category and feeling match

## State Management
- React state + localStorage for onboarding flow before auth
- Supabase for persistent data after sign-up
- Streak logic: check last_date, increment if new day, reset if gap > 1 day

## Key Libraries
- Framer Motion (animations)
- Recharts (mood sparkline)
- Lucide icons
- Date-fns for streak calculations

