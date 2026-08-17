# gretamatas

Build a simple, elegant, mobile-first wedding photo and video upload web app for Greta & Matas.

The app will be used by approximately 40 wedding guests. Guests will scan a QR code at the wedding and use the website to upload photos and videos they took during the celebration.

The entire experience must be extremely simple, intuitive, and suitable for people of all ages, including elderly guests who may not be comfortable using technology.

The app should use this architecture:

QR code → Lovable app → Supabase Storage → private wedding storage

Use Supabase Storage as the storage backend.

1. LANGUAGE SELECTION

The default language must be Lithuanian.

When a guest first opens the website, show a very simple language selection:

Pasirinkite kalbą

[ 🇱🇹 Lietuvių ]
[ 🇬🇧 English ]

After selecting a language, remember the choice on that device so the guest does not have to choose again.

The entire application must then be translated into the selected language.

IMPORTANT:

Do not translate only the main page.

Translate EVERYTHING, including:

buttons

upload screens

upload progress

success messages

error messages

retry messages

file selection messages

validation messages

loading states

accessibility labels

instructions

admin interface if applicable

Lithuanian should sound natural and human, not like a literal machine translation.

Use proper Lithuanian grammar, diacritics, and terminology.

2. MAIN PAGE

After selecting the language, show one extremely simple page.

At the top:

Greta & Matas

Then:

Užfiksuok akimirką

English version:

Capture a Moment

Lithuanian description:

Pasidalinkite gražiausiomis šventės akimirkomis su mumis ❤️

English:

Share your favorite moments from our special day ❤️

Include a subtle, elegant wedding-themed visual such as small hearts, delicate flowers, or a simple romantic photo-frame illustration.

Keep the design modern, elegant, minimal, and warm.

Do NOT make it look like a generic corporate file-upload website.

It should feel like a wedding.

3. MAIN BUTTON

The most important element on the page should be one large button.

Lithuanian:

📷 Pridėti nuotraukas ir vaizdo įrašus

English:

📷 Add Photos & Videos

Make the button very large and obvious.

The guest should immediately understand what they need to press.

Do not rely on an icon alone.

4. FILE SELECTION

When the guest taps the button, allow them to select media from their device.

Guests must be able to select multiple files at the same time.

For example, an iPhone user should be able to:

open their Photos/Gallery

select 5, 20, 50 or more photos/videos

confirm the selection

upload everything together

Do NOT force users to select and upload files one by one.

Support:

multiple photos

multiple videos

photos and videos together

selecting existing media from the phone gallery

iPhone

Android

tablets

desktop computers

5. SUPABASE STORAGE

Use Supabase Storage for all wedding media.

Create a dedicated bucket for the wedding, for example:

wedding-media

All guest uploads should be stored there.

Guests should NOT need a Supabase account.

Guests should NOT need to log in.

Guests should NOT need to enter:

name

email

password

phone number

any personal information

The guest simply selects their media and uploads it.

Use a secure architecture for anonymous/public uploads.

Never expose Supabase service-role credentials in the frontend.

The uploaded media should remain private from other guests.

Guests must not be able to browse, download, edit, or delete other guests' uploads.

6. FILE TYPES

Support common photo and video formats.

Photos:

JPG/JPEG

PNG

HEIC/HEIF

WebP

Videos:

MP4

MOV

common iPhone video formats

common Android video formats

Do not impose an unnecessarily small file-size limit.

The app should support large wedding videos as reliably as possible.

Do not artificially limit the number of files a guest can upload.

There should be no arbitrary limit such as "maximum 10 photos."

A guest should be able to upload many files during one session.

The actual storage capacity should be determined by the Supabase plan rather than by an artificial restriction in the application.

7. UPLOAD PROCESS

After selecting files, show a clean upload screen.

Lithuanian:

Keliame jūsų akimirkas… ❤️

English:

Uploading your memories… ❤️

Show:

number of files

upload progress

overall progress

individual progress where practical

thumbnails/previews for photos where practical

For example:

Įkelta 12 iš 24

English:

12 of 24 uploaded

Do not make the interface complicated.

8. RELIABLE UPLOADS

Wedding guests may have slow or unstable internet connections.

Design the upload system so that:

one failed file does not cancel all other uploads

successfully uploaded files remain uploaded

failed files can be retried

large videos are handled reliably

multiple files can upload efficiently

users don't have to restart the entire upload if one file fails

