import { createApiApp } from './app';
import { config } from './config';

const app = createApiApp();

app.listen(config.port, () => {
  console.log(`OrbitPay API is running on port ${config.port}`);
});
