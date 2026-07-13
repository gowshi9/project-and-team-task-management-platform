import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();
const port = env?.PORT || 4000;

app.listen(port, () => {
  console.log(`TeamFlow API listening on http://localhost:${port}`);
});