If appropriate, use resumable/multipart uploads supported by Supabase.

Do not route unnecessarily large files through the Lovable application server if direct-to-storage uploading is possible.

9. SUCCESS SCREEN

After all selected files have successfully uploaded, show:

Lithuanian:

Jūsų akimirkos saugios ❤️

Ačiū, kad pasidalinote savo prisiminimais su mumis!

English:

Your memories are safe ❤️

Thank you for sharing your memories with us!

Then show:

[ Pridėti daugiau ]

English:

[ Add More Photos & Videos ]

This should allow the guest to immediately select more photos/videos without refreshing the page.

A subtle heart or confetti animation is okay, but keep it elegant.

10. ERROR HANDLING

Errors must also be translated.

For example, Lithuanian:

Nepavyko įkelti šio failo.

Bandyti dar kartą

English:

This file could not be uploaded.

Try Again

Never show raw technical errors such as Supabase errors, API errors, or developer messages to guests.

The interface should explain problems in simple language.

11. ACCESSIBILITY / ELDERLY USERS

This is extremely important.

Design the interface so that an elderly guest can use it without needing someone else to explain it.

Use:

large text

large buttons

large tap targets

clear labels

high readability

generous spacing

simple language

obvious visual hierarchy

Avoid:

tiny text

tiny icons

complicated menus

hidden controls

unnecessary animations

technical terminology

confusing navigation

The user should understand the website immediately.

The ideal experience is:

Scan QR → choose language → tap one big button → select photos/videos → upload → done.

12. MOBILE FIRST

Most guests will use smartphones.

Prioritize:

iPhone Safari

Android Chrome

Also support:

iPad/tablets

desktop browsers

The page should look beautiful and function correctly on different screen sizes.

Do not require installation of an app.

The website must work directly from the QR code.

13. NO PUBLIC GALLERY

Do NOT create a public gallery.

Guests should only be able to upload.

They should not see what other guests uploaded.

The wedding couple should have access to all uploaded media privately through Supabase Storage.

14. OPTIONAL PRIVATE ADMIN PAGE

If it can be implemented cleanly, create a separate protected admin area for Greta & Matas.

The admin area can allow the couple to:

see uploaded files

preview photos

preview videos

download files

download multiple files

see upload dates/times

delete unwanted files

This must be completely separate from the guest experience.

Guests must never be able to access the admin area or other guests' files.

15. QR CODE

The website will be accessed through a QR code printed on wedding stationery/signage.

Create the app so the public guest URL is stable.

The QR code should simply open the wedding upload page.

Do not require:

app installation

account creation

login

password

email verification

The QR code experience should work immediately.

16. DESIGN DIRECTION

The overall aesthetic should be:

Elegant + romantic + minimal + Lithuanian wedding

Think:

warm ivory/cream background

subtle romantic details

elegant typography

small hearts

delicate floral elements

lots of whitespace

soft, refined appearance

Do not overdecorate it.

The website should NOT look like a template overloaded with wedding graphics.

The main focus should remain on the upload button.

17. FINAL GUEST FLOW

The complete Lithuanian experience should be:

Screen 1

Pasirinkite kalbą

🇱🇹 Lietuvių
🇬🇧 English

Screen 2

Greta & Matas

Užfiksuok akimirką

Pasidalinkite gražiausiomis šventės akimirkomis su mumis ❤️

[ 📷 Pridėti nuotraukas ir vaizdo įrašus ]

Screen 3

Guest selects multiple photos/videos.

Screen 4

Keliame jūsų akimirkas… ❤️

12 iš 24

Progress indicator.

Screen 5

Jūsų akimirkos saugios ❤️

Ačiū, kad pasidalinote savo prisiminimais su mumis!

[ Pridėti daugiau ]

The English version should follow exactly the same structure.

IMPORTANT FINAL INSTRUCTION

Do not over-engineer the user interface.

This is NOT a social media platform.

This is NOT a wedding website.

This is NOT a complicated file management application.

It is a very simple wedding memory upload page for approximately 40 guests.

Prioritize:

Simplicity

Reliability

Easy multi-file uploads

Large video support

Mobile usability

Lithuanian language

English language option

Private Supabase storage

Beautiful but minimal wedding design

The entire public guest experience should feel like:

“Scan → choose language → tap → select → upload → done ❤️”

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/24054f13-d36c-4249-af4d-4450ae3e54bd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
