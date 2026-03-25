import express from 'express';
import cors from 'cors';
import vestingRoutes from './routes/vesting';
import proposalRoutes from './routes/proposals';
import historyRoutes from './routes/history';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/vesting', vestingRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api', historyRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
