import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 5105);

createApp().listen(port, () => {
  console.log(`Corner Kiosk listening on http://localhost:${port}`);
});
