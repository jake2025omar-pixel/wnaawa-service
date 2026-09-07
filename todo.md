# Wnaawa full-stack serverless conversion

- [x] Upgrade the static project to a lightweight full-stack backend-capable project.
- [x] Define safe server-side environment handling for the Telegram token without committing secrets.
- [x] Implement `POST /api/tickets` and `POST /api/telegram/webhook` with Telegram `sendMessage` delivery.
- [x] Add localStorage-backed points, tickets, rewards, orders, and payment-verification state starting from zero points.
- [x] Wire the points purchase flow to deduct points and create a real ticket.
- [x] Add a real `/admin` view for locally stored tickets and orders instead of hardcoded counts.
- [x] Add the A-ADS 2454518 footer placement and preserve relative `./` asset base for the static build.
- [x] Build, verify the local live code paths, configure the Telegram secret, and prepare the deployable code/artifacts safely.
- [x] Verify the Telegram webhook sender username or chat before saving the admin chat ID.
- [x] Persist reward/session availability in localStorage and derive the rewards metric from live state.
- [x] Add the actual safe A-ADS 2454518 embed snippet rather than only a text link.
- [ ] Register the deployed Telegram webhook URL and verify the real `/start` flow from the configured admin account.
- [ ] Verify the live `/api/tickets` endpoint and Telegram `sendMessage` delivery without committing the token.
- [x] Persist reward availability separately and drive the Watch UI from that stored state.
- [x] Register the free webhook URL without polling; deployed endpoint verification remains pending until the new checkpoint is live.
- [ ] Verify `POST /api/tickets` sends the live request to the configured admin chat and persists the ticket.
- [x] Finish the persisted reward-availability state and reflect it in the rewards UI.
- [x] Run final checks and save a checkpoint without committing any Telegram token.
