# Chrome Web Store Listing — Jaipur Reels Explorer

> Last Updated: 2026-05-25

## Store Listing

**Extension Name**  
Jaipur Reels Explorer


**Short Description**  
Automate scrolling on Instagram Reels to filter and compile a curated list of reels related to the Pink City of Jaipur.


**Detailed Description**  
Explore and compile the best of Jaipur on Instagram Reels effortlessly!

Jaipur Reels Explorer is a premium, high-performance browser extension designed to help content creators, tourists, and travel enthusiasts filter Instagram Reels specifically related to the Pink City of Jaipur, Rajasthan. Running safely as a Chrome Side Panel, it connects directly with your active Instagram session—keeping your account 100% secure with no credentials sharing or bot-login blocks.

Key Features:
- Seamless Side-by-Side Dashboard: View your real-time results in Chrome's native Side Panel alongside the active feed.
- Intelligent Keyword Scanning: Instantly checks captions, locations, and hashtags for Jaipur attractions (e.g. Hawa Mahal, Amer Fort, Patrika Gate, Jal Mahal, Chokhi Dhani, local food/cafes).
- Adaptive Auto-Scrolling: Scrolls through Reels with a natural, human-like rhythm. You can fully customize the scrolling delay and target reel counts.
- Real-Time Progress Metrics: Track your total scanned reels, matching Jaipur reels, and live match rate percentage as the extension scrolls.
- Instant Export Options: Download your curated compilation in a single click in universal spreadsheet-friendly CSV or JSON formats.
- Complete Privacy: All scraping, filtering, and data compilation are done entirely locally on your machine. Your search remains private and your profile secure.

How to Use:
1. Open Google Chrome and navigate to instagram.com/reels. (Ensure you are logged in).
2. Click the Jaipur Reels Explorer extension icon in your toolbar to slide open the Side Panel.
3. Configure your scroll speed and target scan limit (e.g. 100 reels) in the parameters drawer.
4. Click "Start Scraper" and watch as the extension smoothly compiles your personalized Jaipur database!
5. Click "CSV" or "JSON" at the top to export your finished list.

Privacy & Security Note:
This extension respects your account security. It strictly runs inside your local browser context. Your login credentials are never requested, stored, or transmitted off-device. All compiled databases are saved in your local Chrome Storage and can be cleared in one click.

Support & Feedback:
For questions, feedback, or custom keyword suggestions, feel free to contact us or open an issue on our support portal.


**Category**  
Social & Communication


**Single Purpose**  
Scrolls and compiles a filtered list of Instagram Reels related to Jaipur.


**Primary Language**  
English


## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon | 128×128 PNG | ✅ Ready | `icons/icon-128.png` |
| Screenshot 1 | 1280×800 or 640×400 | ⬜ Not created | |
| Screenshot 2 | 1280×800 or 640×400 | ⬜ Not created | |
| Small Promo Tile | 440×280 | ⬜ Not created | |

### Screenshot Notes
- **Screenshot 1**: Showing the extension side panel open next to `instagram.com/reels`, with a few Jaipur Reels listed in the dashboard and the metrics displaying progress.
- **Screenshot 2**: Displaying the expanded parameters and custom keywords drawer, showing how users can customize their Jaipur filter list.


## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `sidePanel` | permissions | Used to host the dashboard interface inside the native Chrome Side Panel, allowing side-by-side interaction with Instagram Reels. |
| `storage` | permissions | Used to locally store scraping parameters, user-customized keywords, and the compiled list of matched Jaipur reels. |
| `scripting` | permissions | Used to execute the scrolling and DOM analysis logic securely inside the active Instagram Reels tab. |
| `tabs` | permissions | Used to locate and coordinate messages with the active Instagram tab context. |
| `https://www.instagram.com/*` | host_permissions | Required to access and interact with the Instagram Reels page to scroll and parse elements. |


## Privacy & Data Use

### Data Collection

**Does the extension collect user data?** No

All data (compiled reels, custom keywords) is stored strictly in the user's local Chrome sandbox (`chrome.storage.local`). No data is transmitted off-device, collected, or shared with third parties.

### Data Use Certification
- [x] Data is NOT sold to third parties
- [x] Data is NOT used for purposes unrelated to the extension's core functionality
- [x] Data is NOT used for creditworthiness or lending purposes


## Privacy Policy

**Privacy Policy URL**  
https://github.com/[your-username]/jaipur-reels-explorer/blob/main/PRIVACY.md


## Distribution

**Visibility**: Public  
**Regions**: All regions  
**Pricing**: Free  


## Developer Info

**Publisher Name**  
Jaipur Explorer Team

**Contact Email**  
support@jaipurexplorer.dev

**Homepage URL**  
https://jaipurexplorer.dev/extension


## Version History

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| 1.0.0 | 2026-05-25 | Initial release with side panel dashboard, real-time scraping, Jaipur filter, and CSV/JSON export. | Draft |


## Review Notes

### Known Issues / Limitations
- Requires a active, logged-in session on Instagram. If the user is logged out, the extension will slide through normal login prompts but won't be able to bypass them autonomously.
- Scrolling performance depends on the user's internet speed. Slower connections may require increasing the Scroll Rhythm Speed parameter to allow videos to load.
